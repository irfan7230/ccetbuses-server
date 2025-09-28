import { PaperProvider, MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux'; // 1. Import Provider
import { store, RootState } from '../store/store';

// Grok-inspired dark theme
const GrokTheme = {
  ...DefaultTheme,
  roundness: 16,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    background: '#000000',
    surface: 'rgba(255, 255, 255, 0.05)',
    text: '#FFFFFF',
    placeholder: 'rgba(255, 255, 255, 0.5)',
    outline: 'rgba(255, 255, 255, 0.1)',
  },
};

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const inAppGroup = segments[0] === '(tabs)' || segments[0] === '(screens)';

    if (!isAuthenticated && inAppGroup) {
      // If user is not logged in and tries to access a protected screen, send to login.
      router.replace('/login');
    } else if (isAuthenticated && user && !user.isProfileComplete) {
      // If user IS logged in but profile is NOT complete, force them to edit profile.
      router.replace('/(screens)/edit-profile');
    } else if (isAuthenticated && user && user.isProfileComplete && !inAppGroup) {
      // If user IS logged in and profile IS complete, but they are outside the app, send to dashboard.
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, segments]);

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }}/>
        <Stack.Screen 
          name="(screens)/edit-profile" 
          options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} 
        />
        <Stack.Screen name="(screens)/settings" options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} />
        <Stack.Screen name="(screens)/help" options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} />
        <Stack.Screen name="(screens)/privacy" options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} />
        <Stack.Screen 
          name="(screens)/notifications" 
          options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} 
        />
        <Stack.Screen 
          name="(screens)/chat" 
          options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} 
        />
      </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // Return null until fonts are loaded
  }

  return (
    <Provider store={store}>
      <PaperProvider theme={GrokTheme}>
        <StatusBar barStyle="light-content" />
        <RootLayoutNav />
      </PaperProvider>
    </Provider>
  );
}