import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { Text, Avatar, IconButton, TextInput, FAB, useTheme, Card } from 'react-native-paper';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { busRouteCoordinates } from '../../constants/routeData';
import polyline from '@mapbox/polyline';
import socketService from '../../services/socket';
import { updateLocation } from '../../store/slices/locationSlice';
import type { LocationUpdate } from '../../services/socket';

export default function DashboardScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const busLocation = useSelector((state: RootState) => state.location.currentLocation);
  const isTripActive = useSelector((state: RootState) => state.location.isTripActive);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [roadRoute, setRoadRoute] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);

  const dispatch = useDispatch();
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

  // Fetch the route when the component first loads
  useEffect(() => {
    fetchRoadRoute();
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user?.bus) return;

    const initSocket = async () => {
      try {
        await socketService.connect(
          user.email || '',
          'student',
          user.bus || ''
        );
        setIsConnected(true);

        // Listen for bus location updates
        socketService.on('bus_location', (location: LocationUpdate) => {
          dispatch(updateLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp,
            accuracy: location.accuracy,
            speed: location.speed,
            heading: location.heading,
          }));

          // Animate map to new location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 1000);
          }
        });

        // Listen for trip events
        socketService.on('trip_started', (data: any) => {
          Alert.alert('Trip Started', 'Your bus has started the trip. Track it in real-time!');
        });

        socketService.on('trip_ended', (data: any) => {
          Alert.alert('Trip Ended', 'Your bus has reached the destination.');
        });
      } catch (error) {
        console.error('Failed to connect to socket:', error);
      }
    };

    initSocket();

    return () => {
      socketService.disconnect();
    };
  }, [user?.bus, user?.email, dispatch]);

  const initialRegion = {
    latitude: 10.85, 
    longitude: 78.0,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6,
  };

  // Real-time search filter using useMemo for performance
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return busRouteCoordinates
      .map((stop, index) => ({
        ...stop,
        stopNumber: index + 1,
        name: `Stop ${index + 1}`, // You can enhance this with actual stop names from your data
      }))
      .filter((stop) => 
        stop.name.toLowerCase().includes(query) ||
        stop.stopNumber.toString().includes(query)
      );
  }, [searchQuery]);

  const handleSearch = (stop: typeof busRouteCoordinates[0] & { stopNumber: number }) => {
    // Animate map to selected stop
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: stop.latitude,
        longitude: stop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
    
    // Close search
    setSearchQuery('');
    setIsSearchVisible(false);
    
    Alert.alert(
      `Stop ${stop.stopNumber}`,
      `Location: ${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}`
    );
  };

  const renderHeader = () => (
    <Animatable.View animation="fadeInDown" duration={300}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <View style={styles.userInfo}>
          {user?.profileImageUri ? (
            <Avatar.Image 
              size={48} 
              source={{ uri: user.profileImageUri }} 
              style={styles.avatar} 
            />
          ) : (
            <Avatar.Image 
              size={48} 
              source={require('../../assets/images/avatar.png')} 
              style={styles.avatar} 
            />
          )}
          <View>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Student'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.statusText}>
                {isTripActive ? 'Bus in Transit' : 'No Active Trip'}
              </Text>
            </View>
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
    <Animatable.View animation="fadeInDown" duration={300} style={styles.searchContainer}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          iconColor="#FFFFFF" 
          size={24} 
          onPress={() => {
            setIsSearchVisible(false);
            setSearchQuery('');
          }} 
        />
        <TextInput
          placeholder="Search for a bus stop..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          dense
          autoFocus
          textColor="#FFFFFF"
          right={
            searchQuery ? (
              <TextInput.Icon 
                icon="close" 
                onPress={() => setSearchQuery('')}
                color="rgba(255, 255, 255, 0.7)"
              />
            ) : undefined
          }
        />
      </BlurView>
      
      {/* Real-time Search Results */}
      {searchQuery.trim() && (
        <Animatable.View animation="fadeIn" duration={200} style={styles.searchResults}>
          <BlurView intensity={80} tint="dark" style={styles.resultsContainer}>
            <ScrollView 
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {searchResults.length > 0 ? (
                searchResults.map((stop, index) => (
                  <Animatable.View 
                    key={`result-${index}`} 
                    animation="fadeInUp" 
                    delay={index * 50}
                  >
                    <Card 
                      style={styles.resultCard}
                      onPress={() => handleSearch(stop)}
                    >
                      <Card.Content style={styles.resultContent}>
                        <View style={styles.resultIcon}>
                          <Text style={styles.resultNumber}>{stop.stopNumber}</Text>
                        </View>
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultTitle}>{stop.name}</Text>
                          <Text style={styles.resultCoords}>
                            📍 {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                          </Text>
                        </View>
                        <IconButton 
                          icon="chevron-right" 
                          iconColor="rgba(255, 255, 255, 0.5)" 
                          size={20}
                        />
                      </Card.Content>
                    </Card>
                  </Animatable.View>
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>🔍 No bus stops found</Text>
                  <Text style={styles.noResultsHint}>Try searching by stop number</Text>
                </View>
              )}
            </ScrollView>
          </BlurView>
        </Animatable.View>
      )}
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
        
        {/* Bus Stop Markers */}
        {busRouteCoordinates.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={stop}
            title={`Stop ${index + 1}`}
            description={`Bus Stop`}
          >
            <View style={styles.stopMarker}>
              <View style={styles.stopIcon}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
        
        {busLocation ? (
          <Marker
            ref={markerRef}
            coordinate={{
              latitude: busLocation.latitude,
              longitude: busLocation.longitude,
            }}
            title="Sundhara Travels Bus"
            description={isTripActive ? 'In Transit' : 'Parked'}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.busMarker}>
              <View style={[styles.busIcon, { backgroundColor: isTripActive ? theme.colors.primary : '#888' }]}>
                <IconButton icon="bus" iconColor="#FFF" size={20} />
              </View>
            </View>
          </Marker>
        ) : (
          <Marker
            coordinate={busRouteCoordinates[0]}
            title="Sundhara Travels Bus"
            description="Last Known Location"
          />
        )}
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
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
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
  busMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  busIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
  },
  stopMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  stopNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'Inter_700Bold',
  },
  searchContainer: {
    position: 'relative',
  },
  searchResults: {
    margin: 16,
    marginTop: 8,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    padding: 12,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    borderRadius: 12,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  resultCoords: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter_400Regular',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter_400Regular',
  },
});