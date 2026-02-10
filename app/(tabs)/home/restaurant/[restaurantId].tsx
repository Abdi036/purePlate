import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../context/AuthContext";
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

  const { prefs } = useAuth();
  const isCustomer = prefs?.role === "customer";
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");

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

  const minPrice = useMemo(() => {
    const raw = minPriceText.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    if (n < 0) return NaN;
    return n;
  }, [minPriceText]);

  const maxPrice = useMemo(() => {
    const raw = maxPriceText.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    if (n < 0) return NaN;
    return n;
  }, [maxPriceText]);

  const hasValidMinPrice = minPrice !== null && Number.isFinite(minPrice);
  const hasValidMaxPrice = maxPrice !== null && Number.isFinite(maxPrice);

  const minPriceCents = useMemo(() => {
    if (!hasValidMinPrice) return null;
    return Math.round((minPrice as number) * 100);
  }, [hasValidMinPrice, minPrice]);

  const maxPriceCents = useMemo(() => {
    if (!hasValidMaxPrice) return null;
    return Math.round((maxPrice as number) * 100);
  }, [hasValidMaxPrice, maxPrice]);

  const isRangeInvalid = useMemo(() => {
    if (minPriceCents === null || maxPriceCents === null) return false;
    return minPriceCents > maxPriceCents;
  }, [maxPriceCents, minPriceCents]);

  const hasActivePriceFilter =
    (hasValidMinPrice || hasValidMaxPrice) && !isRangeInvalid;

  const filteredFoods = useMemo(() => {
    if (!isCustomer) return foods;
    if (!hasActivePriceFilter) return foods;

    const toNumber = (value: unknown) => {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : NaN;
    };

    return foods.filter((food) => {
      const price = toNumber(food.price);
      if (!Number.isFinite(price)) return false;

      const foodPriceCents = Math.round(price * 100);
      if (minPriceCents !== null && foodPriceCents < minPriceCents) {
        return false;
      }
      if (maxPriceCents !== null && foodPriceCents > maxPriceCents) {
        return false;
      }
      return true;
    });
  }, [foods, hasActivePriceFilter, isCustomer, maxPriceCents, minPriceCents]);

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
            <Text className="text-white/80 font-semibold py-2">Menu Lists</Text>
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
              <Text className="text-white/70 ml-2">
                {isCustomer && hasActivePriceFilter
                  ? `${filteredFoods.length}/${foods.length}`
                  : foods.length}
              </Text>
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
          <>
            {isCustomer ? (
              <View className="mt-5 bg-white/5 border border-white/10 rounded-3xl p-4">
                <Text className="text-white/80 font-semibold">
                  Filter by price
                </Text>

                <View className="mt-3 flex-row items-center">
                  <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center">
                    <View className="flex-1 flex-row items-center">
                      <Text className="text-white/60 font-semibold mr-2">
                        $
                      </Text>
                      <TextInput
                        value={minPriceText}
                        onChangeText={(t) =>
                          setMinPriceText(t.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="decimal-pad"
                        placeholder="Min"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="flex-1 text-white/90 font-semibold"
                        accessibilityLabel="Min price"
                      />
                    </View>

                    <View className="w-px h-6 bg-white/10 mx-3" />

                    <View className="flex-1 flex-row items-center">
                      <Text className="text-white/60 font-semibold mr-2">
                        $
                      </Text>
                      <TextInput
                        value={maxPriceText}
                        onChangeText={(t) =>
                          setMaxPriceText(t.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="decimal-pad"
                        placeholder="Max"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="flex-1 text-white/90 font-semibold"
                        accessibilityLabel="Max price"
                      />
                    </View>
                  </View>

                  {minPriceText.trim() || maxPriceText.trim() ? (
                    <TouchableOpacity
                      onPress={() => {
                        setMinPriceText("");
                        setMaxPriceText("");
                      }}
                      className="ml-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                      accessibilityRole="button"
                      accessibilityLabel="Clear price filter"
                    >
                      <Text className="text-white/80 font-semibold">Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {minPriceText.trim() && !hasValidMinPrice ? (
                  <Text className="text-white/60 mt-2">
                    Min must be a valid number.
                  </Text>
                ) : null}

                {maxPriceText.trim() && !hasValidMaxPrice ? (
                  <Text className="text-white/60 mt-2">
                    Max must be a valid number.
                  </Text>
                ) : null}

                {isRangeInvalid ? (
                  <Text className="text-white/60 mt-2">
                    Min must be less than or equal to Max.
                  </Text>
                ) : null}

                {hasActivePriceFilter && filteredFoods.length === 0 ? (
                  <Text className="text-white/60 mt-2">
                    No foods in this price range.
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-2 flex-row flex-wrap justify-between">
              {filteredFoods.map((f) => {
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
                      </View>
                    </TouchableOpacity>
                  </Link>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
