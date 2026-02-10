# PurePlate

PurePlate is an **Expo (React Native) app** that helps people make safer, cleaner food choices by connecting **customers** and **restaurants**:

- **Customers** can scan restaurant QR codes, browse menus, and get **best‑effort allergy/dislike warnings** based on ingredients.
- **Restaurants** can create and manage their menu: **add foods (with images)**, edit details, and **pause/unpause availability**.

Built with **Expo Router** (file-based navigation), **NativeWind/Tailwind** styling, and **Appwrite** for auth, database, and storage.

---

## Features

### Customer

- Scan restaurant QR codes (camera) and save restaurants for quick access: [app/(tabs)/scan/index.tsx](<app/(tabs)/scan/index.tsx>)
- Browse a restaurant’s menu and optionally filter by price: [app/(tabs)/home/restaurant/[restaurantId].tsx](<app/(tabs)/home/restaurant/[restaurantId].tsx>)
- Ingredient “health check” against saved allergy/dislike lists: [app/(tabs)/home/[foodId].tsx](<app/(tabs)/home/[foodId].tsx>)
- Manage allergy/dislike preferences: [app/(tabs)/profile/index.tsx](<app/(tabs)/profile/index.tsx>)

### Restaurant

- Create foods with images (uploads to Appwrite Storage): [app/(tabs)/add-food/index.tsx](<app/(tabs)/add-food/index.tsx>)
- View “Your foods” list: [app/(tabs)/home/index.tsx](<app/(tabs)/home/index.tsx>)
- Edit food details, delete items, toggle availability: [app/(tabs)/home/[foodId].tsx](<app/(tabs)/home/[foodId].tsx>)

### Auth + Profiles

- Signup/login flows:
  - [app/(auth)/signup/index.tsx](<app/(auth)/signup/index.tsx>)
  - [app/(auth)/login/index.tsx](<app/(auth)/login/index.tsx>)
- Auth state + profile prefs wired through: [`context.AuthProvider`](context/AuthContext.tsx) in [context/AuthContext.tsx](context/AuthContext.tsx)
- Appwrite integration lives in: [lib/appwrite.ts](lib/appwrite.ts)

---

## Tech Stack

- **Expo + React Native**
- **Expo Router** navigation: [app/\_layout.tsx](app/_layout.tsx), [app/(tabs)/\_layout.tsx](<app/(tabs)/_layout.tsx>)
- **NativeWind + Tailwind**: [tailwind.config.js](tailwind.config.js), [global.css](global.css), [metro.config.js](metro.config.js)
- **Appwrite**:
  - Auth + prefs: [`lib.appwriteSignUp`](lib/appwrite.ts), [`lib.appwriteSignIn`](lib/appwrite.ts), [`lib.appwriteUpdatePrefs`](lib/appwrite.ts)
  - Foods DB: [`lib.appwriteCreateFood`](lib/appwrite.ts), [`lib.appwriteUpdateFood`](lib/appwrite.ts), [`lib.appwriteListFoodsForRestaurant`](lib/appwrite.ts)
  - Image storage: [`lib.appwriteUploadFoodImage`](lib/appwrite.ts), [`lib.appwriteGetFoodImageViewUrl`](lib/appwrite.ts)

---

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the project root and set:

```bash
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID

EXPO_PUBLIC_APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
EXPO_PUBLIC_APPWRITE_FOODS_COLLECTION_ID=YOUR_FOODS_COLLECTION_ID
EXPO_PUBLIC_APPWRITE_RESTAURANTS_COLLECTION_ID=YOUR_RESTAURANTS_COLLECTION_ID

# Preferred (or use EXPO_PUBLIC_APPWRITE_BUCKET_ID as fallback)
EXPO_PUBLIC_APPWRITE_FOOD_IMAGES_BUCKET_ID=YOUR_BUCKET_ID
```

Appwrite client setup is in: [lib/appwrite.ts](lib/appwrite.ts)

### 3) Run the app

```bash
npx expo start
```

---

## Appwrite Setup

### Storage (food images)

Create a bucket for food images and allow authenticated users to **create/read**.

Uploads are handled by [`lib.appwriteUploadFoodImage`](lib/appwrite.ts).  
It attempts SDK upload first, then falls back to a REST `FormData` upload for Expo compatibility.

### Database (foods collection)

Create a foods collection with attributes (names must match):

- `name` (string)
- `ingredients` (string array)
- `cookTimeMinutes` (integer)
- `price` (double)
- `imageFileId` (string)
- `available` (boolean)
- `restaurantUserId` (string)

The app reads/writes these fields via:

- [`lib.appwriteCreateFood`](lib/appwrite.ts)
- [`lib.appwriteUpdateFood`](lib/appwrite.ts)
- [`lib.appwriteListFoodsForRestaurant`](lib/appwrite.ts)

**Permissions (simple starting point)**:

- Collection: authenticated users can **create/read/update/delete**
- Bucket: authenticated users can **create/read**

> Note: For production, restrict writes so restaurants can only modify their own foods.

### Database (restaurants collection)

Restaurants are created/upserted when a user has role `"restaurant"` via:

- [`lib.appwriteUpsertRestaurant`](lib/appwrite.ts)
- Triggered from [`context.AuthProvider.refresh`](context/AuthContext.tsx)

---

## Roles & Preferences

User role and preference lists are stored in Appwrite **account prefs**:

- `role`: `"customer"` or `"restaurant"`
- `scannedRestaurantIds`: string[]
- `allergicIngredients`: string[]
- `dislikedIngredients`: string[]

Handled by:

- [`lib.appwriteGetPrefs`](lib/appwrite.ts)
- [`lib.appwriteUpdatePrefs`](lib/appwrite.ts)

Profile UI: [app/(tabs)/profile/index.tsx](<app/(tabs)/profile/index.tsx>)

---

## Project Structure (high level)

- `app/` — routes & screens (Expo Router)
  - `(auth)/` — auth flow screens
  - `(tabs)/` — main app tabs (home/scan/profile/add-food)
- `context/` — auth state + actions: [context/AuthContext.tsx](context/AuthContext.tsx)
- `lib/` — Appwrite + caching utilities: [lib/appwrite.ts](lib/appwrite.ts), [lib/cache.ts](lib/cache.ts)
- `components/` — reusable UI building blocks: [components/FormField.tsx](components/FormField.tsx)

---

## Common Scripts

```bash
npx expo start
npm run lint
```

(See [package.json](package.json) for the full list.)

---

## Notes / Troubleshooting

- If food listing fails with “Attribute not found in schema”, ensure `restaurantUserId` exists in the foods schema (used by [`lib.appwriteListFoodsForRestaurant`](lib/appwrite.ts)).
- If food creation fails with “Invalid document structure / unknown attribute”, ensure the foods collection attributes match what the app sends (see [`lib.appwriteCreateFood`](lib/appwrite.ts)).
- If images don’t show, confirm the bucket ID env var is set and the bucket allows reads (see [`lib.appwriteGetFoodImageViewUrl`](lib/appwrite.ts)).

---

## License

Add a license if/when you’re ready to publish.
