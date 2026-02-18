import {
    Account,
    Client,
    Databases,
    ID,
    Models,
    Query,
    Storage,
} from "appwrite";
import { TTLCache } from "./cache";

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
const reviewsCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID ?? "reviews";

const foodImagesBucketId =
  process.env.EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID ??
  process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID ??
  "";

export type UserRole = "customer" | "restaurant";
export type UserPrefs = {
  role?: UserRole;
  scannedRestaurantIds?: string[];
  allergicIngredients?: string[];
  dislikedIngredients?: string[];
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
      prefs: {
        role,
        scannedRestaurantIds: [],
        allergicIngredients: [],
        dislikedIngredients: [],
      },
    });
  }

  const current = await account.get();
  if (role === "restaurant") {
    try {
      await appwriteUpsertRestaurant({
        userId: current.$id,
        name: current.name,
      });
    } catch (err: any) {
      console.warn(
        "Unable to create restaurant profile:",
        typeof err?.message === "string" ? err.message : err,
      );
    }
  }
  return current;
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

export async function appwriteUpdateName(params: {
  name: string;
}): Promise<Models.User<Models.Preferences>> {
  const nextName = typeof params.name === "string" ? params.name.trim() : "";
  if (!nextName) {
    throw new Error("Name cannot be empty.");
  }
  // Appwrite Account API updates the name on the current user.
  return await account.updateName(nextName);
}

export async function appwriteSignOut(): Promise<void> {
  await account.deleteSession("current");
}

export type Restaurant = Models.Document & {
  name?: string;
};

const RESTAURANTS_BY_IDS_TTL_MS = 5 * 60 * 1000;
const FOODS_FOR_RESTAURANT_TTL_MS = 2 * 60 * 1000;
const FOOD_BY_ID_TTL_MS = 5 * 60 * 1000;

const restaurantsByIdsCache = new TTLCache<Restaurant[]>();
const foodsForRestaurantCache = new TTLCache<FoodDoc[]>();
const foodByIdCache = new TTLCache<FoodDoc | null>();

function normalizeIdsKey(ids: string[]): string {
  return ids.filter(Boolean).slice().sort().join(",");
}

export async function appwriteUpsertRestaurant(params: {
  userId: string;
  name?: string;
}): Promise<void> {
  if (!databaseId || !restaurantsCollectionId) return;

  const { userId, name } = params;
  if (!userId) return;

  const nextName = typeof name === "string" ? name.trim() : "";

  try {
    const existing = await databases.getDocument<Restaurant>(
      databaseId,
      restaurantsCollectionId,
      userId,
    );

    const existingName =
      typeof existing?.name === "string" ? existing.name : "";
    if (nextName && nextName !== existingName) {
      await databases.updateDocument<Restaurant>(
        databaseId,
        restaurantsCollectionId,
        userId,
        { name: nextName },
      );
    }
  } catch (err: any) {
    const code = typeof err?.code === "number" ? err.code : undefined;
    const message = typeof err?.message === "string" ? err.message : "";
    if (code !== 404 && !message.toLowerCase().includes("not found")) {
      throw err;
    }

    try {
      await databases.createDocument<Restaurant>(
        databaseId,
        restaurantsCollectionId,
        userId,
        { name: nextName },
      );
    } catch (createErr: any) {
      const createCode =
        typeof createErr?.code === "number" ? createErr.code : undefined;
      if (createCode === 409) return;
      throw createErr;
    }
  } finally {
    restaurantsByIdsCache.clear();
  }
}

export function appwritePeekRestaurantsByIds(
  ids: string[],
): Restaurant[] | undefined {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return restaurantsByIdsCache.get(`restaurantsByIds:${normalizeIdsKey(ids)}`);
}

export async function appwriteListRestaurantsByIds(
  ids: string[],
): Promise<Restaurant[]> {
  if (!databaseId || !restaurantsCollectionId || ids.length === 0) return [];

  const cacheKey = `restaurantsByIds:${normalizeIdsKey(ids)}`;
  const cached = restaurantsByIdsCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const result = await databases.listDocuments<Restaurant>(
    databaseId,
    restaurantsCollectionId,
    [Query.equal("$id", ids)],
  );
  const docs = result.documents;
  if (docs.length > 0) {
    restaurantsByIdsCache.set(cacheKey, docs, RESTAURANTS_BY_IDS_TTL_MS);
  }
  return docs;
}

