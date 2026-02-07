import { Account, Client, Databases, ID, Models, Query } from "appwrite";

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";

export const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
const restaurantsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_RESTAURANTS_COLLECTION_ID ?? "";
const foodsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID ?? "";

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
  imageUrl: string;
};

export type FoodDoc = Models.Document &
  FoodInput & {
    restaurantUserId: string;
  };

export async function appwriteListFoodsForRestaurant(params: {
  userId: string;
}): Promise<FoodDoc[]> {
  if (!databaseId || !foodsCollectionId) return [];

  const { userId } = params;
  const result = await databases.listDocuments<FoodDoc>(
    databaseId,
    foodsCollectionId,
    [Query.equal("restaurantUserId", userId)],
  );
  return result.documents;
}

export async function appwriteCreateFood(params: {
  userId: string;
  food: FoodInput;
}): Promise<Models.Document> {
  if (!databaseId || !foodsCollectionId) {
    throw new Error(
      "Missing Appwrite DB config. Set EXPO_PUBLIC_APPWRITE_DATABASE_ID and EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID.",
    );
  }

  const { userId, food } = params;
  return await databases.createDocument(
    databaseId,
    foodsCollectionId,
    ID.unique(),
    {
      ...food,
      restaurantUserId: userId,
    },
  );
}
