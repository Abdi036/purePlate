import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
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
  const router = useRouter();
  const { prefs, updatePrefs, isLoading, user } = useAuth();
  const role = prefs?.role;

  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const scannedIds = useMemo(() => prefs?.scannedRestaurantIds ?? [], [prefs]);

  const saveRestaurantId = async (rawValue: string) => {
    if (isSaving) return;
    if (!user) return;

    const normalized = normalizeRestaurantId(rawValue);
    if (!normalized) {
      Alert.alert("Invalid QR", "Unable to read restaurant QR code.");
      setHasScanned(false);
      return;
    }

    const next = Array.from(new Set([...(scannedIds ?? []), normalized]));

    try {
      setIsSaving(true);
      await updatePrefs({ scannedRestaurantIds: next });
      setIsScanning(false);
      setHasScanned(false);
      Alert.alert("Saved", "Restaurant added.");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Unable to save. Please try again.";
      Alert.alert("Save failed", message);
      setHasScanned(false);
    } finally {
      setIsSaving(false);
    }
  };

  const onBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (hasScanned) return;
    setHasScanned(true);
    await saveRestaurantId(result.data);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-8 pt-12">
        {role === "restaurant" ? (
          <Text className="text-white/60 mt-2">
            Show this QR code to customers so they can view your menu.
          </Text>
        ) : (
          <Text className="text-white/60 mt-2">
            Scan a restaurant QR code to instantly view the menu.
          </Text>
        )}

        {/* RESTAURANT VIEW */}
        {role === "restaurant" ? (
          <View className="mt-8">
            {!user ? (
              <Text className="text-white/60">Loading...</Text>
            ) : (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-6 items-center">
                <View className="bg-white p-4 rounded-2xl border border-white/10">
                  <QRCode
                    value={`${RESTAURANT_QR_PREFIX}${user.$id}`}
                    size={220}
                  />
                </View>

                <Text className="text-white/80 font-medium mt-5">
                  Your Restaurant QR
                </Text>
                <Text className="text-white/60 mt-2 text-center">
                  Customers scan this to view your menu
                </Text>
              </View>
            )}
          </View>
        ) : isScanning ? (
          /* CAMERA SCAN MODE */
          <View className="flex-1 mt-6">
            {!permission ? (
              <Text className="text-white/60 mt-2">Loading camera...</Text>
            ) : !permission.granted ? (
              <View className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <Text className="text-white/90 font-semibold">
                  Camera permission required
                </Text>
                <Text className="text-white/60 mt-2">
                  Allow camera access to scan restaurant QR codes.
                </Text>

                <TouchableOpacity
                  className="bg-emerald-500 py-4 rounded-2xl mt-4"
                  onPress={requestPermission}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text className="text-slate-950 text-center font-bold text-lg">
                    Grant Permission
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white/5 border border-white/10 py-4 rounded-2xl mt-3"
                  onPress={() => {
                    setIsScanning(false);
                    setHasScanned(false);
                  }}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text className="text-white/85 text-center font-bold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-1">
                <View className="h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    onBarcodeScanned={onBarcodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                  />
                </View>

                <TouchableOpacity
                  className="bg-white/5 border border-white/10 py-4 rounded-2xl mt-4"
                  onPress={() => {
                    setIsScanning(false);
                    setHasScanned(false);
                  }}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text className="text-white/85 text-center font-bold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <Text className="text-white/60 mt-4 text-center">
                  Point your camera at the restaurant QR code.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* MODERN START SCAN CTA */
          <View className="flex-1 items-center justify-center mt-10">
            <View className="bg-white/5 border border-white/10 rounded-3xl p-8 items-center w-full">
              <View className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-400/20 items-center justify-center">
                <Ionicons
                  name="qr-code-outline"
                  size={44}
                  color="#A7F3D0" // emerald-200
                />
              </View>

              <Text className="text-white/90 text-xl font-semibold mt-6">
                Scan Restaurant QR
              </Text>

              <Text className="text-white/60 text-center mt-2">
                Point your camera at a restaurant QR code to instantly view
                their menu.
              </Text>

              <TouchableOpacity
                className="bg-emerald-500 py-4 rounded-2xl mt-6 w-full"
                onPress={async () => {
                  if (!permission?.granted) {
                    await requestPermission();
                  }
                  setHasScanned(false);
                  setIsScanning(true);
                }}
                disabled={isLoading || isSaving}
                activeOpacity={0.85}
              >
                <Text className="text-slate-950 text-center font-bold text-lg">
                  Scan QR Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
