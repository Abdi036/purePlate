import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import {
  appwriteGetFoodImageViewUrl,
  appwriteListFoodsForRestaurant,
  appwriteListRestaurantsByIds,
  appwritePeekFoodsForRestaurant,
  appwritePeekRestaurantsByIds,
  FoodDoc,
  Restaurant,
} from "../../../lib/appwrite";

export default function HomeTab() {
  const { user, prefs, isLoading } = useAuth();
  const role = prefs?.role;
  const scannedIds = useMemo(() => {
    return prefs?.scannedRestaurantIds ?? [];
  }, [prefs?.scannedRestaurantIds]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);

  const [foods, setFoods] = useState<FoodDoc[]>([]);
  const [isFetchingFoods, setIsFetchingFoods] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (role !== "customer") return;
    if (scannedIds.length === 0) {
      setRestaurants([]);
      return;
    }

    const cached = appwritePeekRestaurantsByIds(scannedIds);
    if (cached !== undefined) {
      setRestaurants(cached);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setIsFetchingRestaurants(true);
        const result = await appwriteListRestaurantsByIds(scannedIds);
        if (mounted) setRestaurants(result);
      } finally {
        if (mounted) setIsFetchingRestaurants(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLoading, role, scannedIds]);

  const loadFoods = useCallback(async () => {
    if (!user) return;

    const cached = appwritePeekFoodsForRestaurant(user.$id);
    if (cached !== undefined) {
      setFoods(cached);
      return;
    }

    try {
      setIsFetchingFoods(true);
      const result = await appwriteListFoodsForRestaurant({ userId: user.$id });
      setFoods(result);
    } catch (err: any) {
      console.warn(
        "Unable to load foods:",
        typeof err?.message === "string" ? err.message : err,
      );
      setFoods([]);
    } finally {
      setIsFetchingFoods(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (role !== "restaurant") return;
      if (!user) return;
      void loadFoods();
    }, [loadFoods, role, user]),
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">Home</Text>

        {isLoading ? (
          <Text className="text-slate-500 mt-2">Loading...</Text>
        ) : !user ? (
          <Text className="text-slate-500 mt-2">Not signed in.</Text>
        ) : role === "customer" ? (
          <View className="mt-6">
            {scannedIds.length === 0 ? (
              <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <Text className="text-slate-900 font-semibold">
                  Scan a restaurant QR code
                </Text>
                <Text className="text-slate-500 mt-2">
                  You don’t have any restaurants yet.
                </Text>
                <Link href="/(tabs)/scan" className="mt-4">
                  <Text className="text-emerald-600 font-bold">Go to Scan</Text>
                </Link>
              </View>
            ) : (
              <View className="gap-y-3">
                <Text className="text-slate-700 font-medium">
                  Your Restaurants
                </Text>

                {isFetchingRestaurants ? (
                  <Text className="text-slate-500">Loading restaurants...</Text>
                ) : restaurants.length > 0 ? (
                  restaurants.map((r) => (
                    <Link
                      key={r.$id}
                      href={{
                        pathname:
                          "/(tabs)/home/restaurant/[restaurantId]" as any,
                        params: { restaurantId: r.$id },
                      }}
                      asChild
                    >
                      <TouchableOpacity className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <Text className="text-slate-900 font-semibold">
                          {r.name || r.$id}
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  ))
                ) : (
                  <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <Text className="text-slate-900 font-semibold">
                      Scanned restaurant IDs
                    </Text>
                    <Text className="text-slate-500 mt-2">
                      Configure Appwrite DB env vars to load names.
                    </Text>
                    {scannedIds.map((id) => (
                      <Link
                        key={id}
                        href={{
                          pathname:
                            "/(tabs)/home/restaurant/[restaurantId]" as any,
                          params: { restaurantId: id },
                        }}
                        asChild
                      >
                        <TouchableOpacity className="mt-3">
                          <Text className="text-slate-700">{id}</Text>
                        </TouchableOpacity>
                      </Link>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : role === "restaurant" ? (
          <View className="mt-6">
            <Text className="text-slate-700 font-medium">Your Foods</Text>

            <View className="mt-4 gap-y-3">
              {isFetchingFoods ? (
                <Text className="text-slate-500">Loading foods...</Text>
              ) : foods.length === 0 ? (
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <Text className="text-slate-900 font-semibold">
                    No foods yet
                  </Text>
                  <Text className="text-slate-500 mt-2">
                    Add your first food item.
                  </Text>
                </View>
              ) : (
                foods.map((f) => {
                  const imageUrl = appwriteGetFoodImageViewUrl(f.imageFileId);

                  return (
                    <Link
                      key={f.$id}
                      href={{
                        pathname: "/(tabs)/home/[foodId]" as any,
                        params: { foodId: f.$id },
                      }}
                      asChild
                    >
                      <TouchableOpacity className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <View className="flex-row items-center">
                          <View className="w-14 h-14 rounded-full overflow-hidden bg-slate-200">
                            {imageUrl ? (
                              <Image
                                source={{ uri: imageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            ) : null}
                          </View>

                          <View className="flex-1 ml-4">
                            <Text className="text-slate-900 font-semibold">
                              {f.name}
                            </Text>
                            <Text className="text-slate-500 mt-1">
                              {f.cookTimeMinutes} min • ${f.price}
                            </Text>
                            <Text className="text-slate-500 mt-1">
                              Ingredients:{" "}
                              {Array.isArray(f.ingredients)
                                ? f.ingredients.join(", ")
                                : ""}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  );
                })
              )}

              <Link href="/(tabs)/add-food" asChild>
                <TouchableOpacity className="bg-emerald-500 py-4 rounded-2xl mt-4">
                  <Text className="text-white text-center font-bold text-lg">
                    Add Food
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        ) : (
          <Text className="text-slate-500 mt-2">
            Your role is not set. Please sign up again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
