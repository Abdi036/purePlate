import { Link } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupPage() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">
          Create Account
        </Text>
        <Text className="text-slate-500 mt-2 mb-8">
          Join PurePlate today for a better lifestyle.
        </Text>

        <View className="gap-y-4">
          <TextInput
            placeholder="Full Name"
            className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
          />
          <TextInput
            placeholder="Email Address"
            className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
            secureTextEntry
          />

          <TouchableOpacity className="bg-emerald-500 py-4 rounded-2xl mt-4">
            <Text className="text-white text-center font-bold text-lg">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-10">
          <Text className="text-slate-500">Already a member? </Text>
          <Link href="/login">
            <Text className="text-emerald-600 font-bold">Log In</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
