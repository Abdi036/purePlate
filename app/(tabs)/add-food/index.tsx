import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { appwriteCreateFood, FoodInput } from "../../../lib/appwrite";

export default function AddFoodScreen() {
  const router = useRouter();
  const { user, prefs, isLoading } = useAuth();

  const role = prefs?.role;

  const [foodName, setFoodName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ingredients = useMemo(() => {
    return ingredientsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [ingredientsText]);

  const handleAddFood = async () => {
    if (isSubmitting) return;
    if (!user) return;

    const trimmedName = foodName.trim();
    const minutes = Number(cookTimeMinutes);
    const parsedPrice = Number(price);

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
    if (!imageUrl.trim()) {
      Alert.alert("Missing info", "Please provide an image URL for now.");
      return;
    }

    const food: FoodInput = {
      name: trimmedName,
      ingredients,
      cookTimeMinutes: minutes,
      price: parsedPrice,
      imageUrl: imageUrl.trim(),
    };

    try {
      setIsSubmitting(true);
      await appwriteCreateFood({ userId: user.$id, food });
      Alert.alert("Saved", "Food added successfully.");
      router.back();
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to add food. Please try again.";
      Alert.alert("Add food failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && (!user || role !== "restaurant")) {
    router.replace("/(tabs)/home");
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">Add Food</Text>
        <Text className="text-slate-500 mt-2">Create a new menu item.</Text>

        <View className="mt-6">
          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">Name</Text>
            <TextInput
              placeholder="Food name"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
              value={foodName}
              onChangeText={setFoodName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">
              Ingredients (comma-separated)
            </Text>
            <TextInput
              placeholder="e.g. chicken, salt, garlic"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
              value={ingredientsText}
              onChangeText={setIngredientsText}
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">
              Cook time (minutes)
            </Text>
            <TextInput
              placeholder="e.g. 25"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
              value={cookTimeMinutes}
              onChangeText={setCookTimeMinutes}
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">Price</Text>
            <TextInput
              placeholder="e.g. 12.99"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">
              Image URL
            </Text>
            <TextInput
              placeholder="https://..."
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
              value={imageUrl}
              onChangeText={setImageUrl}
            />
          </View>

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-2"
            onPress={handleAddFood}
            disabled={isSubmitting}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSubmitting ? "Saving..." : "Save Food"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
