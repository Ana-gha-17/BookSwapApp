import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import API_BASE from '../config/api';

const API_URL = `${API_BASE}/api/auth`;

const PRIMARY = "#d398bc"; 
const ACCENT = "#6b4f63";

export default function SignUp() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const containerAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Create refs for TextInput focus management
  const nameRef = useRef(null);
  const departmentRef = useRef(null);
  const registerRef = useRef(null);
  const yearRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    Animated.timing(containerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, []);

  const handleSignUp = async () => {
    if (!name || !department || !registerNumber || !yearOfStudy || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, registerNumber, yearOfStudy, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Signup Failed", data.message || "Something went wrong");
        return;
      }

      Alert.alert("Success", "Account created successfully!");
      router.replace("/signin");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  // small animated button
  const AnimatedButton = ({ title, onPress, variant = "primary", disabled }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    const backgroundColor = variant === "primary" ? PRIMARY : "transparent";
    const textColor = variant === "primary" ? "#fff" : PRIMARY;
    const border = variant === "secondary" ? { borderWidth: 1, borderColor: PRIMARY } : {};

    return (
      <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor, opacity: pressed || disabled ? 0.85 : 1 },
            border,
          ]}
        >
          {loading && variant === "primary" ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const inputWidth = Math.min(600, width - 48);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Removed TouchableWithoutFeedback wrapper and changed keyboardShouldPersistTaps */}
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.container,
              {
                opacity: containerAnim,
                transform: [{ translateY: containerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                width: inputWidth,
              },
            ]}
          >
            <Text style={styles.title}>Create account</Text>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  ref={nameRef}
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#9b9b9b"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => departmentRef.current?.focus()}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  ref={departmentRef}
                  style={styles.input}
                  placeholder="e.g. MCA"
                  placeholderTextColor="#9b9b9b"
                  value={department}
                  onChangeText={setDepartment}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => registerRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Register No.</Text>
                <TextInput
                  ref={registerRef}
                  style={styles.input}
                  placeholder="Register number"
                  placeholderTextColor="#9b9b9b"
                  value={registerNumber}
                  onChangeText={setRegisterNumber}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => yearRef.current?.focus()}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  ref={yearRef}
                  style={styles.input}
                  placeholder="Year of study"
                  placeholderTextColor="#9b9b9b"
                  value={yearOfStudy}
                  onChangeText={setYearOfStudy}
                  keyboardType="numeric"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#9b9b9b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#9b9b9b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={handleSignUp}
              />
            </View>

            <View style={{ height: 8 }} />

            <AnimatedButton title={loading ? "Signing up..." : "Sign up"} onPress={handleSignUp} variant="primary" disabled={loading} />

            <View style={{ height: 12 }} />

            <AnimatedButton title="Back" onPress={() => router.back()} variant="secondary" disabled={loading} />

            <View style={{ height: 12 }} />

            <Text style={styles.smallText}>By creating an account you agree to our Terms & Conditions.</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  container: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: ACCENT },

  row: { flexDirection: "row", marginBottom: 10 },
  field: { flex: 1, marginRight: 10 },
  fieldFull: { marginBottom: 10 },

  label: { fontSize: 13, color: "#666", marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    backgroundColor: "rgba(211,211,211,0.02)",
    shadowColor: PRIMARY,
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  button: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "700" },

  smallText: { color: "#9b9b9b", fontSize: 12, textAlign: "center", marginTop: 8 },
});