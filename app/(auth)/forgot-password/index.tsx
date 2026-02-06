import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPassword() {
  return (
    <View className="flex-1 bg-white px-8 pt-4">
      <Text className="text-2xl font-bold text-slate-900">Reset Password</Text>
      <Text className="text-slate-500 mt-2 mb-8">
        Enter your email and we&apos;ll send you a link to reset your password.
      </Text>

      <TextInput
        placeholder="Email Address"
        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6"
      />

      <TouchableOpacity className="bg-emerald-500 py-4 rounded-2xl">
        <Text className="text-white text-center font-bold text-lg">
          Send Reset Link
        </Text>
      </TouchableOpacity>
    </View>
  );
}
