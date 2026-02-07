import { Account, Client, Databases, ID, Models } from "appwrite";

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";

export const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

export async function appwriteSignUp(params: {
  name: string;
  email: string;
  password: string;
}): Promise<Models.User<Models.Preferences>> {
  const { name, email, password } = params;
  await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession({ email, password });
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

export async function appwriteSignOut(): Promise<void> {
  await account.deleteSession("current");
}
