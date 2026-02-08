import React, { useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

const RESTAURANT_QR_PREFIX = "pureplate:restaurant:";

function normalizeRestaurantId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith(RESTAURANT_QR_PREFIX)) {
    return trimmed.slice(RESTAURANT_QR_PREFIX.length).trim();
  }
  return trimmed;
}

export default function ScanTab() {
  const { prefs, updatePrefs, isLoading, user } = useAuth();
  const role = prefs?.role;
  const [restaurantId, setRestaurantId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const scannedIds = useMemo(() => prefs?.scannedRestaurantIds ?? [], [prefs]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!user) return;

    const normalized = normalizeRestaurantId(restaurantId);
    if (!normalized) {
      Alert.alert("Missing info", "Enter a restaurant ID / QR value.");
      return;
    }

    const next = Array.from(new Set([...(scannedIds ?? []), normalized]));

    try {
      setIsSaving(true);
      await updatePrefs({ scannedRestaurantIds: next });
      setRestaurantId("");
      Alert.alert("Saved", "Restaurant added.");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to save. Please try again.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">Scan</Text>
        {role === "restaurant" ? (
          <Text className="text-slate-500 mt-2">
            Show this QR code to customers so they can view your menu.
          </Text>
        ) : (
          <Text className="text-slate-500 mt-2">
            For now, paste the Restaurant ID (or QR payload).
          </Text>
        )}

        {role === "restaurant" ? (
          <View className="mt-8">
            {!user ? (
              <Text className="text-slate-500">Loading...</Text>
            ) : (
              <View className="bg-slate-50 border border-slate-100 rounded-2xl p-6 items-center">
                <View className="bg-white p-4 rounded-2xl border border-slate-100">
                  <QRCode
                    value={`${RESTAURANT_QR_PREFIX}${user.$id}`}
                    size={220}
                  />
                </View>

                <Text className="text-slate-700 font-medium mt-5">
                  Your Restaurant ID
                </Text>
                <Text className="text-slate-500 mt-2 text-center">
                  {user.$id}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View className="mt-6">
              <Text className="text-slate-700 font-medium mb-2 ml-1">
                Restaurant ID / QR
              </Text>
              <TextInput
                placeholder="e.g. 65c0..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800"
                value={restaurantId}
                onChangeText={setRestaurantId}
              />

              <TouchableOpacity
                className="bg-emerald-500 py-4 rounded-2xl mt-4"
                onPress={handleSave}
                disabled={isLoading || isSaving}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>

              <View className="mt-8">
                <Text className="text-slate-700 font-medium">
                  Scanned restaurants
                </Text>
                {scannedIds.length === 0 ? (
                  <Text className="text-slate-500 mt-2">None yet.</Text>
                ) : (
                  scannedIds.map((id) => (
                    <Text key={id} className="text-slate-700 mt-2">
                      {id}
                    </Text>
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
