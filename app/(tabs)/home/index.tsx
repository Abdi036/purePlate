import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const formatPrice = useCallback((value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "$—";
    return `$${n.toFixed(2)}`;
  }, []);

  const getInitial = useCallback((value: unknown) => {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return "•";
    return s[0]?.toUpperCase?.() ?? "•";
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {role === "restaurant" ? (
        <Link href="/(tabs)/add-food" asChild>
          <TouchableOpacity
            className="absolute z-10 bg-emerald-500 w-14 h-14 rounded-full items-center justify-center"
            style={{ right: 20, bottom: insets.bottom + 88 }}
          >
            <Text className="text-slate-950 text-3xl font-bold">+</Text>
          </TouchableOpacity>
        </Link>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-10"
      >
        {isLoading ? (
          <Text className="text-white/60 mt-2">Loading...</Text>
        ) : !user ? (
          <Text className="text-white/60 mt-2">Not signed in.</Text>
        ) : !prefs ? (
          <Text className="text-white/60 mt-2">Loading...</Text>
        ) : role === "customer" ? (
          <View className="mt-2">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-white text-3xl font-extrabold tracking-tight mt-1">
                  Your spots
                </Text>
              </View>
            </View>

            {scannedIds.length === 0 ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
                    <Ionicons
                      name="restaurant"
                      size={22}
                      color="rgba(255,255,255,0.85)"
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-white/90 font-semibold">
                      Scan a restaurant QR code
                    </Text>
                    <Text className="text-white/60 mt-1">
                      Your scanned restaurants will appear here.
                    </Text>
                  </View>
                </View>

                <Link href="/(tabs)/scan" asChild>
                  <TouchableOpacity className="bg-emerald-500 rounded-2xl py-4 mt-5">
                    <Text className="text-slate-950 text-center font-extrabold">
                      Start scanning
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ) : (
              <View className="mt-6">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/70 font-medium">
                    Your restaurants
                  </Text>
                  <Text className="text-white/50">
                    {restaurants.length || scannedIds.length}
                  </Text>
                </View>

                {isFetchingRestaurants ? (
                  <View className="mt-4 flex-row flex-wrap justify-between">
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        className="w-[48%] bg-white/5 border border-white/10 rounded-3xl p-4 mb-4"
                      >
                        <View className="w-12 h-12 rounded-2xl bg-white/10" />
                        <View className="h-4 bg-white/10 rounded mt-4" />
                        <View className="h-3 bg-white/10 rounded mt-2 w-2/3" />
                      </View>
                    ))}
                  </View>
                ) : restaurants.length > 0 ? (
                  <View className="mt-4 flex-row flex-wrap justify-between">
                    {restaurants.map((r) => (
                      <Link
                        key={r.$id}
                        href={{
                          pathname:
                            "/(tabs)/home/restaurant/[restaurantId]" as any,
                          params: { restaurantId: r.$id },
                        }}
                        asChild
                      >
                        <TouchableOpacity className="w-[48%] bg-white/5 border border-white/10 rounded-3xl p-4 mb-4">
                          <View className="flex-row items-center justify-between">
                            <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
                              <Text className="text-white/90 font-extrabold text-lg">
                                {getInitial(r.name || r.$id)}
                              </Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color="rgba(255,255,255,0.55)"
                            />
                          </View>
                          <Text
                            className="text-white/90 font-semibold mt-4"
                            numberOfLines={1}
                          >
                            {r.name || r.$id}
                          </Text>
                          <Text className="text-white/60 mt-1">View menu</Text>
                        </TouchableOpacity>
                      </Link>
                    ))}
                  </View>
                ) : (
                  <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-4">
                    <Text className="text-white/90 font-semibold">
                      Restaurants not loaded
                    </Text>
                    <Text className="text-white/60 mt-2">
                      We’ll still show your scanned IDs.
                    </Text>
                    <View className="mt-4 flex-row flex-wrap justify-between">
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
                          <TouchableOpacity className="w-[48%] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-3">
                            <Text
                              className="text-white/70 font-semibold"
                              numberOfLines={1}
                            >
                              {id}
                            </Text>
                          </TouchableOpacity>
                        </Link>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : role === "restaurant" ? (
          <View className="mt-2">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-white/80 font-semibold">Menu</Text>
                <Text className="text-white text-3xl font-extrabold tracking-tight mt-1">
                  Your foods
                </Text>
              </View>
              <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <View className="flex-row items-center">
                  <Ionicons
                    name="grid"
                    size={18}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text className="text-white/70 ml-2">{foods.length}</Text>
                </View>
              </View>
            </View>

            <View className="mt-6">
              {isFetchingFoods ? (
                <View className="flex-row flex-wrap justify-between">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className="w-[48%] bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4"
                    >
                      <View className="w-full h-28 bg-white/10" />
                      <View className="p-4">
                        <View className="h-4 bg-white/10 rounded" />
                        <View className="h-3 bg-white/10 rounded mt-2 w-2/3" />
                      </View>
                    </View>
                  ))}
                </View>
              ) : foods.length === 0 ? (
                <View className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <Text className="text-white/90 font-semibold">
                    No foods yet
                  </Text>
                  <Text className="text-white/60 mt-2">
                    Tap the + button to add your first item.
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {foods.map((f) => {
                    const imageUrl = appwriteGetFoodImageViewUrl(f.imageFileId);
                    const isUnavailable = f.available === false;

                    return (
                      <TouchableOpacity
                        key={f.$id}
                        className={`w-[48%] bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4 ${isUnavailable ? "opacity-60" : ""}`}
                        onPress={() => {
                          router.push({
                            pathname: "/(tabs)/home/[foodId]" as any,
                            params: { foodId: f.$id },
                          });
                        }}
                      >
                        <View className="w-full h-28 bg-white/10">
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="flex-1 items-center justify-center">
                              <Ionicons
                                name="fast-food"
                                size={22}
                                color="rgba(255,255,255,0.55)"
                              />
                            </View>
                          )}

                          {isUnavailable ? (
                            <View className="absolute top-3 right-3 bg-slate-950/80 border border-white/10 rounded-full px-3 py-1">
                              <Text className="text-white/80 text-xs font-semibold">
                                Paused
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View className="p-4">
                          <Text
                            className="text-white/90 font-semibold"
                            numberOfLines={1}
                          >
                            {f.name}
                          </Text>

                          <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-emerald-300 font-extrabold">
                              {formatPrice(f.price)}
                            </Text>
                            <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                              <Text className="text-white/70 text-xs font-semibold">
                                {f.cookTimeMinutes} min
                              </Text>
                            </View>
                          </View>

                          <Text
                            className="text-white/60 mt-2"
                            numberOfLines={1}
                          >
                            {Array.isArray(f.ingredients)
                              ? f.ingredients.join(", ")
                              : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text className="text-white/60 mt-2">
            Your role is not set. Please sign up again.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
