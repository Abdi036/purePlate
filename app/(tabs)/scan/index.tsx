import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanTab() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        <Text className="text-3xl font-bold text-slate-900">Scan</Text>
        <Text className="text-slate-500 mt-2">Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}
