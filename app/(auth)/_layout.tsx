import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#020617" },
        headerTintColor: "#34d399",
      }}
    >
      <Stack.Screen name="login/index" options={{ headerShown: false }} />
      <Stack.Screen name="signup/index" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="reset-password/index" />
    </Stack>
  );
}