export type FoodInput = {
  name: string;
  ingredients: string[];
  cookTimeMinutes: number;
  price: number;
  imageFileId: string;
  available?: boolean;
};

export type FoodDoc = Models.Document &
  FoodInput & {
    restaurantUserId: string;
  };

export function appwritePeekFoodById(
  foodId: string,
): FoodDoc | null | undefined {
  if (!foodId) return undefined;
  return foodByIdCache.get(`foodById:${foodId}`);
}

export function appwritePeekFoodsForRestaurant(
  userId: string,
): FoodDoc[] | undefined {
  if (!userId) return undefined;
  return foodsForRestaurantCache.get(`foodsForRestaurant:${userId}`);
}

export async function appwriteGetFoodById(params: {
  foodId: string;
}): Promise<FoodDoc | null> {
  if (!databaseId || !foodsCollectionId) return null;

  const { foodId } = params;
  if (!foodId) return null;

  const cacheKey = `foodById:${foodId}`;
  const cached = foodByIdCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const doc = await databases.getDocument<FoodDoc>(
      databaseId,
      foodsCollectionId,
      foodId,
    );
    foodByIdCache.set(cacheKey, doc, FOOD_BY_ID_TTL_MS);
    return doc;
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    const code = typeof err?.code === "number" ? err.code : undefined;
    if (code === 404 || message.toLowerCase().includes("not found")) {
      foodByIdCache.set(cacheKey, null, 30 * 1000);
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
  const cacheKey = `foodsForRestaurant:${userId}`;
  const cached = foodsForRestaurantCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const result = await databases.listDocuments<FoodDoc>(
      databaseId,
      foodsCollectionId,
      [Query.equal("restaurantUserId", userId)],
    );
    const docs = result.documents;
    foodsForRestaurantCache.set(cacheKey, docs, FOODS_FOR_RESTAURANT_TTL_MS);
    return docs;
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
    available: typeof food.available === "boolean" ? food.available : true,
    restaurantUserId: userId,
  };

  try {
    const created = await databases.createDocument<FoodDoc>(
      databaseId,
      foodsCollectionId,
      ID.unique(),
      data,
    );

    // Keep caches consistent so the Home list/detail don't refetch immediately.
    foodsForRestaurantCache.delete(`foodsForRestaurant:${userId}`);
    foodByIdCache.set(`foodById:${created.$id}`, created, FOOD_BY_ID_TTL_MS);
    return created;
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    if (
      message.includes("Invalid document structure") &&
      message.includes("unknown attribute")
    ) {
      throw new Error(
        "Appwrite foods collection schema does not match the fields this app sends. In Appwrite Console → Databases → your DB → Foods collection → Attributes, add these keys: name (string), ingredients (string[]), cookTimeMinutes (integer), price (double), imageFileId (string), available (boolean), restaurantUserId (string).",
      );
    }
    throw err;
  }
}

export async function appwriteUpdateFood(params: {
  userId: string;
  foodId: string;
  food: Pick<
    FoodInput,
    "name" | "ingredients" | "cookTimeMinutes" | "price"
  > & {
    available?: boolean;
  };
}): Promise<FoodDoc> {
  if (!databaseId || !foodsCollectionId) {
    throw new Error(
      "Missing Appwrite DB config. Set EXPO_PUBLIC_APPWRITE_DATABASE_ID and EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID.",
    );
  }

  const { userId, foodId, food } = params;
  if (!foodId) throw new Error("Missing food id.");

  const data = {
    name: food.name,
    ingredients: food.ingredients,
    cookTimeMinutes: food.cookTimeMinutes,
    price: food.price,
    available: typeof food.available === "boolean" ? food.available : undefined,
  };

  let updated: FoodDoc;
  try {
    updated = await databases.updateDocument<FoodDoc>(
      databaseId,
      foodsCollectionId,
      foodId,
      data,
    );
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    if (
      message.includes("Invalid document structure") &&
      message.includes("unknown attribute")
    ) {
      throw new Error(
        "Appwrite foods collection schema does not match the fields this app updates. In Appwrite Console → Databases → your DB → Foods collection → Attributes, add these keys: name (string), ingredients (string[]), cookTimeMinutes (integer), price (double), available (boolean).",
      );
    }
    throw err;
  }

  foodsForRestaurantCache.delete(`foodsForRestaurant:${userId}`);
  foodByIdCache.set(`foodById:${foodId}`, updated, FOOD_BY_ID_TTL_MS);
  return updated;
}

