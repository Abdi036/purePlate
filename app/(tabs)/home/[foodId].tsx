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

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-8 pt-12 pb-10"
      >
        <Link href="/(tabs)/home" className="mb-4">
          <Text className="text-emerald-300 font-extrabold">Back</Text>
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
            <View className="w-full h-56 rounded-3xl overflow-hidden bg-white/10 border border-white/10">
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View className="flex-row items-center justify-between mt-6">
              <Text className="text-3xl font-extrabold tracking-tight text-white flex-1">
                {food.name}
              </Text>

              {canManageFood ? (
                <View className="flex-row items-center ml-3">
                  {isEditing ? (
                    <>
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => void saveEdits()}
                        disabled={isMutating}
                      >
                        <Ionicons name="checkmark" size={22} color="rgba(255,255,255,0.9)" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-2"
                        onPress={cancelEdit}
                        disabled={isMutating}
                      >
                        <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => setIsEditing(true)}
                        disabled={isMutating}
                      >
                        <Ionicons name="pencil" size={20} color="rgba(255,255,255,0.9)" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => void deleteFood()}
                        disabled={isMutating}
                      >
                        <Ionicons name="trash" size={20} color="rgba(255,255,255,0.9)" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : null}
            </View>

            <Text className="text-white/60 mt-2">
              {food.cookTimeMinutes} min • ${food.price}
            </Text>

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
              <View className="mt-6 gap-y-3">
                <View>
                  <Text className="text-white/70 font-medium mb-2 ml-1">
                    Name
                  </Text>
                  <TextInput
                    placeholder="Food name"
                    placeholderTextColor="#94a3b8"
                    className="bg-white/5 p-4 rounded-2xl border border-white/10 font-medium text-white/90"
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                <View>
                  <Text className="text-white/70 font-medium mb-2 ml-1">
                    Ingredients (comma-separated)
                  </Text>
                  <TextInput
                    placeholder="e.g. chicken, salt, garlic"
                    placeholderTextColor="#94a3b8"
                    className="bg-white/5 p-4 rounded-2xl border border-white/10 font-medium text-white/90"
                    value={editIngredientsText}
                    onChangeText={setEditIngredientsText}
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
                      placeholderTextColor="#94a3b8"
                      className="bg-white/5 p-4 rounded-2xl border border-white/10 font-medium text-white/90"
                      value={editCookTimeMinutes}
                      onChangeText={setEditCookTimeMinutes}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/70 font-medium mb-2 ml-1">
                      Price
                    </Text>
                    <TextInput
                      placeholder="e.g. 12.99"
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                      className="bg-white/5 p-4 rounded-2xl border border-white/10 font-medium text-white/90"
                      value={editPrice}
                      onChangeText={setEditPrice}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
              <Text className="text-white/90 font-semibold">Ingredients</Text>
              <Text className="text-white/60 mt-2">
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
