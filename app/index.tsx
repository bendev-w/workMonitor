import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, SafeAreaView, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1a1a1a" }}>Work Monitor</Text>
          <Pressable onPress={() => signOut()} style={{ padding: 8 }}>
            <MaterialIcons name="logout" size={24} color="#666" />
          </Pressable>
        </View>

        {/* User Profile Card */}
        <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 16 }} />
            ) : (
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#4285F4", justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                <MaterialIcons name="person" size={32} color="white" />
              </View>
            )}
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>{user?.name || "User"}</Text>
              <Text style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{user?.email || ""}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 }}>Today's Stats</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "white", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Hours Logged</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#4285F4" }}>0h</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "white", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Tasks Done</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#34a853" }}>0</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ gap: 12 }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#3d78d8" : "#4285F4",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#4285F4",
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            })}
          >
            <MaterialIcons name="play-arrow" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Start Working</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#f5f5f5" : "white",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <MaterialIcons name="history" size={20} color="#4285F4" style={{ marginRight: 8 }} />
            <Text style={{ color: "#4285F4", fontWeight: "700", fontSize: 16 }}>View History</Text>
          </Pressable>
        </View>

        {/* Coming Soon */}
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 20 }}>
          <Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>More features coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
