import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import {
  appwriteDeleteFood,
  appwriteGetFoodById,
  appwriteGetFoodImageViewUrl,
  appwritePeekFoodById,
  appwriteUpdateFood,
  FoodDoc,
} from "../../../lib/appwrite";

export default function FoodDetailScreen() {
  const router = useRouter();
  const { foodId } = useLocalSearchParams<{ foodId?: string | string[] }>();
  const { user, prefs } = useAuth();
  const role = prefs?.role;

  const resolvedFoodId = useMemo(() => {
    if (!foodId) return "";
    return Array.isArray(foodId) ? (foodId[0] ?? "") : foodId;
  }, [foodId]);

  const [food, setFood] = useState<FoodDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIngredientsText, setEditIngredientsText] = useState("");
  const [editCookTimeMinutes, setEditCookTimeMinutes] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

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

  const canManageFood = useMemo(() => {
    if (!user) return false;
    if (role !== "restaurant") return false;
    if (!food) return false;
    return food.restaurantUserId === user.$id;
  }, [food, role, user]);

  useEffect(() => {
    if (!food) return;
    if (!isEditing) {
      setEditName(food.name ?? "");
      setEditIngredientsText(
        Array.isArray(food.ingredients) ? food.ingredients.join(", ") : "",
      );
      setEditCookTimeMinutes(String(food.cookTimeMinutes ?? ""));
      setEditPrice(String(food.price ?? ""));
      setEditAvailable(food.available !== false);
    }
  }, [food, isEditing]);

  const cancelEdit = () => {
    setIsEditing(false);
    if (!food) return;
    setEditName(food.name ?? "");
    setEditIngredientsText(
      Array.isArray(food.ingredients) ? food.ingredients.join(", ") : "",
    );
    setEditCookTimeMinutes(String(food.cookTimeMinutes ?? ""));
    setEditPrice(String(food.price ?? ""));
    setEditAvailable(food.available !== false);
  };

  const saveEdits = async () => {
    if (!user) return;
    if (!food) return;
    if (!canManageFood) return;
    if (isMutating) return;

    const trimmedName = editName.trim();
    const ingredients = editIngredientsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const minutes = Number(editCookTimeMinutes);
    const parsedPrice = Number(editPrice);

    if (!trimmedName) {
      Alert.alert("Missing info", "Please enter food name.");
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert(
        "Missing info",
        "Please enter ingredients (comma-separated).",
      );
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      Alert.alert("Invalid", "Cook time must be a positive number.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Invalid", "Price must be a positive number.");
      return;
    }

    try {
      setIsMutating(true);
      const updated = await appwriteUpdateFood({
        userId: user.$id,
        foodId: food.$id,
        food: {
          name: trimmedName,
          ingredients,
          cookTimeMinutes: minutes,
          price: parsedPrice,
          available: editAvailable,
        },
      });

      setFood(updated);
      setIsEditing(false);
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update food. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsMutating(false);
    }
  };

  const toggleAvailability = async (nextAvailable: boolean) => {
    if (!user) return;
    if (!food) return;
    if (!canManageFood) return;
    if (isMutating) return;

    const previous = editAvailable;
    setEditAvailable(nextAvailable);

    try {
      setIsMutating(true);
      const updated = await appwriteUpdateFood({
        userId: user.$id,
        foodId: food.$id,
        food: {
          name: isEditing ? editName.trim() || food.name : food.name,
          ingredients: isEditing
            ? editIngredientsText
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : food.ingredients,
          cookTimeMinutes: isEditing
            ? Number(editCookTimeMinutes) || food.cookTimeMinutes
            : food.cookTimeMinutes,
          price: isEditing ? Number(editPrice) || food.price : food.price,
          available: nextAvailable,
        },
      });
      setFood(updated);
    } catch (err: any) {
      setEditAvailable(previous);
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update availability. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsMutating(false);
    }
  };

  const deleteFood = async () => {
    if (!user) return;
    if (!food) return;
    if (!canManageFood) return;
    if (isMutating) return;

    Alert.alert(
      "Delete food?",
      `This will permanently delete "${food.name}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsMutating(true);
              await appwriteDeleteFood({ userId: user.$id, foodId: food.$id });
              router.replace("/(tabs)/home");
            } catch (err: any) {
              const message =
                typeof err?.message === "string"
                  ? err.message
                  : "Unable to delete food. Please try again.";
              Alert.alert("Delete failed", message);
            } finally {
              setIsMutating(false);
            }
          },
        },
      ],
    );
  };

  const imageUrl = useMemo(() => {
    return food ? appwriteGetFoodImageViewUrl(food.imageFileId) : null;
  }, [food]);

  const formatPrice = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "$—";
    return `$${n.toFixed(2)}`;
  };

  const ingredientsList = useMemo(() => {
    return Array.isArray(food?.ingredients)
      ? food?.ingredients.filter(Boolean)
      : [];
  }, [food?.ingredients]);

  const allergicPrefs = useMemo(() => {
    const list = prefs?.allergicIngredients;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [prefs?.allergicIngredients]);

  const dislikedPrefs = useMemo(() => {
    const list = prefs?.dislikedIngredients;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [prefs?.dislikedIngredients]);

  const ingredientMatches = useMemo(() => {
    if (role !== "customer") {
      return { allergic: [] as string[], disliked: [] as string[] };
    }

    const ingredientStrings = ingredientsList
      .map((x) => String(x).trim())
      .filter(Boolean);

    const allergicNeedles = allergicPrefs
      .map((x) => String(x).trim())
      .filter(Boolean);

    const dislikedNeedles = dislikedPrefs
      .map((x) => String(x).trim())
      .filter(Boolean);

    const matchesAllergic = new Set<string>();
    const matchesDisliked = new Set<string>();

    const containsLoose = (haystack: string, needle: string) => {
      const h = haystack.toLowerCase();
      const n = needle.toLowerCase();
      if (!h || !n) return false;
      if (n.length < 2) return false;
      return h.includes(n);
    };

    for (const ingredient of ingredientStrings) {
      for (const needle of allergicNeedles) {
        if (containsLoose(ingredient, needle)) {
          matchesAllergic.add(needle);
        }
      }
      for (const needle of dislikedNeedles) {
        if (containsLoose(ingredient, needle)) {
          matchesDisliked.add(needle);
        }
      }
    }

    return {
      allergic: Array.from(matchesAllergic),
      disliked: Array.from(matchesDisliked),
    };
  }, [allergicPrefs, dislikedPrefs, ingredientsList, role]);

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

        {isLoading ? (
          <Text className="text-white/60 mt-2">Loading...</Text>
        ) : errorMessage ? (
          <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-2">
            <Text className="text-white/90 font-semibold">Unable to open</Text>
            <Text className="text-white/60 mt-2">{errorMessage}</Text>
          </View>
        ) : !food ? (
          <Text className="text-white/60 mt-2">Food not found.</Text>
        ) : (
          <View>
            <View className="w-full h-64 rounded-3xl overflow-hidden bg-white/10 border border-white/10 mt-6">
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
                    size={30}
                    color="rgba(255,255,255,0.55)"
                  />
                  <Text className="text-white/60 mt-2 font-semibold">
                    No image
                  </Text>
                </View>
              )}

              {food.available === false ? (
                <View className="absolute top-4 right-4 bg-slate-950/80 border border-white/10 rounded-full px-3 py-1">
                  <Text className="text-white/80 text-xs font-semibold">
                    Paused
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center justify-between mt-6">
              <Text
                className="text-3xl font-extrabold tracking-tight text-white flex-1 pr-4"
                numberOfLines={2}
              >
                {food.name}
              </Text>

              {canManageFood ? (
                <View className="flex-row items-center">
                  {!isEditing ? (
                    <TouchableOpacity
                      className="bg-white/5 border border-white/10 rounded-full px-3 py-2"
                      onPress={() => setIsEditing(true)}
                      disabled={isMutating}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="pencil"
                        size={16}
                        color="rgba(255,255,255,0.85)"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View className="bg-white/5 border border-white/10 rounded-full px-3 py-2">
                      <Text className="text-white/80 text-xs font-semibold">
                        EDITING
                      </Text>
                    </View>
                  )}

                  {!isEditing ? (
                    <TouchableOpacity
                      className="bg-white/5 border border-white/10 rounded-full px-3 py-2 ml-2"
                      onPress={() => void deleteFood()}
                      disabled={isMutating}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="trash"
                        size={16}
                        color="rgba(255,255,255,0.85)"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-emerald-300 font-extrabold text-lg">
                {formatPrice(food.price)}
              </Text>
              <View className="bg-white/5 border border-white/10 rounded-full px-3 py-2">
                <Text className="text-white/70 text-xs font-semibold">
                  {food.cookTimeMinutes} min
                </Text>
              </View>
            </View>

            {canManageFood ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-white/90 font-semibold">
                      Availability
                    </Text>
                    <Text className="text-white/60 mt-1">
                      {editAvailable ? "Available" : "Finished for now"}
                    </Text>
                  </View>

                  <Switch
                    value={editAvailable}
                    disabled={isMutating}
                    onValueChange={(v) => void toggleAvailability(v)}
                  />
                </View>
              </View>
            ) : food.available === false ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <Text className="text-white/90 font-semibold">
                  Finished for now
                </Text>
                <Text className="text-white/60 mt-2">
                  This food is currently unavailable.
                </Text>
              </View>
            ) : null}

            {isEditing ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <Text className="text-white/90 font-semibold">
                  Edit details
                </Text>
                <Text className="text-white/60 mt-2">
                  Update the item name, ingredients, cook time, and price.
                </Text>

                <View className="mt-5 gap-y-3">
                  <View>
                    <Text className="text-white/70 font-medium mb-2 ml-1">
                      Name
                    </Text>
                    <TextInput
                      placeholder="Food name"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 font-semibold text-white"
                      value={editName}
                      onChangeText={setEditName}
                      editable={!isMutating}
                      returnKeyType="next"
                    />
                  </View>

                  <View>
                    <Text className="text-white/70 font-medium mb-2 ml-1">
                      Ingredients (comma-separated)
                    </Text>
                    <TextInput
                      placeholder="e.g. chicken, salt, garlic"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 font-semibold text-white"
                      value={editIngredientsText}
                      onChangeText={setEditIngredientsText}
                      editable={!isMutating}
                      returnKeyType="next"
                    />
                  </View>

                  <View className="flex-row gap-x-3">
                    <View className="flex-1">
                      <Text className="text-white/70 font-medium mb-2 ml-1">
                        Cook time (min)
                      </Text>
                      <TextInput
                        placeholder="e.g. 25"
                        keyboardType="numeric"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 font-semibold text-white"
                        value={editCookTimeMinutes}
                        onChangeText={setEditCookTimeMinutes}
                        editable={!isMutating}
                        returnKeyType="next"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-white/70 font-medium mb-2 ml-1">
                        Price
                      </Text>
                      <TextInput
                        placeholder="e.g. 12.99"
                        keyboardType="numeric"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 font-semibold text-white"
                        value={editPrice}
                        onChangeText={setEditPrice}
                        editable={!isMutating}
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-x-3 mt-2">
                    <TouchableOpacity
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4"
                      onPress={cancelEdit}
                      disabled={isMutating}
                      activeOpacity={0.85}
                    >
                      <Text className="text-white/90 text-center font-extrabold">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 bg-emerald-500 rounded-2xl py-4"
                      onPress={() => void saveEdits()}
                      disabled={isMutating}
                      activeOpacity={0.85}
                    >
                      <Text className="text-slate-950 text-center font-extrabold">
                        {isMutating ? "Saving..." : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            {canManageFood ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <Text className="text-white/90 font-semibold">Ingredients</Text>
                {ingredientsList.length > 0 ? (
                  <View className="flex-row flex-wrap mt-3">
                    {ingredientsList.map((item) => (
                      <View
                        key={`ingredient:${item}`}
                        className="bg-white/5 border border-white/10 rounded-full px-3 py-2 mr-2 mb-2"
                      >
                        <Text className="text-white/80 text-xs font-semibold">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-white/60 mt-2">
                    No ingredients listed.
                  </Text>
                )}
              </View>
            ) : role === "customer" ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/90 font-semibold">
                    Health check
                  </Text>
                  <Ionicons
                    name={
                      ingredientMatches.allergic.length > 0
                        ? "warning"
                        : "shield-checkmark"
                    }
                    size={18}
                    color={
                      ingredientMatches.allergic.length > 0
                        ? "rgba(248,113,113,0.95)"
                        : "rgba(52,211,153,0.95)"
                    }
                  />
                </View>

                {ingredientMatches.allergic.length > 0 ||
                ingredientMatches.disliked.length > 0 ? (
                  <View className="mt-3">
                    <Text className="text-white/60">
                      Based on your profile, this food contains ingredients
                      mentioned in your alergy/dislike lists:
                    </Text>

                    {ingredientMatches.allergic.length > 0 ? (
                      <View className="mt-4">
                        <Text className="text-white/80 font-semibold">
                          Allergic
                        </Text>
                        <View className="flex-row flex-wrap mt-3">
                          {ingredientMatches.allergic.map((item) => (
                            <View
                              key={`match:allergic:${item}`}
                              className="bg-white/5 border border-white/10 rounded-full px-3 py-2 mr-2 mb-2"
                            >
                              <Text className="text-white/90 text-xs font-extrabold">
                                {item}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {ingredientMatches.disliked.length > 0 ? (
                      <View className="mt-4">
                        <Text className="text-white/80 font-semibold">
                          Dislike
                        </Text>
                        <View className="flex-row flex-wrap mt-3">
                          {ingredientMatches.disliked.map((item) => (
                            <View
                              key={`match:disliked:${item}`}
                              className="bg-white/5 border border-white/10 rounded-full px-3 py-2 mr-2 mb-2"
                            >
                              <Text className="text-white/80 text-xs font-semibold">
                                {item}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    <Text className="text-white/50 mt-2">
                      This is a best-effort match. Always confirm with the
                      restaurant for allergies.
                    </Text>
                  </View>
                ) : (
                  <View className="mt-3">
                    <Text className="text-white/60">
                      No conflicts found with your saved allergies/dislikes.
                    </Text>
                    <Text className="text-white/60 mt-2">
                      You’re good to go — enjoy a delicious, worry-free bite.
                    </Text>
                    {allergicPrefs.length === 0 &&
                    dislikedPrefs.length === 0 ? (
                      <Text className="text-white/50 mt-2">
                        Tip: add allergies/dislikes in Profile for personalized
                        warnings.
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <Text className="text-white/90 font-semibold">Recipe</Text>
                <Text className="text-white/60 mt-2">
                  This restaurant keeps recipe details private.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
