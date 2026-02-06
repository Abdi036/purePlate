import { Link } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "../../../components/FormField";

export default function SignupPage() {
  const [role, setRole] = useState<"customer" | "restaurant">("customer");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">
          Create Account
        </Text>
        <Text className="text-slate-500 mt-2 mb-8">
          Join PurePlate today for a better lifestyle.
        </Text>

        <View>
          <FormField label="Full Name" placeholder="Full Name" />
          <FormField
            label="Email Address"
            placeholder="Email Address"
            keyboardType="email-address"
          />
          <FormField label="Password" placeholder="Password" secureTextEntry />

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
