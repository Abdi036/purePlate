import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileTab() {
  const router = useRouter();
  const { user, prefs, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const email = useMemo(() => {
    const anyUser: any = user;
    return typeof anyUser?.email === "string" ? anyUser.email : "";
  }, [user]);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      await signOut();
      router.replace("/");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to sign out. Please try again.";
      Alert.alert("Sign out failed", message);
    } finally {
      setIsSigningOut(false);
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
      >
        <Text className="text-3xl font-bold text-slate-900">Profile</Text>

        {isLoading ? (
          <Text className="text-slate-500 mt-2">Loading...</Text>
        ) : !user ? (
          <Text className="text-slate-500 mt-2">Not signed in.</Text>
        ) : (
          <View className="mt-6 gap-y-3">
            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <Text className="text-slate-700 font-medium">Name</Text>
              <Text className="text-slate-900 mt-1">{user.name}</Text>
            </View>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <Text className="text-slate-700 font-medium">Email</Text>
              <Text className="text-slate-900 mt-1">
                {email || "(not available)"}
              </Text>
            </View>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <Text className="text-slate-700 font-medium">Role</Text>
              <Text className="text-slate-900 mt-1">
                {prefs?.role ?? "(not set)"}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-2xl mt-6"
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
