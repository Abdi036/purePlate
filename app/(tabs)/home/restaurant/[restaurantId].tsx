import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appwriteGetFoodImageViewUrl,
  appwriteListFoodsForRestaurant,
  appwriteListRestaurantsByIds,
  appwritePeekFoodsForRestaurant,
  appwritePeekRestaurantsByIds,
  FoodDoc,
  Restaurant,
} from "../../../../lib/appwrite";

export default function RestaurantDetailScreen() {
  const { restaurantId } = useLocalSearchParams<{
    restaurantId?: string | string[];
  }>();

  const resolvedRestaurantId = useMemo(() => {
    if (!restaurantId) return "";
    return Array.isArray(restaurantId) ? (restaurantId[0] ?? "") : restaurantId;
  }, [restaurantId]);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<FoodDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!resolvedRestaurantId) {
        if (mounted) {
          setRestaurant(null);
          setFoods([]);
          setErrorMessage("Missing restaurant id.");
        }
        return;
      }

      const cachedRestaurantList = appwritePeekRestaurantsByIds([
        resolvedRestaurantId,
      ]);
      if (cachedRestaurantList !== undefined) {
        const cachedRestaurant = cachedRestaurantList[0] ?? null;
        if (mounted) setRestaurant(cachedRestaurant);
      }

      const cachedFoods = appwritePeekFoodsForRestaurant(resolvedRestaurantId);
      if (cachedFoods !== undefined) {
        if (mounted) setFoods(cachedFoods);
      }

      if (cachedRestaurantList !== undefined && cachedFoods !== undefined) {
        if (mounted) {
          setIsLoading(false);
          setErrorMessage(null);
        }
        return;
      }

      try {
        if (mounted) {
          setIsLoading(true);
          setErrorMessage(null);
        }

        const [restaurantsResult, foodsResult] = await Promise.all([
          cachedRestaurantList !== undefined
            ? Promise.resolve(cachedRestaurantList)
            : appwriteListRestaurantsByIds([resolvedRestaurantId]),
          cachedFoods !== undefined
            ? Promise.resolve(cachedFoods)
            : appwriteListFoodsForRestaurant({ userId: resolvedRestaurantId }),
        ]);

        if (!mounted) return;
        setRestaurant(restaurantsResult[0] ?? null);
        setFoods(foodsResult);
      } catch (err: any) {
        if (!mounted) return;
        const message = typeof err?.message === "string" ? err.message : "";
        setErrorMessage(message || "Unable to load restaurant.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resolvedRestaurantId]);

  const restaurantName = restaurant?.name || "Restaurant";

  const formatPrice = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "$—";
    return `$${n.toFixed(2)}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-10"
      >
        <Link href="/(tabs)/home" asChild>
          <TouchableOpacity className="self-start bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <View className="flex-row items-center">
              <Ionicons
                name="chevron-back"
                size={18}
                color="rgba(255,255,255,0.85)"
              />
              <Text className="text-white/90 font-semibold ml-1">Back</Text>
            </View>
          </TouchableOpacity>
        </Link>

        <View className="mt-6 flex-row items-end justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-white/80 font-semibold py-2">Food Menu</Text>
            <Text
              className="text-white text-3xl font-extrabold tracking-tight mt-1"
              numberOfLines={2}
            >
              {restaurantName}
            </Text>
          </View>
          <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <View className="flex-row items-center">
              <Ionicons name="grid" size={18} color="rgba(255,255,255,0.85)" />
              <Text className="text-white/70 ml-2">{foods.length}</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View className="mt-6 flex-row flex-wrap justify-between">
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
        ) : errorMessage ? (
          <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-4">
            <Text className="text-white/90 font-semibold">Unable to open</Text>
            <Text className="text-white/60 mt-2">{errorMessage}</Text>
          </View>
        ) : foods.length === 0 ? (
          <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
            <Text className="text-white/90 font-semibold">No foods yet</Text>
            <Text className="text-white/60 mt-2">
              This restaurant hasn’t added items.
            </Text>
          </View>
        ) : (
          <View className="mt-6 flex-row flex-wrap justify-between">
            {foods.map((f) => {
              const imageUrl = appwriteGetFoodImageViewUrl(f.imageFileId);
              const isUnavailable = f.available === false;

              return (
                <Link
                  key={f.$id}
                  href={{
                    pathname: "/(tabs)/home/[foodId]" as any,
                    params: { foodId: f.$id },
                  }}
                  asChild
                >
                  <TouchableOpacity
                    className={`w-[48%] bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4 ${isUnavailable ? "opacity-60" : ""}`}
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

                      <Text className="text-white/60 mt-2" numberOfLines={1}>
                        {Array.isArray(f.ingredients)
                          ? f.ingredients.join(", ")
                          : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
