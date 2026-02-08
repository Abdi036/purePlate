# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Appwrite (Signup/Login)

Create a `.env` file (see `.env.example`) and set:

- `EXPO_PUBLIC_APPWRITE_ENDPOINT` (default: `https://cloud.appwrite.io/v1`)
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`

## Appwrite (Add Food)

To save foods (including an image picked from the device), you need **Appwrite Database + Storage** configured.

### 1) Storage (food images)

- Create a **Storage Bucket** (e.g. `food-images`).
- Copy the **Bucket ID** and set one of:
  - `EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID` (preferred)
  - or keep using your existing `EXPO_PUBLIC_APPWRITE_BUCKET_ID` (fallback supported)

### 2) Database + Collection (foods)

- Create a **Database** and a **Collection** for foods.
- Set env vars:
  - `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
  - `EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID`

Suggested attributes for the foods collection (names must match):

- `name` (string)
- `ingredients` (string, **array enabled**)
- `cookTimeMinutes` (integer)
- `price` (double)
- `imageFileId` (string)
- `restaurantUserId` (string)

Permissions (simple starting point):

- Collection: allow authenticated users to **create/read**.
- Bucket: allow authenticated users to **create/read**.

Once that’s set, the Add Food screen will:

- Pick an image from your phone
- Upload it to Storage
- Save a food document in the foods collection with `imageFileId`

Auth screens are wired to Appwrite:

- Signup: `app/(auth)/signup/index.tsx`
- Login: `app/(auth)/login/index.tsx`

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
