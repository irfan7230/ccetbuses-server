import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Avatar, IconButton, TextInput, FAB, useTheme } from 'react-native-paper';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { busRouteCoordinates } from '../../constants/routeData';
import polyline from '@mapbox/polyline'

export default function DashboardScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [roadRoute, setRoadRoute] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapView>(null);

  const router = useRouter();
  const theme = useTheme();

  const fetchRoadRoute = async () => {
    const coordsString = busRouteCoordinates.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `http://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=polyline`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const decoded = polyline.decode(data.routes[0].geometry).map(point => ({
          latitude: point[0],
          longitude: point[1],
        }));
        setRoadRoute(decoded);
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
    }
  };

  // 3. Fetch the route when the component first loads
  useEffect(() => {
    fetchRoadRoute();
  }, []);

  const initialRegion = {
    latitude: 10.85, 
    longitude: 78.0,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6,
  };

  const handleSearch = () => {
    // In a real app, you would use a geocoding API here
    // to get coordinates for the searchQuery and animate the map.
    console.log('Searching for:', searchQuery);
  };

  const renderHeader = () => (
    <Animatable.View animation="fadeInDown" duration={300}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Icon size={48} icon="account-circle" style={styles.avatar} />
          <View>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Student'}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <IconButton icon="magnify" iconColor="#FFFFFF" size={24} onPress={() => setIsSearchVisible(true)} />
          <IconButton icon="bell-outline" iconColor="#FFFFFF" size={24} onPress={() => router.push('/(screens)/notifications')} />
        </View>
      </BlurView>
    </Animatable.View>
  );

  const renderSearchBar = () => (
    <Animatable.View animation="fadeInDown" duration={300}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <IconButton icon="arrow-left" iconColor="#FFFFFF" size={24} onPress={() => setIsSearchVisible(false)} />
        <TextInput
          placeholder="Search for a bus stop..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
          dense
          autoFocus
        />
      </BlurView>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
          maximumZ={19}
        />
        {roadRoute.length > 0 && (
          <Polyline
            coordinates={roadRoute}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
          />
        )}
        <Marker
          coordinate={busRouteCoordinates[0]}
          title="Sundhara Travels Bus"
          description="Starting Location"
        />
      </MapView>

      <SafeAreaView style={styles.headerContainer}>
        {isSearchVisible ? renderSearchBar() : renderHeader()}
      </SafeAreaView>

      <FAB
        icon="chat"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/(screens)/chat')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    margin: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  welcomeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80, // Position it above the tab bar
  },
});