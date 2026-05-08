import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function SignIn() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Header Section */}
      <View style={{ flex: 0.4, justifyContent: "center", alignItems: "center", paddingTop: 40 }}>
        <View style={{ width: 120, height: 120, backgroundColor: "#4285F4", borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }}>
          <Image source={require("../../assets/images/splash-icon.png")} style={{ width: 80, height: 80 }} />
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 }}>Work Monitor</Text>
        <Text style={{ fontSize: 16, color: "#666", textAlign: "center", paddingHorizontal: 20, lineHeight: 24 }}>Track your work hours and productivity</Text>
      </View>

      {/* Content Section */}
      <View style={{ flex: 0.6, paddingHorizontal: 20, justifyContent: "space-between", paddingBottom: 40 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 20 }}>Get Started</Text>
          <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>Sign in to access your work tracking dashboard and manage your productivity goals.</Text>
        </View>

        {/* Login Button */}
        <View>
          <Pressable
            onPress={async () => {
              console.log("🔐 Sign in button pressed");
              await signIn();
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#1f5dd1" : "#4285F4",
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              shadowColor: "#000000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 0,
            })}
          >
            <MaterialIcons name="login" size={20} color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 }}>Sign in with Google</Text>
          </Pressable>

          {loading && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
              <Text style={{ color: "#4285F4", fontSize: 14, fontWeight: "600" }}>Signing in...</Text>
            </View>
          )}

          <Text style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 16 }}>We'll never post without permission</Text>
        </View>
      </View>
    </View>
  );
}