export async function appwriteDeleteFood(params: {
  userId: string;
  foodId: string;
}): Promise<void> {
  if (!databaseId || !foodsCollectionId) {
    throw new Error(
      "Missing Appwrite DB config. Set EXPO_PUBLIC_APPWRITE_DATABASE_ID and EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID.",
    );
  }

  const { userId, foodId } = params;
  if (!foodId) return;

  await databases.deleteDocument(databaseId, foodsCollectionId, foodId);

  foodsForRestaurantCache.delete(`foodsForRestaurant:${userId}`);
  foodByIdCache.delete(`foodById:${foodId}`);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type ReviewDoc = Models.Document & {
  foodId: string;
  restaurantUserId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1–5
  comment: string;
};

const REVIEWS_TTL_MS = 2 * 60 * 1000;
const reviewsForFoodCache = new TTLCache<ReviewDoc[]>();

export function appwritePeekReviewsForFood(
  foodId: string,
): ReviewDoc[] | undefined {
  if (!foodId) return undefined;
  return reviewsForFoodCache.get(`reviewsForFood:${foodId}`);
}

export async function appwriteListReviewsForFood(params: {
  foodId: string;
}): Promise<ReviewDoc[]> {
  if (!databaseId || !reviewsCollectionId) return [];
  const { foodId } = params;
  if (!foodId) return [];

  const cacheKey = `reviewsForFood:${foodId}`;
  const cached = reviewsForFoodCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const result = await databases.listDocuments<ReviewDoc>(
      databaseId,
      reviewsCollectionId,
      [Query.equal("foodId", foodId), Query.orderDesc("$createdAt")],
    );
    const docs = result.documents;
    reviewsForFoodCache.set(cacheKey, docs, REVIEWS_TTL_MS);
    return docs;
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "";
    if (
      message.includes("Collection with the requested ID could not be found") ||
      message.includes("not found")
    ) {
      // Reviews collection not yet created — return empty gracefully.
      return [];
    }
    throw err;
  }
}

export async function appwriteCreateReview(params: {
  foodId: string;
  restaurantUserId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
}): Promise<ReviewDoc> {
  if (!databaseId || !reviewsCollectionId) {
    throw new Error(
      "Missing Appwrite DB config for reviews. Set EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID.",
    );
  }
  const { foodId, restaurantUserId, customerId, customerName, rating, comment } =
    params;

  const created = await databases.createDocument<ReviewDoc>(
    databaseId,
    reviewsCollectionId,
    ID.unique(),
    { foodId, restaurantUserId, customerId, customerName, rating, comment },
  );

  // Bust cache so next fetch is fresh.
  reviewsForFoodCache.delete(`reviewsForFood:${foodId}`);
  return created;
}

export async function appwriteUpdateReview(params: {
  reviewId: string;
  foodId: string;
  rating: number;
  comment: string;
}): Promise<ReviewDoc> {
  if (!databaseId || !reviewsCollectionId) {
    throw new Error("Missing Appwrite DB config for reviews.");
  }
  const { reviewId, foodId, rating, comment } = params;

  const updated = await databases.updateDocument<ReviewDoc>(
    databaseId,
    reviewsCollectionId,
    reviewId,
    { rating, comment },
  );

  reviewsForFoodCache.delete(`reviewsForFood:${foodId}`);
  return updated;
}

export async function appwriteDeleteReview(params: {
  reviewId: string;
  foodId: string;
}): Promise<void> {
  if (!databaseId || !reviewsCollectionId) return;
  const { reviewId, foodId } = params;
  await databases.deleteDocument(databaseId, reviewsCollectionId, reviewId);
  reviewsForFoodCache.delete(`reviewsForFood:${foodId}`);
}
