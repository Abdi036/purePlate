import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      {/* Decorative color wash */}
      <View className="absolute -top-16 -right-24 h-72 w-72 rounded-full bg-emerald-500/20" />
      <View className="absolute top-40 -left-28 h-80 w-80 rounded-full bg-sky-500/15" />
      <View className="absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View className="flex-row items-center gap-x-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <Text className="text-4xl">🥗</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-white">
              Pure<Text className="text-emerald-400">Plate</Text>
            </Text>
            <Text className="mt-1 text-sm text-white/60">
              Create your account.
            </Text>
          </View>
        </View>

        <Text className="mt-10 text-3xl font-extrabold tracking-tight text-white">
          Create account
        </Text>
        <Text className="mt-3 text-base text-white/70 leading-6">
          Join today and start making clean choices effortless.
        </Text>

        <View className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6">
          <FormField
            label="Full Name"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />
          <FormField
            label="Email Address"
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />
          <FormField
            label="Password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />

          <View className="mb-4">
            <Text className="text-white/70 font-medium mb-2 ml-1">I am a:</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className={`flex-1 flex-row items-center p-4 rounded-2xl border ${
                  role === "customer"
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-white/10 bg-white/5"
                }`}
                onPress={() => setRole("customer")}
                activeOpacity={0.85}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${
                    role === "customer"
                      ? "border-emerald-400"
                      : "border-white/30"
                  }`}
                >
                  {role === "customer" && (
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  )}
                </View>
                <Text
                  className={`font-medium ${
                    role === "customer" ? "text-emerald-200" : "text-white/60"
                  }`}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center p-4 rounded-2xl border ${
                  role === "restaurant"
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-white/10 bg-white/5"
                }`}
                onPress={() => setRole("restaurant")}
                activeOpacity={0.85}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${
                    role === "restaurant"
                      ? "border-emerald-400"
                      : "border-white/30"
                  }`}
                >
                  {role === "restaurant" && (
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  )}
                </View>
                <Text
                  className={`font-medium ${
                    role === "restaurant" ? "text-emerald-200" : "text-white/60"
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
            activeOpacity={0.85}
          >
            <Text className="text-slate-950 text-center font-bold text-lg">
              {isSubmitting ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-white/60">Already a member? </Text>
          <Link href="/login">
            <Text className="text-emerald-300 font-extrabold">Log In</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
