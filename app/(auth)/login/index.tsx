import { Link, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../../components/FormField";

export default function LoginPage() {
  const router = useRouter();

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
          />

          <View>
            <FormField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              className="mb-0" // Override mb-4 since we have a link below
            />
            <Link href="/forgot-password" className="mt-2 self-end">
              <Text className="text-emerald-600 font-medium">
                Forgot Password?
              </Text>
            </Link>
          </View>

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-8 shadow-sm"
            onPress={() => router.replace("/")} // Change to your main route
          >
            <Text className="text-white text-center font-bold text-lg">
              Sign In
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
