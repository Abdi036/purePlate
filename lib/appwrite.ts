import {
  Account,
  Client,
  Databases,
  ID,
  Models,
  Query,
  Storage,
} from "appwrite";

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";

export const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
const restaurantsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_RESTAURANTS_COLLECTION_ID ?? "";
const foodsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID ?? "";

const foodImagesBucketId =
  process.env.EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID ??
  process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID ??
  "";

export type UserRole = "customer" | "restaurant";
export type UserPrefs = {
  role?: UserRole;
  scannedRestaurantIds?: string[];
};

export async function appwriteSignUp(params: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<Models.User<Models.Preferences>> {
  const { name, email, password, role } = params;
  await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession({ email, password });

  if (role) {
    await account.updatePrefs<UserPrefs>({
      prefs: { role, scannedRestaurantIds: [] },
    });
  }

  return account.get();
}

export async function appwriteSignIn(params: {
  email: string;
  password: string;
}): Promise<Models.User<Models.Preferences>> {
  const { email, password } = params;
  await account.createEmailPasswordSession({ email, password });
  return account.get();
}

export async function appwriteGetCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function appwriteGetPrefs(): Promise<UserPrefs> {
  return await account.getPrefs<UserPrefs>();
}

export async function appwriteUpdatePrefs(
  prefs: UserPrefs,
): Promise<Models.User<Models.Preferences>> {
  return await account.updatePrefs<UserPrefs>({ prefs });
}

export async function appwriteSignOut(): Promise<void> {
  await account.deleteSession("current");
}

export type Restaurant = Models.Document & {
  name?: string;
};

export async function appwriteListRestaurantsByIds(
  ids: string[],
): Promise<Restaurant[]> {
  if (!databaseId || !restaurantsCollectionId || ids.length === 0) return [];

  const result = await databases.listDocuments<Restaurant>(
    databaseId,
    restaurantsCollectionId,
    [Query.equal("$id", ids)],
  );
  return result.documents;
}

export type FoodInput = {
  name: string;
  ingredients: string[];
  cookTimeMinutes: number;
  price: number;
  imageFileId: string;
};

export type FoodDoc = Models.Document &
  FoodInput & {
    restaurantUserId: string;
  };

export async function appwriteGetFoodById(params: {
  foodId: string;
}): Promise<FoodDoc | null> {
  if (!databaseId || !foodsCollectionId) return null;

  const { foodId } = params;
  if (!foodId) return null;

  try {
    return await databases.getDocument<FoodDoc>(
      databaseId,
      foodsCollectionId,
      foodId,
    );
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const code = typeof err?.code === "number" ? err.code : undefined;
    if (code === 404 || message.toLowerCase().includes("not found")) {
      return null;
    }
    throw err;
  }
}

export async function appwriteListFoodsForRestaurant(params: {
  userId: string;
}): Promise<FoodDoc[]> {
  if (!databaseId || !foodsCollectionId) return [];

  const { userId } = params;
  try {
    const result = await databases.listDocuments<FoodDoc>(
      databaseId,
      foodsCollectionId,
      [Query.equal("restaurantUserId", userId)],
    );
    return result.documents;
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    if (message.includes("Attribute not found in schema")) {
      throw new Error(
        "Appwrite foods collection is missing required attribute 'restaurantUserId'. Add it in Appwrite Console → Databases → your DB → Foods collection → Attributes, then try again.",
      );
    }
    throw err;
  }
}

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

export async function appwriteUploadFoodImage(params: {
  image: PickedImage;
}): Promise<{ fileId: string }> {
  if (!foodImagesBucketId) {
    throw new Error(
      "Missing Appwrite Storage bucket. Set EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID (or EXPO_PUBLIC_APPWRITE_BUCKET_ID).",
    );
  }
  if (!endpoint || !projectId) {
    throw new Error(
      "Missing Appwrite config. Set EXPO_PUBLIC_APPWRITE_ENDPOINT and EXPO_PUBLIC_APPWRITE_PROJECT_ID.",
    );
  }

  const { image } = params;
  const fileId = ID.unique();

  // In Expo/React Native, the Appwrite Web SDK file upload support can vary.
  // We try SDK upload first, then fall back to the REST API with FormData.
  try {
    await storage.createFile(foodImagesBucketId, fileId, image as any);
    return { fileId };
  } catch {
    const url = `${endpoint}/storage/buckets/${foodImagesBucketId}/files`;
    const form = new FormData();
    form.append("fileId", fileId);
    form.append("file", image as any);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": projectId,
      },
      body: form,
      credentials: "include" as any,
    });

    if (!res.ok) {
      let message = "Unable to upload image.";
      try {
        const json = await res.json();
        if (typeof json?.message === "string") message = json.message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return { fileId };
  }
}

export function appwriteGetFoodImageViewUrl(fileId: string): string | null {
  if (!foodImagesBucketId || !fileId) return null;
  try {
    const view = storage.getFileView(foodImagesBucketId, fileId) as unknown;
    if (typeof view === "string") return view;
    return String(view);
  } catch {
    // Fallback: this URL relies on a session cookie.
    return `${endpoint}/storage/buckets/${foodImagesBucketId}/files/${fileId}/view`;
  }
}

export async function appwriteCreateFood(params: {
  userId: string;
  food: FoodInput;
}): Promise<FoodDoc> {
  if (!databaseId || !foodsCollectionId) {
    throw new Error(
      "Missing Appwrite DB config. Set EXPO_PUBLIC_APPWRITE_DATABASE_ID and EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID.",
    );
  }

  const { userId, food } = params;
  // Explicitly map fields to avoid accidentally sending extra keys.
  const data = {
    name: food.name,
    ingredients: food.ingredients,
    cookTimeMinutes: food.cookTimeMinutes,
    price: food.price,
    imageFileId: food.imageFileId,
    restaurantUserId: userId,
  };

  try {
    return await databases.createDocument<FoodDoc>(
      databaseId,
      foodsCollectionId,
      ID.unique(),
      data,
    );
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    if (
      message.includes("Invalid document structure") &&
      message.includes("unknown attribute")
    ) {
      throw new Error(
        "Appwrite foods collection schema does not match the fields this app sends. In Appwrite Console → Databases → your DB → Foods collection → Attributes, add these keys: name (string), ingredients (string[]), cookTimeMinutes (integer), price (double), imageFileId (string), restaurantUserId (string).",
      );
    }
    throw err;
  }
}
