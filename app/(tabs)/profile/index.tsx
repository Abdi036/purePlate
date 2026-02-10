import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
  const { user, prefs, isLoading, signOut, updateName, updatePrefs } =
    useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const isCustomer = prefs?.role === "customer";

  const [ingredientKind, setIngredientKind] = useState<"allergic" | "disliked">(
    "allergic",
  );
  const [draftIngredient, setDraftIngredient] = useState("");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

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

  const allergicList = useMemo(() => {
    const list = prefs?.allergicIngredients;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [prefs?.allergicIngredients]);

  const dislikedList = useMemo(() => {
    const list = prefs?.dislikedIngredients;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [prefs?.dislikedIngredients]);

  const normalizeItem = (value: string) => value.trim();

  const uniquePush = (list: string[], value: string) => {
    const next = normalizeItem(value);
    if (!next) return list;
    const nextKey = next.toLowerCase();
    const exists = list.some((x) => String(x).trim().toLowerCase() === nextKey);
    if (exists) return list;
    return [...list, next];
  };

  const removeItem = (list: string[], value: string) => {
    const key = normalizeItem(value).toLowerCase();
    return list.filter((x) => String(x).trim().toLowerCase() !== key);
  };

  const addIngredient = async () => {
    if (!isCustomer) return;
    if (isSavingPrefs) return;
    const next = normalizeItem(draftIngredient);
    if (!next) return;

    const list = ingredientKind === "allergic" ? allergicList : dislikedList;
    const updated = uniquePush(list, next);
    if (updated.length === list.length) {
      setDraftIngredient("");
      return;
    }

    try {
      setIsSavingPrefs(true);
      await updatePrefs(
        ingredientKind === "allergic"
          ? { allergicIngredients: updated }
          : { dislikedIngredients: updated },
      );
      setDraftIngredient("");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update preferences. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const removeAllergic = async (value: string) => {
    if (!isCustomer) return;
    if (isSavingPrefs) return;
    const updated = removeItem(allergicList, value);
    try {
      setIsSavingPrefs(true);
      await updatePrefs({ allergicIngredients: updated });
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update preferences. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const removeDisliked = async (value: string) => {
    if (!isCustomer) return;
    if (isSavingPrefs) return;
    const updated = removeItem(dislikedList, value);
    try {
      setIsSavingPrefs(true);
      await updatePrefs({ dislikedIngredients: updated });
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to update preferences. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSavingPrefs(false);
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

            {isCustomer ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-6">
                <Text className="text-white/70 font-medium">Ingredients</Text>
                <Text className="text-white/60 mt-2">
                  Add allergies or dislikes so you can avoid them.
                </Text>

                <View className="mt-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/70 font-medium">
                      Allergic / Dislike
                    </Text>
                    <View className="flex-row bg-white/5 border border-white/10 rounded-full p-1">
                      <TouchableOpacity
                        className={`px-3 py-2 rounded-full ${ingredientKind === "allergic" ? "bg-white/10" : ""}`}
                        onPress={() => setIngredientKind("allergic")}
                        disabled={isSavingPrefs}
                        activeOpacity={0.85}
                      >
                        <Text
                          className={`text-xs font-extrabold ${ingredientKind === "allergic" ? "text-white" : "text-white/60"}`}
                        >
                          ALLERGIC
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`px-3 py-2 rounded-full ${ingredientKind === "disliked" ? "bg-white/10" : ""}`}
                        onPress={() => setIngredientKind("disliked")}
                        disabled={isSavingPrefs}
                        activeOpacity={0.85}
                      >
                        <Text
                          className={`text-xs font-extrabold ${ingredientKind === "disliked" ? "text-white" : "text-white/60"}`}
                        >
                          DISLIKE
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <TextInput
                      value={draftIngredient}
                      onChangeText={setDraftIngredient}
                      placeholder={
                        ingredientKind === "allergic"
                          ? "e.g. peanuts"
                          : "e.g. onions"
                      }
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-semibold"
                      editable={!isSavingPrefs}
                      returnKeyType="done"
                      onSubmitEditing={addIngredient}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      className="ml-3 bg-emerald-500 rounded-2xl px-4 py-3"
                      onPress={addIngredient}
                      disabled={isSavingPrefs}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={18} color="#020617" />
                    </TouchableOpacity>
                  </View>

                  {allergicList.length > 0 ? (
                    <View className="flex-row flex-wrap mt-3">
                      {allergicList.map((item) => (
                        <TouchableOpacity
                          key={`allergic:${item}`}
                          className="bg-white/5 border border-white/10 rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center"
                          onPress={() => removeAllergic(item)}
                          disabled={isSavingPrefs}
                          activeOpacity={0.85}
                        >
                          <Text className="text-white/90 font-semibold">
                            {item}
                          </Text>
                          <Ionicons
                            name="close"
                            size={14}
                            color="rgba(255,255,255,0.75)"
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-white/50 mt-3">
                      No allergies added.
                    </Text>
                  )}
                </View>

                <View className="mt-6">
                  {dislikedList.length > 0 ? (
                    <View className="flex-row flex-wrap mt-3">
                      {dislikedList.map((item) => (
                        <TouchableOpacity
                          key={`disliked:${item}`}
                          className="bg-white/5 border border-white/10 rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center"
                          onPress={() => removeDisliked(item)}
                          disabled={isSavingPrefs}
                          activeOpacity={0.85}
                        >
                          <Text className="text-white/90 font-semibold">
                            {item}
                          </Text>
                          <Ionicons
                            name="close"
                            size={14}
                            color="rgba(255,255,255,0.75)"
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-white/50 mt-3">
                      No dislikes added.
                    </Text>
                  )}
                </View>

                {isSavingPrefs ? (
                  <Text className="text-white/50 mt-4">Saving…</Text>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-2xl mt-10 flex-row items-center justify-center"
              onPress={handleSignOut}
              disabled={isSigningOut || isSavingName || isSavingPrefs}
              activeOpacity={0.85}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#020617"
                style={{ marginRight: 8 }}
              />
              <Text className="text-slate-950 font-extrabold text-lg">
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
