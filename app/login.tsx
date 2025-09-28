import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { Logo } from '../components/auth/Logo';
import { EnhancedInput } from '../components/auth/EnhancedInput';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';

const loginSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogin = async () => {
    const formData = { email, password };
    setIsLoading(true); // Start loading
    try {
      setErrors({});
      await loginSchema.validate(formData, { abortEarly: false });

      dispatch(login({
        fullName: 'John Doe', // This would come from your API
        email: formData.email,
        bus: 'bus_a_01',
      }));
      console.log('User logged in!');

      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false); // Stop loading
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