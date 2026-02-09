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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-8 pt-12 pb-10"
      >
        <Link href="/(tabs)/home" className="mb-4">
          <Text className="text-emerald-600 font-bold">Back</Text>
        </Link>

        <Text className="text-3xl font-bold text-slate-900">
          {restaurantName}
        </Text>

        {isLoading ? (
          <Text className="text-slate-500 mt-2">Loading...</Text>
        ) : errorMessage ? (
          <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-4">
            <Text className="text-slate-900 font-semibold">Unable to open</Text>
            <Text className="text-slate-500 mt-2">{errorMessage}</Text>
          </View>
        ) : foods.length === 0 ? (
          <Text className="text-slate-500 mt-2">No foods yet.</Text>
        ) : (
          <View className="mt-6 gap-y-3">
            <Text className="text-slate-700 font-medium">Foods</Text>

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
                    className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isUnavailable ? "opacity-50" : ""}`}
                  >
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
                        {isUnavailable ? (
                          <Text className="text-slate-500 mt-1">
                            Finished for now
                          </Text>
                        ) : null}
                      </View>
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
