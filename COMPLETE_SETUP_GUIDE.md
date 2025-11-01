# 🚌 Sundhara Travels - Complete Setup Guide (3-Role System)

## 📋 Overview

This guide covers the complete setup for the enhanced Sundhara Travels app with:
- ✅ **3 Roles**: Admin, Driver, Student
- ✅ **Approval Workflow**: Students need admin/driver approval
- ✅ **Live Location Tracking**: Drivers can share real-time location
- ✅ **Bus & Route Management**: Admin can create and manage buses and routes
- ✅ **Existing Bus-1 Route Preserved**: Your current route data is maintained

---

## 🚀 Quick Start (First Time Setup)

### **Step 1: Install Dependencies**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### **Step 2: Setup Database & Users**

Run this single command to setup everything:

```bash
cd server
npm run setup
```

This will:
1. Create an admin user (admin@sundharatravels.com)
2. Create a driver user (driver@sundharatravels.com)
3. Seed the existing Bus-1 route with all 13 stops

**Default Credentials:**
- **Admin**: admin@sundharatravels.com / admin@123456
- **Driver**: driver@sundharatravels.com / ccet@busesm

### **Step 3: Deploy Firestore Rules**

```bash
# From project root
firebase deploy --only firestore
```

### **Step 4: Start the App**

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm start
```

---

## 👥 User Roles & Capabilities

### **🔐 Admin**
- View all students and drivers
- Approve/reject student registration requests
- Create new buses and routes
- Assign drivers to buses
- View all bus locations
- Manage all system data

### **🚗 Driver**
- Approve/reject student requests for their assigned bus
- Start/end trips
- Share live location (GPS tracking every 5 seconds)
- View students on their bus
- Access group chat

### **👨‍🎓 Student**
- Sign up and wait for approval
- View live bus location after approval
- See bus route and stops
- Access group chat
- Receive proximity notifications

---

## 🔄 Student Signup & Approval Workflow

### **Student Flow:**
1. Student signs up via the app
2. Account is created with `isApproved: false`
3. Student sees "Pending Approval" screen
4. Student receives real-time notification when approved
5. After approval, student can complete profile and access app

### **Admin/Driver Flow:**
1. Login to admin/driver account
2. See pending approval requests
3. Review student details (name, email, bus)
4. Click "Approve" or "Reject"
5. Student gets immediate access (or notification of rejection)

---

## 🚌 Bus & Route Management

### **Existing Bus-1 Route**
Your current bus-1 route has been preserved with all 13 stops:
- Mallapuram → Soolapuram → Esanatham → ... → Chettinad College
- Route ID: `route-1`
- Bus ID: `bus-1`

### **Creating New Buses (Admin Only)**

Via Backend API:
```bash
POST /api/admin/buses
{
  "name": "Bus B - Route 2",
  "number": "TN-01-AB-5678",
  "routeId": "route-2",
  "capacity": 50
}
```

### **Creating New Routes (Admin Only)**

```bash
POST /api/admin/routes
{
  "name": "South Route",
  "description": "College to South locations",
  "stops": [...busStops],
  "distance": 35,
  "estimatedDuration": 75
}
```

---

## 📡 Live Location Tracking

### **Driver Side:**
1. Driver logs in and opens Driver Panel
2. Click "Start Trip" button
3. GPS location is automatically shared every 5 seconds
4. Location broadcasts to all students on the bus
5. Click "End Trip" to stop tracking

### **Student Side:**
1. Open Dashboard tab
2. See real-time bus marker moving on map
3. View estimated arrival time
4. Receive notifications when bus is within 2km

### **Technical Details:**
- Uses Socket.io for real-time updates
- GPS accuracy: ±10 meters
- Update interval: 5 seconds
- Location history stored for 24 hours

---

## 🗄️ Database Collections

### **users**
```typescript
{
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'driver' | 'admin';
  bus?: string; // Optional for admin
  isApproved: boolean;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **approvalRequests**
```typescript
{
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  busId: string;
  busName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}
```

### **buses**
```typescript
{
  id: string;
  name: string;
  number: string;
  routeId: string;
  driverId?: string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
}
```

### **routes**
```typescript
{
  id: string;
  name: string;
  description: string;
  stops: BusStop[];
  distance: number;
  estimatedDuration: number;
  isActive: boolean;
}
```

---

## 🔧 Backend API Endpoints

### **Admin Endpoints** (Require Admin Role)

```
GET    /api/admin/buses                    # Get all buses
POST   /api/admin/buses                    # Create new bus
PUT    /api/admin/buses/:busId             # Update bus
DELETE /api/admin/buses/:busId             # Delete bus

GET    /api/admin/routes                   # Get all routes
POST   /api/admin/routes                   # Create new route
PUT    /api/admin/routes/:routeId          # Update route
DELETE /api/admin/routes/:routeId          # Delete route

GET    /api/admin/approval-requests        # Get pending requests
POST   /api/admin/approval-requests/:id/approve  # Approve student
POST   /api/admin/approval-requests/:id/reject   # Reject student

GET    /api/admin/students                 # Get all students
GET    /api/admin/drivers                  # Get all drivers
POST   /api/admin/assign-driver            # Assign driver to bus
GET    /api/admin/students/bus/:busId      # Get students by bus
```

---

## 🔒 Security Features

1. **Role-Based Access Control (RBAC)**
   - Firestore security rules enforce role permissions
   - Backend middleware validates user roles
   - Students can only access their own data

2. **Approval Workflow**
   - Students cannot access app until approved
   - Only admins and drivers can approve requests
   - Real-time approval status updates

3. **Data Protection**
   - Admin and drivers can only VIEW student data (no editing)
   - Students cannot modify critical fields (role, bus assignment)
   - All updates logged with timestamps

4. **Authentication**
   - Firebase Authentication for user management
   - JWT tokens for API authentication
   - Session persistence with AsyncStorage

---

## 📱 App Navigation Flow

```
Login/Signup
    ↓
[Student] → Pending Approval → Profile Setup → Dashboard
    ↓
[Driver] → Driver Panel → Start Trip → Live Tracking
    ↓
[Admin] → Admin Panel → Manage Requests/Students/Buses
```

---

## 🛠️ Manual Setup Commands

If you prefer to run commands individually:

```bash
# Create admin user
cd server
npm run create-admin

# Create driver user
npm run create-driver

# Seed bus-1 route
npm run seed-bus-route

# Deploy Firestore rules
firebase deploy --only firestore

# Start backend
npm run dev
```

---

## 📊 Testing the Complete Flow

### **Test Student Approval:**
1. Sign up as a new student
2. Login as admin (admin@sundharatravels.com)
3. See the pending request in Admin Panel
4. Approve the student
5. Student automatically redirected to app

### **Test Live Location:**
1. Login as driver
2. Go to Driver Panel
3. Click "Start Trip"
4. Open student app
5. See bus moving on map in real-time

### **Test Admin Functions:**
1. Login as admin
2. View all students and their statuses
3. View all pending approval requests
4. Manage buses and routes

---

## 🐛 Troubleshooting

### **Students Not Seeing Approval Status:**
- Check Firestore security rules are deployed
- Verify `isApproved` field exists in user document
- Check real-time listeners in pending-approval screen

### **Driver Cannot Share Location:**
- Ensure GPS permissions granted
- Check driver is assigned to a bus
- Verify Socket.io connection

### **Admin Cannot Approve Students:**
- Verify admin role in Firestore
- Check Firebase auth token
- Ensure approval request document exists

---

## 📞 Support

For issues or questions:
- Check FINAL_STATUS.md for system status
- Review Firestore rules in firestore.rules
- Check backend logs: `cd server && npm run dev`
- Verify user roles in Firebase Console

---

## ✅ Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Admin user created
- [ ] Driver user created
- [ ] Bus-1 route seeded
- [ ] Firestore rules deployed
- [ ] Backend server running
- [ ] Frontend app running
- [ ] Test student signup
- [ ] Test approval workflow
- [ ] Test live location tracking
- [ ] Test admin panel

---

**🎉 Your 3-role bus tracking system is ready to use!**
