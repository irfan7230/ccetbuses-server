import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, HelperText } from 'react-native-paper';
import { Logo } from '../components/auth/Logo';
import { EnhancedInput } from '../components/auth/EnhancedInput';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Dropdown } from "react-native-paper-dropdown";
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { login } from '../store/slices/authSlice';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const signUpSchema = yup.object().shape({
  fullName: yup.string().required('Full Name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  selectedBus: yup.string().required('Please select your bus'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  const busList = [
    { label: "Bus A - Route 1", value: "bus-1" },
  ];

  const handleBusSelection = (value: string | undefined) => {
    setSelectedBus(value || '');
  };

  const handleSignUp = async () => {
    const formData = { fullName, email, selectedBus, password, confirmPassword };
    setIsLoading(true);
    setErrors({});
    try {
      await signUpSchema.validate(formData, { abortEarly: false });
      
      // --- Firebase User Creation ---
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Add their full name to their Firebase profile
      await updateProfile(firebaseUser, { displayName: fullName });
      
      console.log('Firebase user created:', firebaseUser.uid);

      // --- Create User Profile in Firestore ---
      const db = getFirestore();
      // Create a new document in the 'users' collection with the user's ID
      await setDoc(doc(db, "users", firebaseUser.uid), {
        fullName: fullName,
        email: email,
        role: 'student',
        bus: selectedBus,
        busStop: null,
        isProfileComplete: false, // Set to false for new users
        isApproved: false, // Student needs approval from driver or admin
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // --- Create Approval Request ---
      const approvalRequestRef = doc(db, 'approvalRequests', `${firebaseUser.uid}_${Date.now()}`);
      await setDoc(approvalRequestRef, {
        id: approvalRequestRef.id,
        studentId: firebaseUser.uid,
        studentName: fullName,
        studentEmail: email,
        busId: selectedBus,
        busName: busList.find(b => b.value === selectedBus)?.label || selectedBus,
        requestedAt: new Date(),
        status: 'pending',
      });

      // --- Dispatch to Redux to update app state ---
      dispatch(login({
        fullName: fullName,
        email: email,
        bus: selectedBus,
        role: 'student',
        isProfileComplete: false, // New users must complete their profile
        isApproved: false, // Waiting for approval
      }));

      // The gatekeeper in _layout.tsx will automatically navigate the user.

    } catch (error: any) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      } else if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email address is already in use.' });
      } else {
        console.error("Firebase SignUp Error:", error);
        Alert.alert('Sign Up Failed', 'An unexpected error occurred. Please try again.');
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
          <View style={styles.formContainer}>
            <EnhancedInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              icon="account-outline"
              error={errors.fullName}
              // disabled={isLoading}
            />
            <EnhancedInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="email-outline"
              error={errors.email}
              //disabled={isLoading}
            />
            <View style={styles.dropdownContainer}>
              <Dropdown
                label={"Select Your Bus"}
                mode={"outlined"}
                value={selectedBus}
                onSelect={handleBusSelection}
                options={busList}
                disabled={isLoading}
              />
               {!!errors.selectedBus && <HelperText type='error' visible={true} style={styles.helperText}>{errors.selectedBus}</HelperText>}
            </View>
            <EnhancedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              icon="lock-outline"
              error={errors.password}
              //disabled={isLoading}
            />
            <EnhancedInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              icon="lock-check-outline"
              error={errors.confirmPassword}
              //disabled={isLoading}
            />
            
            <TouchableOpacity onPress={handleSignUp} activeOpacity={0.8} style={{marginTop: 16}} disabled={isLoading}>
              <LinearGradient
                colors={['#007AFF', '#0099FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isLoading && { opacity: 0.6 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/login" asChild>
                <Button mode="text" labelStyle={styles.signInText} disabled={isLoading}>Sign In</Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  dropdownContainer: { marginBottom: 8, },
  helperText: { fontFamily: 'Inter_400Regular', paddingLeft: 8, },
  button: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#007AFF', shadowRadius: 10, shadowOpacity: 0.3 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' },
  signInText: { color: '#007AFF', fontFamily: 'Inter_700Bold', fontSize: 14, textTransform: 'uppercase' },
});