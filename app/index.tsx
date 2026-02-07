import { Link, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-10">
          <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-6">
            <Text className="text-4xl">🥗</Text>
          </View>
          <Text className="text-4xl font-bold text-slate-900 tracking-tight">
            Pure<Text className="text-emerald-500">Plate</Text>
          </Text>
          <Text className="text-center text-slate-500 mt-4 text-lg leading-6">
            Fuel your body with clean, nutritious, and delicious meals tailored
            just for you.
          </Text>
        </View>

        <View className="items-center">
          <View className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <Text className="text-emerald-800 font-medium italic">
              &quot;Eat clean, feel incredible.&quot;
            </Text>
          </View>
        </View>

        {/* Bottom Section: Actions */}
        <View className="gap-y-4">
          <Link href="/signup" asChild>
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-emerald-500 py-4 rounded-2xl shadow-lg shadow-emerald-200"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Get Started
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/login" asChild>
            <TouchableOpacity
              activeOpacity={0.6}
              className="py-4 rounded-2xl border border-slate-200"
            >
              <Text className="text-slate-600 text-center font-medium text-lg">
                Login
              </Text>
            </TouchableOpacity>
          </Link>

          <Text className="text-center text-slate-400 text-sm mt-2">
            By continuing, you agree to our Terms of Service.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
