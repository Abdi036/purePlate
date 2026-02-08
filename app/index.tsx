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
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      <View className="flex-1 px-6 py-10">
        {/* Decorative color wash (no gradients; layered translucent shapes) */}
        <View className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-emerald-500/20" />
        <View className="absolute top-24 -left-28 h-80 w-80 rounded-full bg-sky-500/15" />
        <View className="absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10" />

        <View className="flex-1 justify-between">
          {/* Hero */}
          <View className="pt-6">
            <View className="flex-row items-center gap-x-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <Text className="text-4xl">🥗</Text>
              </View>

              <View className="flex-1">
                <Text className="text-3xl font-bold tracking-tight text-white">
                  Pure<Text className="text-emerald-400">Plate</Text>
                </Text>
                <Text className="mt-1 text-sm text-white/60">
                  Clean eating, made effortless.
                </Text>
              </View>
            </View>

            <Text className="mt-8 text-4xl font-extrabold tracking-tight text-white">
              Eat smarter.
              <Text className="text-emerald-400"> Feel</Text> better.
            </Text>
            <Text className="mt-4 text-base leading-6 text-white/70">
              Scan meals, log food fast, and stay on track with nutrition that
              fits your goals.
            </Text>

            {/* Feature chips */}
            <View className="mt-7 flex-row flex-wrap gap-3">
              <View className="flex-row items-center gap-x-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
                <Text className="text-base">📸</Text>
                <Text className="text-sm font-medium text-white/80">Scan</Text>
              </View>
              <View className="flex-row items-center gap-x-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
                <Text className="text-base">🧾</Text>
                <Text className="text-sm font-medium text-white/80">Log</Text>
              </View>
              <View className="flex-row items-center gap-x-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
                <Text className="text-base">📊</Text>
                <Text className="text-sm font-medium text-white/80">Track</Text>
              </View>
            </View>
          </View>

          {/* Center highlight */}
          <View className="mt-10">
            <View className="rounded-3xl bg-white/5 border border-white/10 p-6">
              <Text className="text-white/90 text-base font-semibold">
                Built for real life
              </Text>
              <Text className="mt-2 text-white/65 leading-6">
                Simple inputs. Clear insights. Delicious decisions—without
                overthinking.
              </Text>
              <View className="mt-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 px-4 py-3">
                <Text className="text-emerald-200 font-medium">
                  “Eat clean, feel incredible.”
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom actions */}
          <View className="mt-10 gap-y-3">
            <Link href="/signup" asChild>
              <TouchableOpacity
                activeOpacity={0.85}
                className="rounded-2xl bg-emerald-500 py-4"
              >
                <Text className="text-center text-lg font-semibold text-slate-950">
                  Get Started
                </Text>
              </TouchableOpacity>
            </Link>

            <Link href="/login" asChild>
              <TouchableOpacity
                activeOpacity={0.7}
                className="rounded-2xl border border-white/15 bg-white/5 py-4"
              >
                <Text className="text-center text-lg font-medium text-white/85">
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
