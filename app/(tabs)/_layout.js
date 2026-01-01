import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Welcome' }} />
      <Stack.Screen name="signin" options={{ title: 'Sign In' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="booklist" options={{ title: 'Book List' }} />
      <Stack.Screen name="Profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}