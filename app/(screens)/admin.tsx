import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Badge, IconButton, ActivityIndicator, Divider, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import apiService from '../../services/api';

interface ApprovalRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  busName: string;
  requestedAt: any;
  status: 'pending' | 'approved' | 'rejected';
}

interface Student {
  uid: string;
  fullName: string;
  email: string;
  bus: string;
  isApproved: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'students' | 'buses'>('requests');
  const [routeRecordingEnabled, setRouteRecordingEnabled] = useState(false);
  const [loadingRouteStatus, setLoadingRouteStatus] = useState(false);

  const checkRouteRecordingStatus = async (busId: string) => {
    try {
      setLoadingRouteStatus(true);
      const db = getFirestore();
      const busRef = doc(db, 'buses', busId);
      const busDoc = await getDoc(busRef);
      
      if (busDoc.exists()) {
        const busData = busDoc.data();
        setRouteRecordingEnabled(busData?.routeRecordingEnabled || false);
      } else {
        // Create bus document if it doesn't exist
        await setDoc(busRef, {
          id: busId,
          name: 'Bus A - Route 1',
          routeRecordingEnabled: false,
          createdAt: new Date(),
        });
        setRouteRecordingEnabled(false);
      }
    } catch (error) {
      console.error('Error checking route recording status:', error);
    } finally {
      setLoadingRouteStatus(false);
    }
  };

  const toggleRouteRecording = async (busId: string) => {
    try {
      const db = getFirestore();
      const busRef = doc(db, 'buses', busId);
      const newStatus = !routeRecordingEnabled;
      
      await updateDoc(busRef, {
        routeRecordingEnabled: newStatus,
        updatedAt: new Date(),
      });
      
      setRouteRecordingEnabled(newStatus);
      
      Alert.alert(
        'Success',
        `Route recording has been ${newStatus ? 'enabled' : 'disabled'} for ${busId}`
      );
    } catch (error) {
      console.error('Error toggling route recording:', error);
      Alert.alert('Error', 'Failed to update route recording status');
    }
  };

