import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import API_BASE from '../config/api';

const API_URL = `${API_BASE}/api/auth`;
const PRIMARY = "#d398bc";
const ACCENT = "#6b4f63"; // subtle darker accent for text

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current; // for container fade/slide
  const translateY = useRef(new Animated.Value(12)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    // entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();

    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to fetch user");
        setUser(null);
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUser(data);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("Logout button pressed");
    const isWeb = Platform.OS === "web";
  
    const performLogout = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token found:", !!token);
  
        if (token) {
          console.log("Calling logout API...");
          const res = await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
  
          if (!res.ok) {
            console.warn("Logout API failed (non-critical):", res.status);
          }
        }
  
        // Clear token
        await AsyncStorage.removeItem("token");
        console.log("Token cleared");
  
        // ✅ Redirect to tabs index
        if (isWeb) {
          window.location.href = "/";
        } else {
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.error("Logout error:", err);
  
        try {
          await AsyncStorage.removeItem("token");
        } catch {}
  
        if (isWeb) {
          window.location.href = "/";
        } else {
          router.replace("/(tabs)");
        }
  
        if (!isWeb) {
          Alert.alert("Error", "Logout failed. Token cleared locally.");
        }
      }
    };
  
    // ✅ Platform-specific confirmation
    if (isWeb) {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        performLogout();
      } else {
        console.log("Logout cancelled");
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: performLogout, 
        },
      ]);
    }
  };
  

  // small reusable animated button (scale on press)
  function AnimatedButton({ title, onPress, style, accessibilityLabel, destructive = false }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            destructive ? styles.destructiveButton : null,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.buttonText, destructive ? styles.destructiveButtonText : null]}>
            {title}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Redirect to signin if no user (no token or invalid)
  if (!user) {
    router.replace("/signin");
    return null;
  }

  const isWide = width >= 420;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.avatarWrap}>
              {user?.profile_photo ? (
                <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
              ) : (
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{(user?.name || "G").charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.greetingWrap}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user?.name || "Guest"}!</Text>
              {user?.department && <Text style={styles.metaText}>{user.department}</Text>}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardText}>Email: {user?.email || "—"}</Text>
            {user?.year && <Text style={styles.cardText}>Year: {user.year}</Text>}
            {user?.registerNo && <Text style={styles.cardText}>Reg. No: {user.registerNo}</Text>}
          </View>

          <View style={[styles.actions, isWide ? styles.actionsRow : styles.actionsColumn]}>
            <AnimatedButton
              title="Add New Book"
              onPress={() => router.push("/AddBook")}
              accessibilityLabel="Add a new book"
              style={styles.actionButtonWrap}
            />

            <AnimatedButton
              title="My Books"
              onPress={() => router.push("/BookDetails")}
              accessibilityLabel="View book details"
              style={styles.actionButtonWrap}
            />

            <AnimatedButton
              title="My Profile"
              onPress={() => router.push("/ProfileScreen")}
              accessibilityLabel="Open my profile"
              style={styles.actionButtonWrap}
            />

            <AnimatedButton
              title="Available Books"
              onPress={() => router.push("/AvailableBooks")}
              accessibilityLabel="Browse available books from other users"
              style={styles.actionButtonWrap}
            />
            <AnimatedButton
              title="Manage Requests"
              onPress={() => router.push("/MyRequests")}
              accessibilityLabel="Manage Requests"
              style={styles.actionButtonWrap}
            />
          </View>

          <View style={styles.logoutSection}>
            <AnimatedButton
              title="Logout"
              onPress={handleLogout}
              accessibilityLabel="Log out of the app"
              destructive={true}
              style={styles.logoutButtonWrap}
            />
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerText}>bookswap</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingTop: 28 },
  container: {
    flex: 1,
    gap: 12,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: 72, height: 72, borderRadius: 12 },
  initialsCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  greetingWrap: { flex: 1 },
  welcomeText: { color: ACCENT, fontSize: 14 },
  nameText: { fontSize: 22, fontWeight: "700", color: "#222" },
  metaText: { color: "#666", marginTop: 4 },

  card: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: ACCENT },
  cardText: { color: "#444", marginBottom: 4 },

  actions: {
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionsColumn: {
    flexDirection: "column",
    gap: 10,
  },
  actionButtonWrap: { flex: 1, marginVertical: 6 },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  destructiveButton: {
    backgroundColor: "#e74c3c",
    shadowColor: "#e74c3c",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  destructiveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  logoutSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  logoutButtonWrap: {
    flex: 1,
    marginVertical: 6,
  },

  footerNote: { marginTop: 20, alignItems: "center" },
  footerText: { color: "#999", fontSize: 13 },
});