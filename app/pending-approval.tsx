import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { logout, updateUser } from '../store/slices/authSlice';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function PendingApprovalScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Listen for approval status changes in real-time
  useEffect(() => {
    // Only set up listener if user is authenticated
    if (!user || !auth.currentUser?.uid) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', auth.currentUser.uid);

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.isApproved === true) {
          // Student has been approved!
          dispatch(updateUser({ isApproved: true }));
          router.replace('/(tabs)/dashboard');
        }
      }
    }, (error) => {
      console.error('Error listening to approval status:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkApprovalStatus = async () => {
    if (!auth.currentUser?.uid) {
      console.error('No authenticated user');
      return;
    }

    setIsCheckingStatus(true);
    const db = getFirestore();
    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    try {
      const { getDoc } = await import('firebase/firestore');
      const snapshot = await getDoc(userRef);
      if (snapshot.exists() && snapshot.data()?.isApproved) {
        dispatch(updateUser({ isApproved: true }));
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={100} 
            color="#FFA500" 
          />
        </View>

        <Text style={styles.title}>Approval Pending</Text>
        
        <Text style={styles.description}>
          Your registration has been submitted successfully! 
        </Text>
        
        <Text style={styles.subDescription}>
          A driver or admin will review your request shortly. 
          You'll be notified once your account is approved.
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={24} 
            color="#007AFF" 
          />
          <Text style={styles.infoText}>
            Please check back later or wait for approval notification
          </Text>
        </View>

        <Button
          mode="outlined"
          onPress={checkApprovalStatus}
          loading={isCheckingStatus}
          disabled={isCheckingStatus}
          style={styles.checkButton}
          labelStyle={styles.checkButtonLabel}
        >
          Check Status
        </Button>

        <Button
          mode="text"
          onPress={handleLogout}
          labelStyle={styles.logoutButtonLabel}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  subDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#007AFF',
    marginLeft: 12,
    flex: 1,
  },
  checkButton: {
    marginTop: 16,
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 12,
    width: '80%',
  },
  checkButtonLabel: {
    color: '#007AFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 24,
  },
  logoutButtonLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
