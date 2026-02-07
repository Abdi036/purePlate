import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">Welcome Back</Text>
        <Text className="text-slate-500 mt-2 mb-8">
          Sign in to continue your healthy journey.
        </Text>

        <View>
          <FormField
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View>
            <FormField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              className="mb-0" // Override mb-4 since we have a link below
              value={password}
              onChangeText={setPassword}
            />
            <Link href="/forgot-password" className="mt-2 self-end">
              <Text className="text-emerald-600 font-medium">
                Forgot Password?
              </Text>
            </Link>
          </View>

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-8 shadow-sm"
            onPress={handleSignIn}
            disabled={isSubmitting}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-slate-500">Don&apos;t have an account? </Text>
          <Link href="/signup">
            <Text className="text-emerald-600 font-bold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
