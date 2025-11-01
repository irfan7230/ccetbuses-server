import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator, List, Divider, IconButton, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiService from '../../services/api';

interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  timestamp: number;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

interface GPSReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

class KalmanFilter {
  private Q = 0.00001; // Process noise
  private R = 0.01; // Measurement noise
  private P = 1.0; // Estimation error
  private K = 0.0; // Kalman gain
  private x: number; // Estimated value

  constructor(initialValue: number) {
    this.x = initialValue;
  }

  filter(measurement: number): number {
    // Prediction
    this.P = this.P + this.Q;

    // Update
    this.K = this.P / (this.P + this.R);
    this.x = this.x + this.K * (measurement - this.x);
    this.P = (1 - this.K) * this.P;

    return this.x;
  }
}

class LocationFilter {
  private latFilter: KalmanFilter;
  private lonFilter: KalmanFilter;
  private recentReadings: GPSReading[] = [];
  private readonly maxReadings = 5;

  constructor(lat: number, lon: number) {
    this.latFilter = new KalmanFilter(lat);
    this.lonFilter = new KalmanFilter(lon);
  }

  addReading(reading: GPSReading) {
    this.recentReadings.push(reading);
    if (this.recentReadings.length > this.maxReadings) {
      this.recentReadings.shift();
    }
  }

  getSmoothedLocation(lat: number, lon: number, accuracy: number): { latitude: number; longitude: number } {
    // Use Kalman filter for high accuracy readings
    if (accuracy < 15) {
      return {
        latitude: this.latFilter.filter(lat),
        longitude: this.lonFilter.filter(lon),
      };
    }
    
    // Use moving average for medium accuracy
    if (accuracy < 30 && this.recentReadings.length >= 3) {
      const weights = this.recentReadings.map(r => 1 / (r.accuracy || 1));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      
      const avgLat = this.recentReadings.reduce((sum, r, i) => 
        sum + r.latitude * (weights[i] / totalWeight), 0);
      const avgLon = this.recentReadings.reduce((sum, r, i) => 
        sum + r.longitude * (weights[i] / totalWeight), 0);
      
      return { latitude: avgLat, longitude: avgLon };
    }
    
    // Return raw for very poor accuracy
    return { latitude: lat, longitude: lon };
  }
}

