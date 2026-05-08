import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeDatabase } from "../lib/database";

WebBrowser.maybeCompleteAuthSession();

type User = {
  id: string;
  name: string | null;
  email: string | null;
  picture?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Read client IDs from app config (expo.extra.googleClientIds)
  const extra = (Constants.expoConfig && (Constants.expoConfig as any).extra) || {};
  const clientIds = extra.googleClientIds || {};
  const hasCredentials = !!(clientIds.webClientId && !clientIds.webClientId.includes("YOUR_"));

  // Provide dummy credentials if not configured to avoid hook validation errors
  const authConfig = hasCredentials
    ? {
        webClientId: clientIds.webClientId, // web
        androidClientId: clientIds.androidClientId,
        iosClientId: clientIds.iosClientId,
        scopes: ["profile", "email"],
      }
    : {
        webClientId: "37414041162-dinv0kb0dooq8n5bvpo2q5svv0hnc7ef.apps.googleusercontent.com",
        androidClientId: "dummy.apps.googleusercontent.com",
        iosClientId: "dummy.apps.googleusercontent.com",
        scopes: ["profile", "email"],
      };

  const [request, response, promptAsync] = Google.useAuthRequest(authConfig);

  useEffect(() => {
    // Initialize database and restore session
    const restore = async () => {
      try {
        console.log("🔄 Starting auth initialization...");
        
        // Initialize database on app start
        console.log("🗄️ Initializing database...");
        await initializeDatabase();
        console.log("✅ Database initialized");

        console.log("🔐 Checking SecureStore for stored auth...");
        let stored: string | null = null;
        try {
          stored = await SecureStore.getItemAsync("auth_user");
          console.log("📦 SecureStore result:", stored ? "User found" : "No user stored");
        } catch (e) {
          console.warn("⚠️ SecureStore error (might be normal on web):", e);
        }
        
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored);
            console.log("✅ Parsed stored user:", parsedUser.name);
            setUser(parsedUser);
          } catch (parseError) {
            console.warn("⚠️ Failed to parse stored user:", parseError);
          }
        } else {
          console.log("ℹ️ No stored user - will show sign in screen");
        }
      } catch (e) {
        console.error("❌ Failed to restore auth:", e);
      } finally {
        console.log("✅ Auth initialization complete - setting loading to false");
        setLoading(false);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success") {
        const { authentication } = response;
        if (!authentication?.accessToken) return;
        try {
          // fetch user info
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          });
          const profile = await res.json();
          const u: User = {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
          };
          setUser(u);
          try {
            await SecureStore.setItemAsync("auth_user", JSON.stringify(u));
            await SecureStore.setItemAsync("auth_token", authentication.accessToken);
          } catch (storeError) {
            console.debug("Failed to store credentials:", storeError);
          }
        } catch (e) {
          console.warn("Failed to fetch Google profile:", e);
        }
      }
    };
    handleResponse();
  }, [response]);

  const signIn = async () => {
    // promptAsync will open the web browser; caller will be handled in response above
    if (!hasCredentials) {
      console.warn("Google credentials not configured. Please add credentials to app.json");
      return;
    }
    try {
      setLoading(true);
      await promptAsync();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await SecureStore.deleteItemAsync("auth_user");
        await SecureStore.deleteItemAsync("auth_token");
      } catch (storeError) {
        console.debug("Failed to delete stored credentials:", storeError);
      }
      setUser(null);
    } catch (e) {
      console.warn("Failed to sign out:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
