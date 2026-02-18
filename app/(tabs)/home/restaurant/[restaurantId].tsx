import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className="flex-row bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4"
    >
      <View className="w-28 h-28 bg-white/10" />
      <View className="flex-1 p-4 justify-between">
        <View>
          <View className="h-4 bg-white/10 rounded-lg w-3/4" />
          <View className="h-3 bg-white/10 rounded-lg mt-2 w-1/2" />
        </View>
        <View className="flex-row items-center justify-between">
          <View className="h-6 w-16 bg-white/10 rounded-full" />
          <View className="h-5 w-14 bg-white/10 rounded-full" />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Food card ────────────────────────────────────────────────────────────────
function FoodCard({
  food,
  formatPrice,
  href,
}: {
  food: FoodDoc;
  formatPrice: (v: unknown) => string;
  href: any;
}) {
  const imageUrl = appwriteGetFoodImageViewUrl(food.imageFileId);
  const isUnavailable = food.available === false;

  return (
    <Link href={href} asChild>
      <TouchableOpacity
        activeOpacity={0.75}
        className={`flex-row bg-white/5 border border-white/[0.08] rounded-3xl overflow-hidden mb-4 ${isUnavailable ? "opacity-50" : ""}`}
      >
        {/* Image */}
        <View className="w-28 h-28 bg-white/10 relative">
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
                size={28}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          )}
          {isUnavailable && (
            <View className="absolute inset-0 bg-slate-950/60 items-center justify-center">
              <View className="bg-slate-950/90 border border-white/10 rounded-full px-3 py-1">
                <Text className="text-white/70 text-xs font-bold tracking-wide">
                  PAUSED
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 px-4 py-3 justify-between">
          <View>
            <Text
              className="text-white font-bold text-base"
              numberOfLines={1}
            >
              {food.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text className="text-white/60 text-xs font-medium ml-1">
                4.5
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            {/* Price badge */}
            <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
              <Text className="text-emerald-300 font-extrabold text-sm">
                {formatPrice(food.price)}
              </Text>
            </View>

            {/* Cook time */}
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={13}
                color="rgba(255,255,255,0.4)"
              />
              <Text className="text-white/45 text-xs ml-1 font-semibold">
                {food.cookTimeMinutes} min
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View className="justify-center pr-4">
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.25)"
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
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

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");

  // Filter panel animation
  const filterHeight = useRef(new Animated.Value(0)).current;
  const filterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(filterHeight, {
        toValue: filterOpen ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(filterOpacity, {
        toValue: filterOpen ? 1 : 0,
        duration: 240,
        useNativeDriver: false,
      }),
    ]).start();
  }, [filterOpen, filterHeight, filterOpacity]);

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
      if (minPriceCents !== null && foodPriceCents < minPriceCents) return false;
      if (maxPriceCents !== null && foodPriceCents > maxPriceCents) return false;
      return true;
    });
  }, [foods, hasActivePriceFilter, isCustomer, maxPriceCents, minPriceCents]);

  const hasFilterInput = minPriceText.trim() || maxPriceText.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#080d1a" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          {/* Back button */}
          <Link href="/(tabs)/home" asChild>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginBottom: 24,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color="rgba(255,255,255,0.8)"
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: "600",
                  fontSize: 14,
                  marginLeft: 4,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Restaurant name + item count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text
                style={{
                  color: "#10b981",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Menu
              </Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 30,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  lineHeight: 36,
                }}
                numberOfLines={2}
              >
                {restaurantName}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : errorMessage ? (
            /* Error state */
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.2)",
                borderRadius: 24,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color="rgba(239,68,68,0.7)"
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: "700",
                  fontSize: 16,
                  marginTop: 12,
                }}
              >
                Unable to load
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 6,
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                {errorMessage}
              </Text>
            </View>
          ) : foods.length === 0 ? (
            /* Empty state */
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 28,
                padding: 36,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "rgba(16,185,129,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(16,185,129,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="restaurant-outline" size={32} color="#10b981" />
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: "700",
                  fontSize: 17,
                }}
              >
                No items yet
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                This restaurant hasn't added any menu items yet.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Price Filter (customer only) ──────────────────────── */}
              {isCustomer && (
                <View style={{ marginBottom: 20 }}>
                  {/* Filter toggle button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setFilterOpen((v) => !v)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: filterOpen
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(255,255,255,0.05)",
                      borderWidth: 1,
                      borderColor: filterOpen
                        ? "rgba(16,185,129,0.3)"
                        : "rgba(255,255,255,0.09)",
                      borderRadius: 18,
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons
                        name="options-outline"
                        size={18}
                        color={
                          filterOpen || hasActivePriceFilter
                            ? "#10b981"
                            : "rgba(255,255,255,0.6)"
                        }
                      />
                      <Text
                        style={{
                          color:
                            filterOpen || hasActivePriceFilter
                              ? "#6ee7b7"
                              : "rgba(255,255,255,0.7)",
                          fontWeight: "700",
                          fontSize: 14,
                          marginLeft: 10,
                        }}
                      >
                        Filter by price
                      </Text>
                      {hasActivePriceFilter && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#10b981",
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </View>
                    <Ionicons
                      name={filterOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="rgba(255,255,255,0.4)"
                    />
                  </TouchableOpacity>

                  {/* Collapsible filter panel */}
                  <Animated.View
                    style={{
                      opacity: filterOpacity,
                      maxHeight: filterHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.07)",
                        borderTopWidth: 0,
                        borderBottomLeftRadius: 18,
                        borderBottomRightRadius: 18,
                        padding: 16,
                        paddingTop: 18,
                      }}
                    >
                      {/* Inputs row */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {/* Min input */}
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: "#10b981",
                              fontWeight: "700",
                              fontSize: 15,
                              marginRight: 4,
                            }}
                          >
                            $
                          </Text>
                          <TextInput
                            value={minPriceText}
                            onChangeText={(t) =>
                              setMinPriceText(t.replace(/[^0-9.]/g, ""))
                            }
                            keyboardType="decimal-pad"
                            placeholder="Min"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            style={{
                              flex: 1,
                              color: "rgba(255,255,255,0.9)",
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                            accessibilityLabel="Min price"
                          />
                        </View>

                        <View
                          style={{
                            width: 20,
                            height: 1,
                            backgroundColor: "rgba(255,255,255,0.15)",
                          }}
                        />

                        {/* Max input */}
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: "#10b981",
                              fontWeight: "700",
                              fontSize: 15,
                              marginRight: 4,
                            }}
                          >
                            $
                          </Text>
                          <TextInput
                            value={maxPriceText}
                            onChangeText={(t) =>
                              setMaxPriceText(t.replace(/[^0-9.]/g, ""))
                            }
                            keyboardType="decimal-pad"
                            placeholder="Max"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            style={{
                              flex: 1,
                              color: "rgba(255,255,255,0.9)",
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                            accessibilityLabel="Max price"
                          />
                        </View>

                        {/* Clear button */}
                        {hasFilterInput ? (
                          <TouchableOpacity
                            onPress={() => {
                              setMinPriceText("");
                              setMaxPriceText("");
                            }}
                            style={{
                              backgroundColor: "rgba(239,68,68,0.1)",
                              borderWidth: 1,
                              borderColor: "rgba(239,68,68,0.2)",
                              borderRadius: 14,
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Clear price filter"
                          >
                            <Ionicons
                              name="close"
                              size={18}
                              color="rgba(239,68,68,0.8)"
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      {/* Validation messages */}
                      {minPriceText.trim() && !hasValidMinPrice ? (
                        <Text
                          style={{
                            color: "rgba(251,191,36,0.8)",
                            fontSize: 12,
                            marginTop: 10,
                            fontWeight: "500",
                          }}
                        >
                          ⚠ Min must be a valid number.
                        </Text>
                      ) : null}
                      {maxPriceText.trim() && !hasValidMaxPrice ? (
                        <Text
                          style={{
                            color: "rgba(251,191,36,0.8)",
                            fontSize: 12,
                            marginTop: 10,
                            fontWeight: "500",
                          }}
                        >
                          ⚠ Max must be a valid number.
                        </Text>
                      ) : null}
                      {isRangeInvalid ? (
                        <Text
                          style={{
                            color: "rgba(239,68,68,0.8)",
                            fontSize: 12,
                            marginTop: 10,
                            fontWeight: "500",
                          }}
                        >
                          ✕ Min must be less than or equal to Max.
                        </Text>
                      ) : null}
                      {hasActivePriceFilter && filteredFoods.length === 0 ? (
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 12,
                            marginTop: 10,
                            fontWeight: "500",
                          }}
                        >
                          No items in this price range.
                        </Text>
                      ) : null}
                    </View>
                  </Animated.View>
                </View>
              )}

              {/* ── Active filter summary pill ────────────────────────── */}
              {hasActivePriceFilter && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(16,185,129,0.1)",
                      borderWidth: 1,
                      borderColor: "rgba(16,185,129,0.2)",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Ionicons name="funnel" size={12} color="#10b981" />
                    <Text
                      style={{
                        color: "#6ee7b7",
                        fontSize: 12,
                        fontWeight: "600",
                        marginLeft: 6,
                      }}
                    >
                      {filteredFoods.length} of {foods.length} items
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Food list ─────────────────────────────────────────── */}
              {filteredFoods.map((f) => (
                <FoodCard
                  key={f.$id}
                  food={f}
                  formatPrice={formatPrice}
                  href={{
                    pathname: "/(tabs)/home/[foodId]" as any,
                    params: { foodId: f.$id },
                  }}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
