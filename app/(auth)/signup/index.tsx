import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../../components/FormField";
import { useAuth } from "../../../context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [role, setRole] = useState<"customer" | "restaurant">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAccount = async () => {
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert("Missing info", "Please enter name, email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp({ name: trimmedName, email: trimmedEmail, password, role });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to create account. Please try again.";
      Alert.alert("Sign up failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingTop: 48,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-slate-900">
          Create Account
        </Text>
        <Text className="text-slate-500 mt-2 mb-8">
          Join PurePlate today for a better lifestyle.
        </Text>

        <View>
          <FormField
            label="Full Name"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <FormField
            label="Email Address"
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <FormField
            label="Password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View className="mb-4">
            <Text className="text-slate-700 font-medium mb-2 ml-1">
              I am a:
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className={`flex-1 flex-row items-center p-4 rounded-2xl border ${
                  role === "customer"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-100 bg-slate-50"
                }`}
                onPress={() => setRole("customer")}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${
                    role === "customer"
                      ? "border-emerald-500"
                      : "border-slate-300"
                  }`}
                >
                  {role === "customer" && (
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </View>
                <Text
                  className={`font-medium ${
                    role === "customer" ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center p-4 rounded-2xl border ${
                  role === "restaurant"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-100 bg-slate-50"
                }`}
                onPress={() => setRole("restaurant")}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${
                    role === "restaurant"
                      ? "border-emerald-500"
                      : "border-slate-300"
                  }`}
                >
                  {role === "restaurant" && (
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </View>
                <Text
                  className={`font-medium ${
                    role === "restaurant"
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  Restaurant
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-4"
            onPress={handleCreateAccount}
            disabled={isSubmitting}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSubmitting ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-slate-500">Already a member? </Text>
          <Link href="/login">
            <Text className="text-emerald-600 font-bold">Log In</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
