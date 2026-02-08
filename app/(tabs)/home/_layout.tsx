import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="restaurant/[restaurantId]" />
      <Stack.Screen name="[foodId]" />
    </Stack>
  );
}
