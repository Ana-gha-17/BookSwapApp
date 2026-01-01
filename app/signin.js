import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import API_BASE from '../config/api';

const API_URL = `${API_BASE}/api/auth`;

const { width, height } = Dimensions.get('window');

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Email and password required");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return Alert.alert("Login Failed", data.message || "Invalid credentials");
      }

      Alert.alert("Success", "Logged in successfully!");
      await AsyncStorage.setItem("token", data.token);
      router.replace("/homescreen");

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const getInputStyle = (inputName) => [
    styles.input,
    focusedInput === inputName && styles.inputFocused,
    inputName === 'email' && email && !isValidEmail(email) && styles.inputError
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerSection}>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={getInputStyle('email')}
                  placeholder="Enter your email"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={getInputStyle('password')}
                  placeholder="Enter your password"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                  (!email || !password) && styles.buttonDisabled
                ]}
                onPress={handleSignIn}
                disabled={loading || !email || !password}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: height * 0.9,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.08,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#d398bc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#d398bc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: Math.min(32, width * 0.08),
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(16, width * 0.04),
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: Math.min(14, width * 0.035),
    color: '#5d6c7d',
    marginBottom: 8,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
    fontSize: Math.min(16, width * 0.04),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputFocused: {
    borderColor: '#d398bc',
    backgroundColor: '#fefefe',
    elevation: 4,
    shadowColor: '#d398bc',
    shadowOpacity: 0.2,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: '#d398bc',
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 6,
    shadowColor: '#d398bc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(16, width * 0.04),
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(211, 152, 188, 0.1)',
  },
  backButtonText: {
    color: '#d398bc',
    fontWeight: 'bold',
    fontSize: Math.min(16, width * 0.04),
  },
});