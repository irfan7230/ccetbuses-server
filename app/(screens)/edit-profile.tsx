import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Appbar, Avatar, HelperText, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../store/store';
import { EnhancedInput } from '../../components/auth/EnhancedInput';
import { updateUser } from '../../store/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from "react-native-paper-dropdown";
import * as yup from 'yup';
import { auth } from '../../config/firebase';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import apiService from '../../services/api';

const editProfileSchema = yup.object().shape({
  fullName: yup.string().required('Full Name is required'),
  busStop: yup.string().required('Please select your bus stop'),
});

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>(); 
  const user = useSelector((state: RootState) => state.auth.user);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email] = useState(user?.email || '');
  const [profileImageUri, setProfileImageUri] = useState(user?.profileImageUri);
  const [busStop, setBusStop] = useState(user?.busStop || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const busStopList = [
    { label: "Mallapuram Stop", value: "mallapuram" },
    { label: "Pallapatti Stop", value: "pallapatti" },
    { label: "Aravakurichi Stop", value: "aravakurichi" },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', "You need to allow access to your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setUploadingImage(true);
      
      try {
        // Upload image to backend (Cloudinary)
        const uploadResult = await apiService.uploadProfileImage(selectedImageUri);
        
        if (uploadResult.data.url) {
          setProfileImageUri(uploadResult.data.url);
          Alert.alert('Success', 'Profile image uploaded successfully!');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    const formData = { fullName, busStop };
    try {
      setErrors({});
      setLoading(true);
      
      await editProfileSchema.validate(formData, { abortEarly: false });
      
      if (auth.currentUser) {
        const db = getFirestore();
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        
        const updateData: any = {
          fullName: fullName,
          busStop: busStop,
          isProfileComplete: true,
          updatedAt: new Date(),
        };
        
        // Only update profileImageUri if it exists
        if (profileImageUri) {
          updateData.profileImageUri = profileImageUri;
        }
        
        await updateDoc(userDocRef, updateData);
        
        // Also update via backend API
        try {
          await apiService.updateProfile({
            fullName,
            busStop,
            profileImageUri,
          });
        } catch (apiError) {
          console.warn('Backend update failed:', apiError);
        }
      }

      // Dispatch to Redux to update local state
      dispatch(updateUser({ fullName, profileImageUri, busStop }));

      Alert.alert('Success', 'Profile updated successfully!');

      if (user?.isProfileComplete) {
        router.back();
      } else {
        router.replace('/dashboard');
      }

    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach(err => {
          if (err.path) newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        {user?.isProfileComplete && <Appbar.BackAction onPress={() => router.back()} />}
        <Appbar.Content 
          title={user?.isProfileComplete ? "Edit Profile" : "Complete Your Profile"} 
          titleStyle={styles.title} 
        />
        <Button onPress={handleSave} loading={loading} disabled={loading || uploadingImage}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarContainer}>
          {uploadingImage ? (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', width: 100, height: 100, borderRadius: 50 }]}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <Avatar.Image 
              size={100} 
              source={profileImageUri ? { uri: profileImageUri } : require('../../assets/images/avatar.png')} 
              style={styles.avatar} 
            />
          )}
          <Button mode="text" onPress={pickImage} disabled={uploadingImage}>
            {uploadingImage ? 'Uploading...' : 'Change Photo'}
          </Button>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <EnhancedInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            icon="account-outline"
            error={errors.fullName}
          />
          
          <Text style={styles.label}>Email Address</Text>
          <EnhancedInput
            label="Email Address"
            value={email}
            editable={false}
            keyboardType="email-address"
            icon="email-outline"
            right={
              <TextInput.Icon 
                icon="check-decagram" 
                color="#4CAF50" // Green color for verified
              />
            }
          />

          <Text style={styles.label}>Bus Stop</Text>
          <View style={{marginBottom: 20}}>
            <Dropdown
              label="Select Your Bus Stop"
              mode="outlined"
              placeholder="Select Your Bus Stop"
              options={busStopList}
              value={busStop}
              onSelect={(value?: string) => setBusStop(value || '')}
              error={!!errors.busStop}
            />
            {!!errors.busStop && <HelperText type='error' visible={true}>{errors.busStop}</HelperText>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  appbar: {
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontFamily: 'Inter_700Bold',
  },
  container: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    backgroundColor: '#333',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    marginLeft: 8,
  },
});