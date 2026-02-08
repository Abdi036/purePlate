import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../../components/FormField";

// app/(auth)/reset-password.tsx
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />

      {/* Decorative color wash */}
      <View className="absolute -top-16 -right-24 h-72 w-72 rounded-full bg-emerald-500/20" />
      <View className="absolute top-40 -left-28 h-80 w-80 rounded-full bg-sky-500/15" />
      <View className="absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10" />

      <View className="flex-1 px-6 py-8">
        <View className="flex-row items-center gap-x-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <Text className="text-4xl">🥗</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-white">
              New password
            </Text>
            <Text className="mt-1 text-sm text-white/60">
              Choose something strong and memorable.
            </Text>
          </View>
        </View>

        <View className="mt-10 rounded-3xl bg-white/5 border border-white/10 p-6">
          <FormField
            label="New Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />
          <FormField
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            labelClassName="text-white/70"
            inputClassName="bg-white/5 border-white/10 text-white/90"
          />

          <TouchableOpacity
            className="bg-emerald-500 py-4 rounded-2xl mt-3"
            activeOpacity={0.85}
          >
            <Text className="text-slate-950 text-center font-bold text-lg">
              Update Password
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
