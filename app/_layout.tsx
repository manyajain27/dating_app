import { Stack } from "expo-router";
import "../global.css"
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView>
        <Stack
        screenOptions={{
          headerShown: false,
        }}
        >
          <Stack.Screen name="index"/>
          <Stack.Screen name="(auth)"/>
          <Stack.Screen name="(tabs)"/>
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  )
}
