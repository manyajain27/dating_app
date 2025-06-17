import { Stack } from "expo-router";
import "../global.css"
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
      screenOptions={{
        headerShown: false,
      }}
      >
        <Stack.Screen name="index"/>
        <Stack.Screen name="(auth)"/>
        <Stack.Screen name="(tabs)"/>
      </Stack>
    </AuthProvider>
  )
}
