import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator, 
  Alert
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { Logo } from '../components/auth/Logo';
import { EnhancedInput } from '../components/auth/EnhancedInput';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { login } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';
// 1. Import Firestore functions
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const loginSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogin = async () => {
    const formData = { email, password };
    setIsLoading(true);
    setErrors({});
    try {
      await loginSchema.validate(formData, { abortEarly: false });

      // --- Firebase Sign-In ---
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // --- Fetch User Profile from Firestore ---
      const db = getFirestore();
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // --- Create user object with REAL data from Firestore ---
        const userToSave = {
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role || 'student',
          bus: userData.bus,
          busStop: userData.busStop,
          isProfileComplete: userData.isProfileComplete || false,
          isApproved: userData.isApproved !== undefined ? userData.isApproved : true, // Default true for backward compatibility
        };

        // Save to local storage for persistence
        await ReactNativeAsyncStorage.setItem('userData', JSON.stringify(userToSave));
        
        // Dispatch to Redux
        dispatch(login(userToSave));
      } else {
        // This is an edge case, but good to handle
        throw new Error("User data not found in database.");
      }

    } catch (error: any) {
       if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach((err) => {
          if (err.path) newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      } else {
        console.error("Firebase Login Error:", error);
        Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Logo />

          <Animatable.View 
            animation="fadeInUp" 
            duration={1000} 
            delay={300} 
            style={styles.formContainer}
          >
            <EnhancedInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="email-outline"
              error={errors.email}
              //disabled={isLoading}
            />
            <EnhancedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              icon="lock-outline"
              error={errors.password}
              //disabled={isLoading}
            />
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} disabled={isLoading}>
              <LinearGradient
                colors={['#007AFF', '#0099FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isLoading && styles.buttonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator animating={true} color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/signup" asChild>
                <Button mode="text" labelStyle={styles.signUpText} disabled={isLoading}>
                  Sign Up
                </Button>
              </Link>
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  button: { 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 5, 
    shadowColor: '#007AFF', 
    shadowRadius: 10, 
    shadowOpacity: 0.3 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#007AFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' },
  signUpText: { color: '#007AFF', fontFamily: 'Inter_700Bold', fontSize: 14, textTransform: 'uppercase' },
});