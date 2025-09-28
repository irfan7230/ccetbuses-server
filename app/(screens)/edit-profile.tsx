import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Appbar, Avatar, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../store/store';
import { EnhancedInput } from '../../components/auth/EnhancedInput';
import { updateUser } from '../../store/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from "react-native-paper-dropdown";
import * as yup from 'yup';

const editProfileSchema = yup.object().shape({
  fullName: yup.string().required('Full Name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  busStop: yup.string().required('Please select your bus stop'),
});

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>(); 
  const user = useSelector((state: RootState) => state.auth.user);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImageUri, setProfileImageUri] = useState(user?.profileImageUri);
  const [busStop, setBusStop] = useState(user?.busStop || '');
  const [showBusStopDropDown, setShowBusStopDropDown] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const busStopList = [
    { label: "Mallapuram Stop", value: "mallapuram" },
    { label: "Pallapatti Stop", value: "pallapatti" },
    { label: "Aravakurichi Stop", value: "aravakurichi" },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };


  const handleSave = async () => {
    const formData = { fullName, email, busStop };
    try {
      setErrors({}); // Clear previous errors
      await editProfileSchema.validate(formData, { abortEarly: false });
      
      // If validation succeeds, dispatch the update
      dispatch(updateUser({ fullName, email, profileImageUri, busStop }));
      router.replace('/dashboard'); 

    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { [key: string]: string } = {};
        error.inner.forEach(err => {
          if (err.path) newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      }
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
        <Button onPress={handleSave}>Save</Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarContainer}>
          <Avatar.Image 
            size={100} 
            source={profileImageUri ? { uri: profileImageUri } : require('../../assets/images/avatar.png')} 
            style={styles.avatar} 
          />
          <Button mode="text" onPress={pickImage}>Change Photo</Button>
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
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="email-outline"
            error={errors.email}
          />

          <Text style={styles.label}>Bus Stop</Text>
          <View style={{marginBottom: 20}}>
            <Dropdown
              label={"Select Your Bus Stop"}
              mode={"outlined"}
              value={busStop}
              onSelect={(value?: string) => setBusStop(value ?? '')}
              options={busStopList}
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