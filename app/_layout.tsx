import { PaperProvider, MD3DarkTheme as DefaultTheme } from 'react-native-paper';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react'; // 1. Import useState
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState } from '../store/store';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { login, logout } from '../store/slices/authSlice';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [authLoaded, setAuthLoaded] = useState(false); // 2. State to track if we've checked storage

  // 3. This effect listens to Firebase Auth state AND checks AsyncStorage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const savedUserJSON = await ReactNativeAsyncStorage.getItem('userData');
        if (savedUserJSON) {
          const savedUser = JSON.parse(savedUserJSON);
          dispatch(login(savedUser));
        }
      } catch (e) {
        console.error("Failed to load user data from storage", e);
      } finally {
        setAuthLoaded(true);
      }
    };

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] Firebase auth state changed:', firebaseUser ? 'Authenticated' : 'Not authenticated');
      
      if (!firebaseUser) {
        // No Firebase Auth session - check if we have stale AsyncStorage data
        const savedUserJSON = await ReactNativeAsyncStorage.getItem('userData');
        if (savedUserJSON) {
          console.log('[Auth] Firebase session expired but AsyncStorage has data - need to re-login');
          // Clear stale data and redirect to login
          dispatch(logout());
          await ReactNativeAsyncStorage.removeItem('userData');
        }
        setAuthLoaded(true);
      } else {
        // Firebase user exists, check if we have saved data
        console.log('[Auth] Firebase authenticated, loading user data');
        checkAuthStatus();
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. This is the "gatekeeper" effect, now safer
  useEffect(() => {
    if (!authLoaded) return; // Don't run this logic until we've checked storage

    const inAppGroup = segments[0] === '(tabs)' || segments[0] === '(screens)';

    if (!isAuthenticated && inAppGroup) {
      router.replace('/login');
    } else if (isAuthenticated && user) {
      // Check if student is not approved
      if (user.role === 'student' && !user.isApproved) {
        router.replace('/pending-approval' as any);
      } 
      // Check if profile is not complete
      else if (!user.isProfileComplete) {
        router.replace('/(screens)/edit-profile');
      } 
      // Route to appropriate dashboard based on role
      else if (user.isProfileComplete && !inAppGroup) {
        if (user.role === 'driver') {
          router.replace('/(screens)/driver' as any);
        } else if (user.role === 'admin') {
          router.replace('/(screens)/admin' as any);
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, segments, authLoaded]);

  // Don't render anything until we have loaded the auth state from storage
  if (!authLoaded) {
    return null;
  }

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ animation: 'fade' }} />
        <Stack.Screen name="pending-approval" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }}/>
        <Stack.Screen 
          name="(screens)/edit-profile" 
          options={{ animation: 'slide_from_right', presentation: 'transparentModal' }} 
        />
        <Stack.Screen 
          name="(screens)/driver" 
          options={{ animation: 'fade' }} 
        />
        <Stack.Screen 
          name="(screens)/admin" 
          options={{ animation: 'fade' }} 
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
    if ((fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
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