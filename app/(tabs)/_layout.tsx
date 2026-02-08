import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useAuth } from "../../context/AuthContext";
// 1. Import the icon set (Ionicons is great for a standard look)
import { Ionicons } from '@expo/vector-icons'; 

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
        tabBarActiveTintColor: '#007AFF', // Optional: colors the active tab
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="scan/index"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
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
