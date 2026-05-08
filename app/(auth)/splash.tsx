import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Splash() {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("📄 Splash screen - loading:", loading, "user:", user?.name);
    
    if (!loading && user) {
      console.log("🏠 User authenticated on splash screen, navigating to home");
      router.replace("/");
    } else if (!loading && !user) {
      console.log("🔐 No user on splash screen, showing sign-in");
      router.replace("/(auth)/sign-in");
    }
  }, [loading, user, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
      <ActivityIndicator size="large" color="#4285F4" />
      <Text style={{ marginTop: 16, fontSize: 14, color: "#666" }}>Loading...</Text>
    </View>
  );
}