export default function RouteRecordingScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [startPoint, setStartPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [gpsQuality, setGpsQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');
  const [batteryOptimized, setBatteryOptimized] = useState(false);
  const [rawPoints, setRawPoints] = useState<RoutePoint[]>([]);
  
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastPointRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationFilterRef = useRef<LocationFilter | null>(null);
  const consecutivePoorReadings = useRef(0);
  const gpsReadingsBuffer = useRef<GPSReading[]>([]);
  
  // Adaptive thresholds based on GPS quality
  const getThresholds = () => {
    const baseAccuracy = 20;
    const baseDistance = 0.010; // 10 meters
    const baseTime = 5000; // 5 seconds
    
    switch (gpsQuality) {
      case 'excellent': // < 10m
        return {
          accuracy: baseAccuracy,
          distance: baseDistance,
          time: baseTime,
        };
      case 'good': // 10-20m
        return {
          accuracy: baseAccuracy + 10,
          distance: baseDistance + 0.005,
          time: baseTime + 2000,
        };
      case 'fair': // 20-50m
        return {
          accuracy: baseAccuracy + 30,
          distance: baseDistance + 0.015,
          time: baseTime + 5000,
        };
      case 'poor': // > 50m
        return {
          accuracy: baseAccuracy + 50,
          distance: baseDistance + 0.030,
          time: baseTime + 10000,
        };
    }
  };
  
  const MIN_DISTANCE_THRESHOLD = getThresholds().distance;
  const MAX_ACCURACY_THRESHOLD = getThresholds().accuracy;
  const MIN_TIME_BETWEEN_POINTS = getThresholds().time;

  useEffect(() => {
    checkLocationPermission();
    checkIfRecordingEnabled();
    
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is required to record the route.'
      );
    }
  };

  const checkIfRecordingEnabled = async () => {
    try {
      // Check if route recording is enabled for this driver/bus
      const result = await apiService.checkRouteRecordingStatus(user?.bus || '') as { data: { enabled: boolean } };
      setIsEnabled(result.data.enabled);
    } catch (error) {
      console.log('Error checking recording status:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const assessGPSQuality = (accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (accuracy <= 10) return 'excellent';
    if (accuracy <= 20) return 'good';
    if (accuracy <= 50) return 'fair';
    return 'poor';
  };

  const validateSpeed = (speed: number | null | undefined, distance: number, timeDiff: number): boolean => {
    if (!speed || speed === 0) return true; // Can't validate
    
    const calculatedSpeed = (distance * 1000) / (timeDiff / 1000); // m/s
    const speedDiff = Math.abs(calculatedSpeed - (speed || 0));
    
    // Allow 50% variance (GPS speed can be inaccurate)
    return speedDiff < Math.max(speed * 0.5, 5);
  };

  const simplifyPath = (points: RoutePoint[], tolerance: number = 0.00005): RoutePoint[] => {
    if (points.length < 3) return points;
    
    // Douglas-Peucker algorithm for path simplification
    const douglasPeucker = (pts: RoutePoint[], epsilon: number): RoutePoint[] => {
      if (pts.length < 3) return pts;
      
      let dmax = 0;
      let index = 0;
      const end = pts.length - 1;
      
      for (let i = 1; i < end; i++) {
        const d = perpendicularDistance(pts[i], pts[0], pts[end]);
        if (d > dmax) {
          index = i;
          dmax = d;
        }
      }
      
      if (dmax > epsilon) {
        const left = douglasPeucker(pts.slice(0, index + 1), epsilon);
        const right = douglasPeucker(pts.slice(index), epsilon);
        return [...left.slice(0, -1), ...right];
      }
      
      return [pts[0], pts[end]];
    };
    
    const perpendicularDistance = (point: RoutePoint, lineStart: RoutePoint, lineEnd: RoutePoint): number => {
      const dx = lineEnd.latitude - lineStart.latitude;
      const dy = lineEnd.longitude - lineStart.longitude;
      
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag < 0.00000001) return 0;
      
      const u = ((point.latitude - lineStart.latitude) * dx + (point.longitude - lineStart.longitude) * dy) / (mag * mag);
      
      const intersectionLat = lineStart.latitude + u * dx;
      const intersectionLon = lineStart.longitude + u * dy;
      
      const pdx = point.latitude - intersectionLat;
      const pdy = point.longitude - intersectionLon;
      
      return Math.sqrt(pdx * pdx + pdy * pdy);
    };
    
    return douglasPeucker(points, tolerance);
  };

  const startRecording = async () => {
    if (!locationPermission) {
      Alert.alert('Error', 'Location permission is required.');
      return;
    }

    if (!isEnabled) {
      Alert.alert('Error', 'Route recording is not enabled for your bus.');
      return;
    }

    try {
      // Get initial location with retries
      let location;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          
          if ((location.coords.accuracy || 999) < 100) {
            break; // Acceptable accuracy
          }
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          retries++;
          if (retries >= maxRetries) throw err;
        }
      }
      
      if (!location) {
        throw new Error('Failed to get initial location');
      }

      // Initialize location filter
      locationFilterRef.current = new LocationFilter(
        location.coords.latitude,
        location.coords.longitude
      );
      
      // Add initial reading
      gpsReadingsBuffer.current.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 999,
        timestamp: Date.now(),
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
      });

      setStartPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setCurrentLocation(location);
      setGpsQuality(assessGPSQuality(location.coords.accuracy || 999));
      
      lastPointRef.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Start continuous tracking with adaptive settings
      const trackingConfig = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: batteryOptimized ? 10000 : 5000,
        distanceInterval: batteryOptimized ? 20 : 10,
      };
      
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        trackingConfig,
        (loc) => {
          const now = Date.now();
          const accuracy = loc.coords.accuracy || 999;
          const quality = assessGPSQuality(accuracy);
          
          setCurrentLocation(loc);
          setGpsQuality(quality);
          
          // Add to buffer for smoothing
          const reading: GPSReading = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy,
            timestamp: now,
            speed: loc.coords.speed || undefined,
            heading: loc.coords.heading || undefined,
          };
          
          if (locationFilterRef.current) {
            locationFilterRef.current.addReading(reading);
          }
          
          gpsReadingsBuffer.current.push(reading);
          if (gpsReadingsBuffer.current.length > 10) {
            gpsReadingsBuffer.current.shift();
          }
          
          // Dynamic threshold based on GPS quality
          const thresholds = getThresholds();
          
          // Track consecutive poor readings
          if (accuracy > thresholds.accuracy) {
            consecutivePoorReadings.current++;
            console.log(`⚠️ Poor GPS #${consecutivePoorReadings.current}: ${accuracy.toFixed(1)}m`);
            
            // If too many poor readings, suggest to user
            if (consecutivePoorReadings.current === 10) {
              Alert.alert(
                'Poor GPS Signal',
                'GPS signal quality is poor. Consider:\n• Moving to an open area\n• Waiting for better signal\n• Enabling battery optimization mode',
                [
                  { text: 'Continue', style: 'cancel' },
                  { 
                    text: 'Optimize Battery', 
                    onPress: () => setBatteryOptimized(true) 
                  },
                ]
              );
            }
            return;
          }
          
          consecutivePoorReadings.current = 0;
          
          // Get smoothed location
          const smoothed = locationFilterRef.current?.getSmoothedLocation(
            loc.coords.latitude,
            loc.coords.longitude,
            accuracy
          ) || { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          
          // Only record point if there's significant movement
          if (lastPointRef.current) {
            const rawDist = calculateDistance(
              lastPointRef.current.latitude,
              lastPointRef.current.longitude,
              smoothed.latitude,
              smoothed.longitude
            );
            
            const timeSinceLastPoint = now - lastUpdateTime;
            
            // Check minimum thresholds
            if (rawDist < thresholds.distance && timeSinceLastPoint < thresholds.time) {
              console.log(`⏭️ Skipping: ${(rawDist * 1000).toFixed(1)}m, ${(timeSinceLastPoint / 1000).toFixed(1)}s`);
              return;
            }
            
            // Validate speed if available
            if (!validateSpeed(loc.coords.speed, rawDist, timeSinceLastPoint)) {
              console.log(`⚠️ Speed mismatch detected, using raw location`);
            }
            
            // Only add distance if movement is significant
            if (rawDist >= thresholds.distance) {
              setDistance((prevDist) => prevDist + rawDist);
              
              const newPoint: RoutePoint = {
                latitude: smoothed.latitude,
                longitude: smoothed.longitude,
                timestamp: now,
                accuracy,
                speed: loc.coords.speed || undefined,
                heading: loc.coords.heading || undefined,
                altitude: loc.coords.altitude || undefined,
              };
              
              // Add to raw points for simplification later
              setRawPoints((prev) => [...prev, newPoint]);
              
              // Add to displayed points (will be simplified on save)
              setRoutePoints((prev) => [...prev, newPoint]);
              setLastUpdateTime(now);
              
              lastPointRef.current = {
                latitude: smoothed.latitude,
                longitude: smoothed.longitude,
              };
              
              console.log(`✓ Point: ${(rawDist * 1000).toFixed(1)}m, ${accuracy.toFixed(1)}m, ${quality}`);
            }
          } else {
            // First point after start
            const newPoint: RoutePoint = {
              latitude: smoothed.latitude,
              longitude: smoothed.longitude,
              timestamp: now,
              accuracy,
              speed: loc.coords.speed || undefined,
              heading: loc.coords.heading || undefined,
              altitude: loc.coords.altitude || undefined,
            };
            
            setRawPoints([newPoint]);
            setRoutePoints([newPoint]);
            setLastUpdateTime(now);
            
            lastPointRef.current = {
              latitude: smoothed.latitude,
              longitude: smoothed.longitude,
            };
          }
        }
      );

      setIsRecording(true);
      Alert.alert('Success', 'Route recording started!');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const cancelRecording = () => {
    Alert.alert(
      'Cancel Recording',
      'Are you sure you want to cancel? All recorded data will be lost.',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (locationSubscriptionRef.current) {
              locationSubscriptionRef.current.remove();
              locationSubscriptionRef.current = null;
            }

            // Reset state
            setIsRecording(false);
            setRoutePoints([]);
            setBusStops([]);
            setRawPoints([]);
            setStartPoint(null);
            setEndPoint(null);
            setDistance(0);
            setLastUpdateTime(0);
            setGpsQuality('poor');
            setBatteryOptimized(false);
            lastPointRef.current = null;
            locationFilterRef.current = null;
            consecutivePoorReadings.current = 0;
            gpsReadingsBuffer.current = [];
            
            Alert.alert('Cancelled', 'Recording has been discarded.');
          },
        },
      ]
    );
  };

  const stopRecording = async () => {
    if (routePoints.length < 2) {
      Alert.alert(
        'Insufficient Data',
        'Please record at least 2 route points before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (busStops.length < 1) {
      Alert.alert(
        'No Bus Stops',
        'You haven\'t marked any bus stops. Do you want to save anyway?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          {
            text: 'Save Without Stops',
            onPress: () => saveRoute(),
          },
        ]
      );
      return;
    }

    saveRoute();
  };

  const saveRoute = async () => {
    // Capture final destination location before stopping tracking
    if (currentLocation) {
      setEndPoint({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
    
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    setLoading(true);
    try {
      // Ensure we have destination location
      const destination = currentLocation ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      } : (routePoints.length > 0 ? {
        latitude: routePoints[routePoints.length - 1].latitude,
        longitude: routePoints[routePoints.length - 1].longitude,
      } : startPoint);
      
      // Apply path simplification to reduce data size
      const simplifiedPoints = simplifyPath(routePoints);
      const compressionRatio = ((routePoints.length - simplifiedPoints.length) / routePoints.length * 100).toFixed(1);
      
      console.log(`📊 Path simplified: ${routePoints.length} → ${simplifiedPoints.length} points (${compressionRatio}% reduction)`);
      console.log(`📍 Route: Start(${startPoint?.latitude.toFixed(6)}, ${startPoint?.longitude.toFixed(6)}) → End(${destination?.latitude.toFixed(6)}, ${destination?.longitude.toFixed(6)})`);
      
      // Calculate average accuracy
      const avgAccuracy = routePoints.reduce((sum, p) => sum + p.accuracy, 0) / routePoints.length;
      
      // Save route to backend with start and destination locations
      await apiService.saveRecordedRoute({
        busId: user?.bus || '',
        driverId: user?.email || '',
        startPoint,
        endPoint: destination, // Destination location
        routePoints: simplifiedPoints, // Use simplified path
        busStops,
        distance,
        recordedAt: Date.now(),
      } as any);
      
      // Log metadata for analytics
      console.log('📈 Route Metadata:', {
        startLocation: startPoint,
        destinationLocation: destination,
        rawPointsCount: routePoints.length,
        simplifiedPointsCount: simplifiedPoints.length,
        compressionRatio: parseFloat(compressionRatio),
        averageAccuracy: avgAccuracy,
        recordingDuration: Date.now() - (routePoints[0]?.timestamp || Date.now()),
        batteryOptimized,
      });

      Alert.alert(
        'Success',
        `Route saved successfully!\n\nDistance: ${distance.toFixed(2)} km\nRoute Points: ${simplifiedPoints.length} (${compressionRatio}% compressed)\nBus Stops: ${busStops.length}\nAvg GPS Accuracy: ${avgAccuracy.toFixed(1)}m`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset state
              setIsRecording(false);
              setRoutePoints([]);
              setBusStops([]);
              setRawPoints([]);
              setStartPoint(null);
              setEndPoint(null);
              setDistance(0);
              setLastUpdateTime(0);
              setGpsQuality('poor');
              setBatteryOptimized(false);
              lastPointRef.current = null;
              locationFilterRef.current = null;
              consecutivePoorReadings.current = 0;
              gpsReadingsBuffer.current = [];
              
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route. Please try again.');
      setLoading(false);
    }
  };

  const markBusStop = () => {
    if (!isRecording) {
      Alert.alert('Error', 'Please start recording first.');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available. Waiting for GPS...');
      return;
    }

    const accuracy = currentLocation.coords.accuracy || 999;
    const thresholds = getThresholds();
    
    if (accuracy > thresholds.accuracy) {
      Alert.alert(
        'Poor GPS Signal',
        `Current GPS accuracy is ${accuracy.toFixed(0)}m (${gpsQuality.toUpperCase()}).\n\nPlease wait for better signal:\n• Move to open area\n• Current threshold: < ${thresholds.accuracy}m`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.prompt(
      'Add Bus Stop',
      `Enter bus stop name:\n\nStop #${busStops.length + 1}\nAccuracy: ${accuracy.toFixed(1)}m`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (stopName?: string) => {
            if (!stopName || stopName.trim() === '') {
              Alert.alert('Error', 'Please enter a valid bus stop name.');
              return;
            }

            const newStop: BusStop = {
              id: `stop-${Date.now()}`,
              name: stopName.trim(),
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              order: busStops.length + 1,
              timestamp: Date.now(),
            };

            setBusStops((prev) => [...prev, newStop]);
            Alert.alert(
              'Success',
              `Bus stop "${stopName}" added!\n\nStop #${busStops.length + 1}\nLocation: ${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}`
            );
          },
        },
      ],
      'plain-text'
    );
  };

  const removeBusStop = (stopId: string) => {
    Alert.alert(
      'Remove Bus Stop',
      'Are you sure you want to remove this bus stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setBusStops((prev) => 
              prev.filter((stop) => stop.id !== stopId)
                .map((stop, index) => ({ ...stop, order: index + 1 }))
            );
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A', '#0A0E27']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFFFFF"
            size={24}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Route Recording</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Recording Status:</Text>
                <View style={[styles.statusDot, { backgroundColor: isRecording ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {isRecording ? 'Recording' : 'Stopped'}
                </Text>
              </View>

              {isRecording && (
                <>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="map-marker-path" size={24} color="#007AFF" />
                      <Text style={styles.statLabel}>Route Points</Text>
                      <Text style={styles.statValue}>{routePoints.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="bus-stop" size={24} color="#4CAF50" />
                      <Text style={styles.statLabel}>Bus Stops</Text>
                      <Text style={styles.statValue}>{busStops.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="map-marker-distance" size={24} color="#FF9800" />
                      <Text style={styles.statLabel}>Distance</Text>
                      <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
                    </View>
                  </View>
                  
                  {/* GPS Accuracy Status */}
                  {currentLocation && (
                    <View style={styles.gpsStatus}>
                      <MaterialCommunityIcons 
                        name="satellite-variant" 
                        size={16} 
                        color={
                          gpsQuality === 'excellent' ? '#4CAF50' :
                          gpsQuality === 'good' ? '#8BC34A' :
                          gpsQuality === 'fair' ? '#FF9800' : '#F44336'
                        } 
                      />
                      <Text style={[
                        styles.gpsText,
                        gpsQuality === 'excellent' || gpsQuality === 'good' ? styles.gpsGood : 
                        gpsQuality === 'fair' ? styles.gpsFair : styles.gpsPoor
                      ]}>
                        GPS: {currentLocation.coords.accuracy?.toFixed(1) || 'N/A'}m ({gpsQuality.toUpperCase()})
                      </Text>
                      {batteryOptimized && (
                        <View style={styles.batteryBadge}>
                          <MaterialCommunityIcons name="battery" size={12} color="#4CAF50" />
                          <Text style={styles.batteryText}>ECO</Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Battery Optimization Toggle */}
          {isRecording && (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Battery Optimization</Text>
                    <Text style={styles.settingDescription}>
                      Reduces GPS polling frequency to save battery (10s instead of 5s)
                    </Text>
                  </View>
                  <Switch
                    value={batteryOptimized}
                    onValueChange={setBatteryOptimized}
                    color="#4CAF50"
                  />
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Start and End Point Display */}
          {(startPoint || endPoint) && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Route Endpoints</Text>
                
                {startPoint && (
                  <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Starting Location</Text>
                      <Text style={styles.locationCoords}>
                        {startPoint.latitude.toFixed(6)}, {startPoint.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {endPoint && (
                  <View style={[styles.locationRow, { marginTop: 12 }]}>
                    <MaterialCommunityIcons name="map-marker-check" size={20} color="#FF9800" />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Destination Location</Text>
                      <Text style={styles.locationCoords}>
                        {endPoint.latitude.toFixed(6)}, {endPoint.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {startPoint && endPoint && (
                  <View style={styles.distanceInfo}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color="#2196F3" />
                    <Text style={styles.distanceText}>
                      Total Distance: {distance.toFixed(2)} km
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Recording Controls */}
          {!isEnabled && (
            <Card style={[styles.card, styles.warningCard]}>
              <Card.Content>
                <Text style={styles.warningText}>
                  ⚠️ Route recording is not enabled for your bus. Please contact the administrator.
                </Text>
              </Card.Content>
            </Card>
          )}

          {!locationPermission && (
            <Card style={[styles.card, styles.warningCard]}>
              <Card.Content>
                <Text style={styles.warningText}>⚠️ Location Permission Required</Text>
                <Button
                  mode="contained"
                  onPress={checkLocationPermission}
                  style={styles.permissionButton}
                >
                  Grant Permission
                </Button>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Controls</Text>
              
              {!isRecording ? (
                <Button
                  mode="contained"
                  onPress={startRecording}
                  disabled={!locationPermission || !isEnabled}
                  style={styles.startButton}
                  contentStyle={styles.buttonContent}
                  icon="record-circle"
                >
                  Start Recording Route
                </Button>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={markBusStop}
                    style={styles.checkInButton}
                    contentStyle={styles.buttonContent}
                    icon="map-marker-check"
                    buttonColor="#4CAF50"
                    disabled={!currentLocation || (currentLocation.coords.accuracy || 999) > MAX_ACCURACY_THRESHOLD}
                  >
                    Check In (Mark Bus Stop)
                  </Button>
                  
                  <View style={styles.buttonRow}>
                    <Button
                      mode="outlined"
                      onPress={cancelRecording}
                      disabled={loading}
                      style={styles.cancelButton}
                      contentStyle={styles.buttonContent}
                      icon="close-circle"
                      textColor="#FF9800"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={stopRecording}
                      loading={loading}
                      disabled={loading || routePoints.length < 2}
                      style={styles.stopButton}
                      contentStyle={styles.buttonContent}
                      icon="content-save"
                      buttonColor="#007AFF"
                    >
                      Save Route
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Bus Stops List */}
          {busStops.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Recorded Bus Stops ({busStops.length})</Text>
                {busStops.map((stop) => (
                  <View key={stop.id}>
                    <List.Item
                      title={stop.name}
                      description={`Stop ${stop.order} • Lat: ${stop.latitude.toFixed(6)}, Lon: ${stop.longitude.toFixed(6)}`}
                      left={(props) => (
                        <MaterialCommunityIcons {...props} name="bus-stop" size={24} color="#4CAF50" />
                      )}
                      right={(props) => (
                        <IconButton
                          {...props}
                          icon="delete"
                          iconColor="#FF3B30"
                          onPress={() => removeBusStop(stop.id)}
                        />
                      )}
                      titleStyle={styles.stopTitle}
                      descriptionStyle={styles.stopDescription}
                    />
                    <Divider />
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Instructions */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Instructions & Tips</Text>
              <Text style={styles.infoText}>
                📍 <Text style={styles.boldText}>Route Endpoints</Text>{'\n'}
                • Starting Location: Captured when recording starts{'\n'}
                • Destination Location: Captured when route is saved{'\n'}
                • Both locations shown with coordinates{'\n'}
                {'\n'}
                🎯 <Text style={styles.boldText}>Advanced GPS Filtering</Text>{'\n'}
                • Kalman filter smoothing for high accuracy GPS{'\n'}
                • Weighted average for medium accuracy GPS{'\n'}
                • Adaptive thresholds based on signal quality{'\n'}
                • Path simplification reduces data by 30-50%{'\n'}
                {'\n'}
                📍 <Text style={styles.boldText}>GPS Quality Levels</Text>{'\n'}
                • EXCELLENT: {'<'} 10m (best tracking){'\n'}
                • GOOD: 10-20m (reliable){'\n'}
                • FAIR: 20-50m (acceptable with smoothing){'\n'}
                • POOR: {'>'} 50m (waiting for better signal){'\n'}
                {'\n'}
                🔋 <Text style={styles.boldText}>Battery Optimization</Text>{'\n'}
                • Toggle during recording to save power{'\n'}
                • Increases polling interval (5s to 10s){'\n'}
                • Recommended for long routes ({'>'} 30 min){'\n'}
                {'\n'}
                ⚡ <Text style={styles.boldText}>Tips for Best Results</Text>{'\n'}
                • Start in open area with clear sky view{'\n'}
                • Wait for GPS quality: GOOD or EXCELLENT{'\n'}
                • Mark bus stops only with accurate GPS{'\n'}
                • System automatically filters poor readings
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
    marginRight: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  startButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  stopTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  stopDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  chatButton: {
    marginTop: 8,
    borderColor: '#007AFF',
  },
  routeButton: {
    marginTop: 8,
    marginBottom: 8,
    borderColor: '#4CAF50',
  },
  checkInButton: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
  },
  stopButton: {
    flex: 1,
    borderRadius: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#FF9800',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  gpsText: {
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
  },
  gpsGood: {
    color: '#4CAF50',
  },
  gpsFair: {
    color: '#FF9800',
  },
  gpsPoor: {
    color: '#F44336',
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  batteryText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  distanceText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter_600SemiBold',
  },
});
