import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/navigation/CustomTabBar'; // Import our new component

export default function TabLayout() {
  return (
    <Tabs
      // This is the magic prop that replaces the default UI
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}