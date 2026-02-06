import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
}

export const FormField = ({ label, className, ...props }: FormFieldProps) => {
  return (
    <View className="mb-4">
      <Text className="text-slate-700 font-medium mb-2 ml-1">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-slate-800 ${className}`}
        {...props}
      />
    </View>
  );
};