  const handleManageBus = (busId: string) => {
    checkRouteRecordingStatus(busId);
    Alert.alert(
      'Manage Bus',
      `Configure settings for ${busId}`,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to bus details screen in future
            Alert.alert('Info', 'Bus details screen coming soon');
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  useEffect(() => {
    // Check route recording status when buses tab is active
    if (activeTab === 'buses') {
      checkRouteRecordingStatus('bus-1');
    }
  }, [activeTab]);

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user || !auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const db = getFirestore();

    // Listen to pending approval requests
    const requestsQuery = query(
      collection(db, 'approvalRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApprovalRequest[];
      setPendingRequests(requests);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to approval requests:', error);
      setIsLoading(false);
    });

    // Listen to all students
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsList);
    }, (error) => {
      console.error('Error listening to students:', error);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeStudents();
    };
  }, [user]);

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      const db = getFirestore();
      
      // Update approval request
      await updateDoc(doc(db, 'approvalRequests', request.id), {
        status: 'approved',
        reviewedBy: auth.currentUser?.uid,
        reviewedByName: user?.fullName || 'Admin',
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

  const handleReject = async (request: ApprovalRequest) => {
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
                reviewedByName: user?.fullName || 'Admin',
                reviewedAt: new Date(),
                rejectionReason: 'Rejected by admin',
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0A0A0A', '#000000']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#000000']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, Admin</Text>
          <Text style={styles.subGreeting}>{user?.fullName}</Text>
        </View>
        <IconButton
          icon="logout"
          iconColor="#FF3B30"
          size={24}
          onPress={handleLogout}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="clock-alert-outline" size={32} color="#FFA500" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{pendingRequests.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statContent}>
              <MaterialCommunityIcons name="account-group" size={32} color="#007AFF" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{students.filter(s => s.isApproved).length}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {pendingRequests.length > 0 && (
            <Badge style={styles.badge}>{pendingRequests.length}</Badge>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
            Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'buses' && styles.activeTab]}
          onPress={() => setActiveTab('buses')}
        >
          <Text style={[styles.tabText, activeTab === 'buses' && styles.activeTabText]}>
            Buses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'requests' && (
          <View style={styles.section}>
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-circle-outline" size={64} color="#34C759" />
                <Text style={styles.emptyStateText}>No pending requests</Text>
              </View>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} style={styles.requestCard}>
                  <Card.Content>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.studentName}>{request.studentName}</Text>
                        <Text style={styles.studentEmail}>{request.studentEmail}</Text>
                        <Text style={styles.busInfo}>Bus: {request.busName}</Text>
                        <Text style={styles.requestDate}>
                          Requested: {formatDate(request.requestedAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestActions}>
                      <Button
                        mode="contained"
                        onPress={() => handleApprove(request)}
                        style={styles.approveButton}
                        labelStyle={styles.buttonLabel}
                        icon="check"
                      >
                        Approve
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleReject(request)}
                        style={styles.rejectButton}
                        labelStyle={styles.rejectButtonLabel}
                        icon="close"
                      >
                        Reject
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'students' && (
          <View style={styles.section}>
            {students.map((student) => (
              <Card key={student.uid} style={styles.studentCard}>
                <Card.Content>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.fullName}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                      <Text style={styles.busInfo}>Bus: {student.bus}</Text>
                    </View>
                    <Badge
                      style={student.isApproved ? styles.approvedBadge : styles.pendingBadge}
                    >
                      {student.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {activeTab === 'buses' && (
          <View style={styles.section}>
            <Card style={styles.busCard}>
              <Card.Content>
                <Text style={styles.busName}>Bus A - Route 1</Text>
                <Text style={styles.busDetails}>ID: bus-1</Text>
                <Text style={styles.busDetails}>
                  Students: {students.filter(s => s.bus === 'bus-1' && s.isApproved).length}
                </Text>
                
                <Divider style={styles.divider} />
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Route Recording</Text>
                    <Text style={styles.settingDescription}>
                      Allow driver to record new routes and bus stops
                    </Text>
                  </View>
                  <Switch
                    value={routeRecordingEnabled}
                    onValueChange={() => toggleRouteRecording('bus-1')}
                    disabled={loadingRouteStatus}
                    color="#007AFF"
                  />
                </View>
                
                <Button
                  mode="outlined"
                  style={styles.manageBusButton}
                  labelStyle={styles.manageBusLabel}
                  icon="pencil"
                  onPress={() => handleManageBus('bus-1')}
                >
                  Manage Bus
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  subGreeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  statContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statText: { flex: 1 },
  statNumber: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: 'rgba(255, 255, 255, 0.6)' },
  activeTabText: { color: '#FFFFFF' },
  badge: { backgroundColor: '#FF3B30', fontSize: 10 },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { paddingBottom: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.6)', marginTop: 16 },
  requestCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  requestInfo: { flex: 1 },
  studentName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 4 },
  studentEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 4 },
  busInfo: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#007AFF', marginBottom: 4 },
  requestDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.5)', marginTop: 8 },
  requestActions: { flexDirection: 'row', gap: 12 },
  approveButton: { flex: 1, backgroundColor: '#34C759' },
  rejectButton: { flex: 1, borderColor: '#FF3B30' },
  buttonLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rejectButtonLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FF3B30' },
  studentCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 12 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentInfo: { flex: 1 },
  approvedBadge: { backgroundColor: '#34C759' },
  pendingBadge: { backgroundColor: '#FFA500' },
  busCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 12 },
  busName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 8 },
  busDetails: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 4 },
  divider: { marginVertical: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingVertical: 8,
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { 
    fontSize: 16, 
    fontFamily: 'Inter_600SemiBold', 
    color: '#FFFFFF', 
    marginBottom: 4 
  },
  settingDescription: { 
    fontSize: 13, 
    fontFamily: 'Inter_400Regular', 
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  manageBusButton: { marginTop: 4, borderColor: '#007AFF' },
  manageBusLabel: { color: '#007AFF', fontFamily: 'Inter_600SemiBold' },
});
