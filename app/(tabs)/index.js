import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768; // Tablet/Desktop breakpoint

export default function Index() {
  const router = useRouter();

  return (
    <ImageBackground 
      source={require('../../assets/bg/bookimage.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
        style={styles.overlay}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Welcome to BookSwapApp</Text>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/signin')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.outlineButton]} 
            onPress={() => router.push('/signup')}
          >
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: isLargeScreen ? "40%" : "85%",
    maxWidth: 600,
    alignItems: 'center',
    padding: isLargeScreen ? 40 : 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: Platform.OS === "web" ? "blur(10px)" : "none", // web-only glass effect
  },
  title: { 
    fontSize: isLargeScreen ? 42 : 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: isLargeScreen ? 50 : 40,
  },
  button: {
    backgroundColor: '#d398bc',
    paddingVertical: isLargeScreen ? 18 : 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    transitionDuration: Platform.OS === "web" ? "200ms" : undefined,
  },
  buttonText: {
    color: '#fff',
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: '600',
    textTransform: "uppercase",
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d398bc',
  },
  outlineButtonText: {
    color: '#d398bc',
  }
});
