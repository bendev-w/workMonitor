import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 RootLayoutNav - user:", user?.name, "loading:", loading, "segment:", segments[0]);
    
    if (loading) {
      console.log("⏳ Still loading, skipping navigation");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    console.log("🎯 Navigation check - inAuthGroup:", inAuthGroup);

    // Route based on auth state
    if (!user && !inAuthGroup) {
      console.log("→ Navigating to splash (not authenticated)");
      router.replace("/(auth)/splash");
    } else if (user && inAuthGroup) {
      console.log("→ Navigating to home (authenticated)");
      router.replace("/");
    } else {
      console.log("→ Already on correct route");
    }
  }, [user, loading]); // Note: removed segments to prevent infinite loops

  // Show loading while auth initializes
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
