import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileTab() {
  const router = useRouter();
  const { user, prefs, isLoading, signOut, updateName } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const email = useMemo(() => {
    const anyUser: any = user;
    return typeof anyUser?.email === "string" ? anyUser.email : "";
  }, [user]);

  const displayName = useMemo(() => {
    const name = typeof user?.name === "string" ? user.name.trim() : "";
    if (name) return name;
    if (email) return email;
    return "User";
  }, [email, user?.name]);

  const initial = useMemo(() => {
    const s = displayName.trim();
    const ch = s[0] ?? "";
    return ch ? ch.toUpperCase() : "•";
  }, [displayName]);

  const startEditName = () => {
    if (!user) return;
    setDraftName(typeof user.name === "string" ? user.name : "");
    setIsEditingName(true);
  };

  const cancelEditName = () => {
    setIsEditingName(false);
    setDraftName("");
  };

  const saveName = async () => {
    if (!user) return;
    if (isSavingName) return;

    const next = draftName.trim();
    const current = typeof user.name === "string" ? user.name.trim() : "";

    if (!next) {
      Alert.alert("Missing info", "Please enter your name.");
      return;
    }

    if (next === current) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingName(true);
      await updateName(next);
      setIsEditingName(false);
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update name. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSavingName(false);
    }
  };

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
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-10"
      >
        {isLoading ? (
          <Text className="text-white/60 mt-2">Loading...</Text>
        ) : !user ? (
          <Text className="text-white/60 mt-2">Not signed in.</Text>
        ) : (
          <View className="mt-8">
            <View className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <View className="flex-row items-center ">
                <View className="w-20 h-20 rounded-full bg-white/10 border border-white/10 items-center justify-center">
                  <Text className="text-white font-extrabold text-4xl">
                    {initial}
                  </Text>
                </View>

                <View className="flex-1 ml-4">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-white text-2xl font-extrabold tracking-tight flex-1 pr-3"
                      numberOfLines={1}
                    >
                      {typeof user.name === "string" && user.name.trim()
                        ? user.name
                        : "Your account"}
                    </Text>

                    <TouchableOpacity
                      className="bg-white/5 border border-white/10 rounded-full px-3 py-2"
                      onPress={startEditName}
                      disabled={isEditingName || isSavingName}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="pencil"
                        size={16}
                        color="rgba(255,255,255,0.85)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-10">
              <Text className="text-white/70 font-medium">Account</Text>

              <View className="mt-4">
                <View className="py-3 border-b border-white/10">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/60">Name</Text>

                    {!isEditingName ? (
                      <TouchableOpacity
                        className="flex-row items-center"
                        onPress={startEditName}
                        disabled={isSavingName}
                        activeOpacity={0.85}
                      >
                        <Text
                          className="text-white/90 font-semibold"
                          numberOfLines={1}
                        >
                          {user.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="rgba(255,255,255,0.55)"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {isEditingName ? (
                    <View className="mt-3">
                      <TextInput
                        value={draftName}
                        onChangeText={setDraftName}
                        placeholder="Your name"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-semibold"
                        editable={!isSavingName}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={saveName}
                      />

                      <View className="flex-row gap-x-3 mt-3">
                        <TouchableOpacity
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4"
                          onPress={cancelEditName}
                          disabled={isSavingName}
                          activeOpacity={0.85}
                        >
                          <Text className="text-white/90 text-center font-extrabold">
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className="flex-1 bg-emerald-500 rounded-2xl py-4"
                          onPress={saveName}
                          disabled={isSavingName}
                          activeOpacity={0.85}
                        >
                          <Text className="text-slate-950 text-center font-extrabold">
                            {isSavingName ? "Saving..." : "Save"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-between py-3 border-b border-white/10">
                  <Text className="text-white/60">Email</Text>
                  <Text
                    className="text-white/90 font-semibold"
                    numberOfLines={1}
                  >
                    {email || "(not available)"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-3">
                  <Text className="text-white/60">Role</Text>
                  <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    <Text className="text-white/80 text-xs font-semibold">
                      {prefs?.role ?? "(not set)"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-2xl mt-10"
              onPress={handleSignOut}
              disabled={isSigningOut || isSavingName}
              activeOpacity={0.85}
            >
              <Text className="text-slate-950 text-center font-extrabold text-lg">
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
