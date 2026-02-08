import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appwriteGetFoodById,
  appwriteGetFoodImageViewUrl,
  appwritePeekFoodById,
  FoodDoc,
} from "../../../lib/appwrite";

export default function FoodDetailScreen() {
  const { foodId } = useLocalSearchParams<{ foodId?: string | string[] }>();

  const resolvedFoodId = useMemo(() => {
    if (!foodId) return "";
    return Array.isArray(foodId) ? (foodId[0] ?? "") : foodId;
  }, [foodId]);

  const [food, setFood] = useState<FoodDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!resolvedFoodId) {
        if (mounted) {
          setFood(null);
          setErrorMessage("Missing food id.");
        }
        return;
      }

      const cached = appwritePeekFoodById(resolvedFoodId);
      if (cached !== undefined) {
        if (mounted) {
          setFood(cached);
          setErrorMessage(cached ? null : "Food not found.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const result = await appwriteGetFoodById({ foodId: resolvedFoodId });
        if (!mounted) return;

        if (!result) {
          setFood(null);
          setErrorMessage("Food not found.");
          return;
        }

        setFood(result);
      } catch (err: any) {
        if (!mounted) return;
        const message = typeof err?.message === "string" ? err.message : "";
        setFood(null);
        setErrorMessage(message || "Unable to load food.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resolvedFoodId]);

  const imageUrl = useMemo(() => {
    return food ? appwriteGetFoodImageViewUrl(food.imageFileId) : null;
  }, [food]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-8 pt-12 pb-10"
      >
        <Link href="/(tabs)/home" className="mb-4">
          <Text className="text-emerald-600 font-bold">Back</Text>
        </Link>

        {isLoading ? (
          <Text className="text-slate-500 mt-2">Loading...</Text>
        ) : errorMessage ? (
          <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
            <Text className="text-slate-900 font-semibold">Unable to open</Text>
            <Text className="text-slate-500 mt-2">{errorMessage}</Text>
          </View>
        ) : !food ? (
          <Text className="text-slate-500 mt-2">Food not found.</Text>
        ) : (
          <View>
            <View className="w-full h-56 rounded-2xl overflow-hidden bg-slate-200">
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <Text className="text-3xl font-bold text-slate-900 mt-6">
              {food.name}
            </Text>

            <Text className="text-slate-500 mt-2">
              {food.cookTimeMinutes} min • ${food.price}
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6">
              <Text className="text-slate-900 font-semibold">Ingredients</Text>
              <Text className="text-slate-500 mt-2">
                {Array.isArray(food.ingredients) && food.ingredients.length > 0
                  ? food.ingredients.join(", ")
                  : "No ingredients listed."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
