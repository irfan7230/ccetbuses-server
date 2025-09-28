import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login'); // Use replace to prevent going back to the profile
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            {user?.profileImageUri ? (
              <Avatar.Image 
                size={80} 
                source={{ uri: user.profileImageUri }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
            )}
            <Text variant="headlineMedium" style={styles.userName}>
              {user?.fullName || 'Sundhara User'}
            </Text>
            <Text variant="bodyLarge" style={styles.userEmail}>
              {user?.email || 'user@email.com'}
            </Text>
          </View>

          {/* Menu List Section */}
          <View style={styles.menuSection}>
            <List.Item
              title="My Bus Stop"
              description={user?.busStop ? user.busStop.charAt(0).toUpperCase() + user.busStop.slice(1) : 'Not set'}
              left={props => <List.Icon {...props} icon="bus-stop" />}
            />
            <Divider />
            <List.Item
              title="Edit Profile"
              left={props => <List.Icon {...props} icon="account-edit-outline" />}
              onPress={() => router.push('/(screens)/edit-profile')}
            />
            <Divider />
            <List.Item
              title="Settings"
              left={props => <List.Icon {...props} icon="cog-outline" />}
              onPress={() => router.push('/(screens)/settings')}
            />
            <Divider />
            <List.Item
              title="Help & Support"
              left={props => <List.Icon {...props} icon="help-circle-outline" />}
              onPress={() => router.push('/(screens)/help')}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              left={props => <List.Icon {...props} icon="shield-lock-outline" />}
              onPress={() => router.push('/(screens)/privacy')}
            />
          </View>

          {/* Logout Button */}
          <Button 
            mode="contained" 
            onPress={handleLogout} 
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonText}
          >
            Logout
          </Button>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    marginBottom: 16,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  menuSection: {
    marginTop: 30,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});