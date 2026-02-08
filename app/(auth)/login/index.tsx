import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../../components/FormField";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn({ email: trimmedEmail, password });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to sign in. Please try again.";
      Alert.alert("Sign in failed", message);
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
            <Image
              source={require("../../../assets/images/icon.png")}
              className="h-9 w-9"
              resizeMode="contain"
              accessibilityLabel="PurePlate logo"
            />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-white">
              Pure<Text className="text-emerald-400">Plate</Text>
            </Text>
            <Text className="mt-1 text-sm text-white/60">
              Sign in to continue.
            </Text>
          </View>
        </View>

        <Text className="mt-10 text-3xl font-extrabold tracking-tight text-white">
          Welcome back
        </Text>
        <Text className="mt-3 text-base text-white/70 leading-6">
          Log in to keep your nutrition on track.
        </Text>

        <View className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6">
          <FormField
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />

          <View>
            <FormField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              className="mb-0" // Override mb-4 since we have a link below
              value={password}
              onChangeText={setPassword}
              labelClassName="text-white/70"
              inputClassName="bg-white/5 border-white/10 text-white/90"
            />
            <Link href="/forgot-password" className="mt-2 self-end">
              <Text className="text-emerald-300 font-semibold">
                Forgot Password?
              </Text>
            </Link>
          </View>

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-8"
            onPress={handleSignIn}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text className="text-slate-950 text-center font-bold text-lg">
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-white/60">Don&apos;t have an account? </Text>
          <Link href="/signup">
            <Text className="text-emerald-300 font-extrabold">Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
