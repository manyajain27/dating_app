import { AuthGuard } from "@/context/AuthGaurd";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <AuthGuard requireAuth={false}>
      <Redirect href="/(auth)/AuthScreen" />
    </AuthGuard>
  );
}
