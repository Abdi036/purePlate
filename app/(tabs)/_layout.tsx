import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="scan/index"
        options={{
          title: "Scan",
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
        }}
      />

      <Tabs.Screen
        name="add-food/index"
        options={{
          href: null,
          title: "Add Food",
        }}
      />
    </Tabs>
  );
}
