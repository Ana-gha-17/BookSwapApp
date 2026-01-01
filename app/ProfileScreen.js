import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import API_BASE from '../config/api';

const API_URL = `${API_BASE}/api/auth`;
const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
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
        setUser(data);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#d398bc" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ProfileField = ({ label, value }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value || "N/A"}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.heading}>My Profile</Text>
            <Text style={styles.subheading}>Student Information</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.card}>
            <ProfileField label="Full Name" value={user?.name} />
            <ProfileField label="Email Address" value={user?.email} />
            <ProfileField label="Department" value={user?.department} />
            <ProfileField label="Year of Study" value={user?.yearOfStudy} />
            <ProfileField label="Register Number" value={user?.registerNumber} />
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Keep your profile information updated for better experience
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d398bc",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#d398bc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  heading: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subheading: {
    fontSize: Math.min(16, width * 0.04),
    color: "#7f8c8d",
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderTopWidth: 4,
    borderTopColor: "#d398bc",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: Math.min(14, width * 0.035),
    color: "#7f8c8d",
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#d398bc",
  },
  value: {
    fontSize: Math.min(16, width * 0.04),
    color: "#2c3e50",
    fontWeight: "500",
  },
  footerSection: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: Math.min(14, width * 0.035),
    color: "#95a5a6",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
});