import { Text, TextInput, TouchableOpacity, View } from "react-native";

// app/(auth)/reset-password.tsx
export default function ResetPassword() {
  return (
    <View className="flex-1 bg-white px-8 pt-4">
      <Text className="text-2xl font-bold text-slate-900">New Password</Text>
      <Text className="text-slate-500 mt-2 mb-8">Please enter your new password below.</Text>
      
      <TextInput placeholder="New Password" secureTextEntry className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4" />
      <TextInput placeholder="Confirm Password" secureTextEntry className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6" />
      
      <TouchableOpacity className="bg-emerald-500 py-4 rounded-2xl">
        <Text className="text-white text-center font-bold text-lg">Update Password</Text>
      </TouchableOpacity>
    </View>
  );
}