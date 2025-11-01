import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Switch, useTheme, ActivityIndicator, Badge, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import socketService from '../../services/socket';
import { setTripId, clearTripId, startTracking, stopTracking } from '../../store/slices/locationSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ApprovalRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  busName: string;
  requestedAt: any;
  status: 'pending' | 'approved' | 'rejected';
}

export default function DriverScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const tripId = useSelector((state: RootState) => state.location.tripId);
  const isTripActive = useSelector((state: RootState) => state.location.isTripActive);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    checkLocationPermission();
    
    // Listen to pending approval requests for driver's bus
    if (user?.bus) {
      const db = getFirestore();
      const requestsQuery = query(
        collection(db, 'approvalRequests'),
        where('busId', '==', user.bus),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ApprovalRequest[];
        setPendingRequests(requests);
      });

      return () => unsubscribe();
    }
  }, [user?.bus]);

  // Start location tracking when trip is active
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      if (isTripActive && locationPermission) {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location: any) => {
            const { latitude, longitude, speed, heading, accuracy } = location.coords;
            
            setCurrentSpeed(speed || 0);

            // Send location to server
            socketService.sendLocationUpdate({
              busId: user?.bus || '',
              driverId: user?.email || '',
              latitude,
              longitude,
              timestamp: Date.now(),
              accuracy,
              speed: speed || undefined,
              heading: heading || undefined,
              isActive: true,
            });
          }
        );
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTripActive, locationPermission, user]);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is required to track the bus.'
      );
    }
  };

  const handleStartTrip = async () => {
    if (!locationPermission) {
      Alert.alert('Error', 'Location permission is required to start a trip.');
      return;
    }

    if (!user?.bus || !user?.email) {
      Alert.alert('Error', 'User information is missing.');
      return;
    }

    setLoading(true);

    try {
      // Connect to socket if not connected
      if (!socketService.isConnected()) {
        await socketService.connect(user.email, 'driver', user.bus);
      }

      // Start the trip
      socketService.startTrip(user.bus, user.email);

      // Listen for trip started confirmation
      socketService.on('trip_started', (data: any) => {
        dispatch(setTripId(data.tripId));
        dispatch(startTracking());
        setIsTracking(true);
        Alert.alert('Success', 'Trip started successfully!');
      });

      setLoading(false);
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
      setLoading(false);
    }
  };

  const handleEndTrip = () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            try {
              if (tripId && user?.bus) {
                socketService.endTrip(tripId, user.bus);
                
                dispatch(clearTripId());
                dispatch(stopTracking());
                setIsTracking(false);
                setDistanceCovered(0);
                
                Alert.alert('Success', 'Trip ended successfully!');
              }
              
              setLoading(false);
            } catch (error) {
              console.error('Error ending trip:', error);
              Alert.alert('Error', 'Failed to end trip. Please try again.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleApproveStudent = async (request: ApprovalRequest) => {
    try {
      const db = getFirestore();
      
      // Update approval request
      await updateDoc(doc(db, 'approvalRequests', request.id), {
        status: 'approved',
        reviewedBy: auth.currentUser?.uid,
        reviewedByName: user?.fullName || 'Driver',
        reviewedAt: new Date(),
      });

      // Update student user document using studentId from the request
      await updateDoc(doc(db, 'users', request.studentId), {
        isApproved: true,
        updatedAt: new Date(),
      });

      Alert.alert('Success', `${request.studentName} has been approved!`);
    } catch (error) {
      console.error('Error approving student:', error);
      Alert.alert('Error', 'Failed to approve student. Please try again.');
    }
  };

  const handleRejectStudent = async (request: ApprovalRequest) => {
    Alert.alert(
      'Reject Student',
      `Are you sure you want to reject ${request.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await updateDoc(doc(db, 'approvalRequests', request.id), {
                status: 'rejected',
                reviewedBy: auth.currentUser?.uid,
                reviewedByName: user?.fullName || 'Driver',
                reviewedAt: new Date(),
                rejectionReason: 'Rejected by driver',
              });

              Alert.alert('Success', `${request.studentName} has been rejected.`);
            } catch (error) {
              console.error('Error rejecting student:', error);
              Alert.alert('Error', 'Failed to reject student. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              dispatch(logout());
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExitGroupChat = () => {
    Alert.alert(
      'Exit Group Chat',
      'This will close the group chat window.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0A0E27', '#1A1F3A', '#0A0E27']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.title}>Driver Control Panel</Text>
              <Text style={styles.subtitle}>Bus: {user?.bus || 'N/A'}</Text>
            </View>
            <IconButton
              icon="logout"
              iconColor="#FF3B30"
              size={24}
              onPress={handleLogout}
            />
          </View>

          {/* Status Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: isTripActive ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {isTripActive ? 'Trip Active' : 'No Active Trip'}
                </Text>
              </View>

              {isTripActive && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Speed</Text>
                    <Text style={styles.statValue}>{(currentSpeed * 3.6).toFixed(1)} km/h</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{distanceCovered.toFixed(2)} km</Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Permission Card */}
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

          {/* Trip Control Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Trip Control</Text>
              
              {!isTripActive ? (
                <Button
                  mode="contained"
                  onPress={handleStartTrip}
                  loading={loading}
                  disabled={!locationPermission || loading}
                  style={styles.startButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Start Trip
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleEndTrip}
                  loading={loading}
                  disabled={loading}
                  style={styles.endButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  buttonColor="#F44336"
                >
                  End Trip
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Approval Requests Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.requestsHeader}>
                <Text style={styles.cardTitle}>Student Requests</Text>
                {pendingRequests.length > 0 && (
                  <Badge style={styles.requestBadge}>{pendingRequests.length}</Badge>
                )}
              </View>
              
              {pendingRequests.length === 0 ? (
                <Text style={styles.infoText}>No pending approval requests</Text>
              ) : (
                <>
                  <Button
                    mode="outlined"
                    onPress={() => setShowRequests(!showRequests)}
                    style={styles.toggleButton}
                    icon={showRequests ? 'chevron-up' : 'chevron-down'}
                  >
                    {showRequests ? 'Hide' : 'Show'} Requests ({pendingRequests.length})
                  </Button>

                  {showRequests && pendingRequests.map((request) => (
                    <Card key={request.id} style={styles.requestCard}>
                      <Card.Content>
                        <View style={styles.requestInfo}>
                          <MaterialCommunityIcons name="account" size={24} color="#007AFF" />
                          <View style={styles.requestDetails}>
                            <Text style={styles.requestName}>{request.studentName}</Text>
                            <Text style={styles.requestEmail}>{request.studentEmail}</Text>
                            <Text style={styles.requestDate}>Requested: {formatDate(request.requestedAt)}</Text>
                          </View>
                        </View>

                        <View style={styles.requestActions}>
                          <Button
                            mode="contained"
                            onPress={() => handleApproveStudent(request)}
                            style={styles.approveBtn}
                            labelStyle={styles.actionBtnLabel}
                            icon="check"
                          >
                            Approve
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => handleRejectStudent(request)}
                            style={styles.rejectBtn}
                            labelStyle={styles.rejectBtnLabel}
                            icon="close"
                          >
                            Reject
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Info Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Instructions</Text>
              <Text style={styles.infoText}>
                1. Review and approve student requests above{'\n'}
                2. Ensure location permission is granted{'\n'}
                3. Press "Start Trip" when beginning your route{'\n'}
                4. Your location will be shared with students{'\n'}
                5. Press "End Trip" when you reach the destination
              </Text>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Actions</Text>
              <Button
                mode="outlined"
                onPress={() => router.push('/(screens)/route-recording' as any)}
                style={styles.routeButton}
                icon="map-marker-path"
              >
                Record Bus Route
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(screens)/chat')}
                style={styles.chatButton}
                icon="message-text"
              >
                Go to Group Chat
              </Button>
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
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
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
  },
  endButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  warningText: {
    fontSize: 16,
    color: '#FF9800',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
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
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestBadge: {
    backgroundColor: '#FF9800',
  },
  toggleButton: {
    marginTop: 8,
    marginBottom: 16,
    borderColor: '#007AFF',
  },
  requestCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter_400Regular',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#34C759',
  },
  rejectBtn: {
    flex: 1,
    borderColor: '#FF3B30',
  },
  actionBtnLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  rejectBtnLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3B30',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
});
