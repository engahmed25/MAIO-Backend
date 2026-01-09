# MAIO Backend - Medical Appointment & Consultation Platform

A comprehensive, production-ready backend API for a telemedicine platform that connects patients with doctors, manages appointments, enables real-time communication, and processes secure payments.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Real-Time Features](#real-time-features)
- [Database Models](#database-models)
- [Security & Authentication](#security--authentication)
- [Error Handling & Logging](#error-handling--logging)
- [Best Practices](#best-practices)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

MAIO Backend is a feature-rich Express.js application designed for a multi-role healthcare platform. It manages:

- **User authentication and authorization** for patients, doctors, and administrators
- **Doctor profiles** with specialization, experience, and verification documents
- **Patient medical records** including history, documents, and prescriptions
- **Appointment management** with slot booking, confirmation, and rescheduling
- **Real-time communication** via WebSocket-based chat between doctors and patients
- **Payment processing** through Stripe integration
- **Notifications system** for appointment updates and important events
- **Doctor availability management** with configurable schedules and time slots
- **Admin dashboard** for user management, verification, and platform metrics

---

## Key Features

### User Management
- Role-based access control (Patient, Doctor, Admin)
- Multi-factor registration with document verification
- Profile management with profile picture uploads
- Account status management (pending, approved, active, suspended)
- Password reset via email with secure tokens

### Doctor Features
- Doctor profile with specialization and experience
- Verification document uploads (PhD Certificate, Medical License, ID Proof)
- Availability and schedule management
- Prescription writing for patients
- Patient list and medical history access
- Real-time chat with doctors for the same patient 

### Patient Features
- Patient profile with medical details
- Medical history and document uploads
- Book and manage appointments
- Prescription view and medication tracking
- Real-time communication with doctors
- Secure payment processing

### Admin Features
- User management and approval workflows
- Doctor verification and suspension controls
- Dashboard metrics and analytics
- Appointment oversight
- User account soft deletion (GDPR compliance)

### Real-Time Communication
- WebSocket-based chat rooms
- Real-time notifications
- Online status tracking
- Message persistence in MongoDB

### Payment Integration
- Stripe PaymentIntent API
- Secure payment confirmation
- Invoice generation
- Refund management
- Multiple payment method support

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.2 |
| **Database** | MongoDB (Mongoose 9.0) |
| **Authentication** | JWT (JSON Web Tokens) |
| **Password Hashing** | bcryptjs |
| **Real-Time** | Socket.IO 4.8 |
| **Payments** | Stripe API |
| **Email** | Nodemailer |
| **File Upload** | Multer |
| **Validation** | Joi |
| **Development** | Nodemon |
| **Other** | Ngrok (tunneling), Express-async-handler (error handling), CORS |

---

## Architecture

### Design Pattern: Layered Architecture (MVC-inspired)

The backend follows a clean, layered architecture:

```
Request → Routes → Middleware (Auth, Validation) → Controllers → Services → Models/Database
         ↓ (Error Handling)
       Response
```

### Key Architectural Layers

1. **Routes Layer** (`/routes`)
   - Defines all API endpoints
   - Integrates middleware for auth and validation

2. **Controllers Layer** (`/controllers`)
   - Handles request/response logic
   - Delegates business logic to services
   - Returns formatted responses

3. **Services Layer** (`/services`)
   - Core business logic implementation
   - Database operations via models
   - External service integrations (Stripe, Email)
   - Reusable across multiple controllers

4. **Models Layer** (`/models`)
   - MongoDB schema definitions via Mongoose
   - Data validation and relationships
   - Database indexes for performance

5. **Middleware Layer** (`/middleware`)
   - JWT authentication (`auth.js`)
   - Request validation (`validation.js`)
   - Socket.IO authentication (`socketAuthMiddleware.js`)
   - Form data parsing (`parseFormDataArrays.js`)

6. **Config Layer** (`/config`)
   - Database connection
   - Multer file upload configuration
   - Stripe API setup
   - Email transporter setup

7. **Utils Layer** (`/utils`)
   - JWT token generation and verification
   - Email templates
   - Date and time utilities

8. **Real-Time Layer** (`/sockets`)
   - Socket.IO event handlers
   - Chat functionality
   - Notification broadcasting

---

## Project Structure

```
MAIO-Backend/
├── config/                          # Configuration files
│   ├── db.js                       # MongoDB connection
│   ├── multer.js                   # File upload configuration
│   ├── nodemailer.js               # Email transporter
│   └── stripe.config.js            # Stripe API initialization
│
├── controllers/                     # Request handlers
│   ├── authController.js           # Auth logic (register, login, logout)
│   ├── adminController.js          # Admin operations
│   ├── appointment.controller.js   # Appointment management
│   ├── doctor.controller.js        # Doctor profile operations
│   ├── doctorSearch.controller.js  # Doctor search and filtering
│   ├── patientController.js        # Patient profile operations
│   ├── payment.controller.js       # Payment processing
│   ├── message.controller.js       # Chat message retrieval
│   ├── room.controller.js          # Chat room management
│   ├── prescriptionController.js   # Prescription handling
│   ├── availability.controller.js  # Availability endpoints
│   ├── reservation.controller.js   # Slot reservation
│   └── timeSlotController.js       # Time slot generation
│
├── models/                          # MongoDB schemas
│   ├── User.js                     # Base user (auth)
│   ├── Doctor.js                   # Doctor profile
│   ├── Patient.js                  # Patient profile
│   ├── Admin.js                    # Admin user
│   ├── Appointment.js              # Appointment bookings
│   ├── Reservation.js              # Temporary slot reservations
│   ├── Payment.js                  # Payment records
│   ├── Prescription.js             # Doctor prescriptions
│   ├── DoctorSchedule.js           # Availability schedules
│   ├── Message.js                  # Chat messages
│   ├── Room.js                     # Chat rooms
│   ├── Notification.js             # User notifications
│   └── Room.js                     # Video/consultation rooms
│
├── routes/                          # API route definitions
│   ├── authRoutes.js               # Auth endpoints
│   ├── doctor.routes.js            # Doctor API
│   ├── patientRoutes.js            # Patient API
│   ├── adminRoutes.js              # Admin API
│   ├── appointment.routes.js       # Appointment endpoints
│   ├── availability.routes.js      # Availability endpoints
│   ├── reservation.routes.js       # Slot reservation
│   ├── payment.routes.js           # Payment endpoints
│   ├── message.routes.js           # Chat message endpoints
│   ├── room.routes.js              # Chat room endpoints
│   ├── prescriptionRoutes.js       # Prescription endpoints
│   ├── notificationRoutes.js       # Notification endpoints
│   ├── chat.routes.js              # Chat route (if used)
│   └── fileUpload.routes.js        # File upload endpoints
│
├── services/                        # Business logic
│   ├── authService.js              # Registration and auth logic
│   ├── doctor.service.js           # Doctor operations
│   ├── patient.service.js          # Patient operations
│   ├── appointment.service.js      # Appointment business logic
│   ├── reservation.service.js      # Reservation logic
│   ├── payment.service.js          # Payment processing
│   ├── prescription.service.js     # Prescription logic
│   ├── emailService.js             # Email sending
│   ├── doctorSchedule.service.js   # Schedule management
│   ├── slot-generator.service.js   # Dynamic slot generation
│   ├── ChatService.js              # Chat operations
│   ├── RoomService.js              # Chat room logic
│   ├── notification.service.js     # Notification handling
│   ├── adminService.js             # Admin operations
│   ├── doctorSearch.service.js     # Search and filtering
│   └── schedule.service.js         # Schedule utilities
│
├── middleware/                      # Custom middleware
│   ├── auth.js                     # JWT protection & authorization
│   ├── validation.js               # Request validation (Joi)
│   ├── socketAuthMiddleware.js     # Socket.IO auth
│   └── parseFormDataArrays.js      # Parse array fields
│
├── sockets/                         # WebSocket handlers
│   ├── index.js                    # Socket.IO initialization
│   ├── chatHandler.js              # Chat event handlers
│   ├── socketAuth.js               # Token verification
│   └── notificationHandler.js      # Notification broadcasting
│
├── utils/                           # Utility functions
│   ├── Tokens.js                   # JWT generation and verification
│   ├── emailTemplates.js           # HTML email templates
│   ├── date.utils.js               # Date manipulation
│   └── time.utils.js               # Time utilities
│
├── validators/                      # Joi validation schemas
│   ├── authValidator.js            # Auth request validation
│   ├── doctorValidator.js          # Doctor data validation
│   ├── patientValidator.js         # Patient data validation
│   └── [other validators]
│
├── uploads/                         # File storage (local)
│   ├── ProfilePicture/
│   ├── MedicalLicense/
│   ├── PHDCertificate/
│   ├── IDProof/
│   └── MedicalDocuments/
│
├── postman/                         # API documentation
│   ├── Admin_API_Collection.json
│   ├── Doctor_API_Collection.json
│   ├── Patient_API_Collection.json
│   └── [test files and guides]
│
├── .env                            # Environment variables (not in repo)
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── index.js                        # Application entry point
└── README.md                       # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn**
- **MongoDB** (v5.0 or higher)
  - Local installation OR
  - MongoDB Atlas (cloud) connection URI
- **Git** for version control
- **Postman** (optional, for API testing)

### Verify Installation

```bash
node --version
npm --version
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/engahmed25/MAIO-Backend.git
cd MAIO-Backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`:
- Express.js and middleware
- MongoDB driver (Mongoose)
- Authentication (JWT, bcryptjs)
- Real-time communication (Socket.IO)
- Payment processing (Stripe)
- Email sending (Nodemailer)
- File handling (Multer)
- Validation (Joi)
- Utilities and development tools

### Step 3: Create Environment Variables File

Create a `.env` file in the project root:

```bash
cp .env.example .env  # if .env.example exists
# OR create manually
touch .env
```

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=9000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maio
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/maio?retryWrites=true&w=majority

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
# For Gmail, use App Passwords: https://support.google.com/accounts/answer/185833

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# Get these from https://dashboard.stripe.com/

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
# Production: https://yourfrontend.com

# Optional: Ngrok for tunneling (testing webhooks locally)
NGROK_URL=https://your-ngrok-url.ngrok.io
```

### Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Execution environment | `development` or `production` |
| `PORT` | Server port | `9000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://...` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Generate: `openssl rand -base64 32` |
| `JWT_ACCESS_EXPIRY` | Access token lifespan | `15m`, `1h`, etc. |
| `JWT_REFRESH_EXPIRY` | Refresh token lifespan | `7d`, `30d`, etc. |
| `EMAIL_USER` | Gmail address for sending emails | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app-specific password | [Create here](https://support.google.com/accounts/answer/185833) |
| `STRIPE_SECRET_KEY` | Stripe secret API key | From Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public API key | From Stripe Dashboard |
| `CLIENT_URL` | Frontend application URL | `http://localhost:5173` |

### Configuration Files

#### Database Configuration (`config/db.js`)
Initializes MongoDB connection using Mongoose. Connection is established on server startup.

#### Multer Configuration (`config/multer.js`)
Handles file uploads with:
- Automatic folder creation for different file types
- File type validation (PDF, DOC, DOCX for documents; JPG, PNG for images)
- File size limits
- Unique filename generation

#### Stripe Configuration (`config/stripe.config.js`)
Initializes Stripe client with the secret key. Used for payment processing.

#### Nodemailer Configuration (`config/nodemailer.js`)
Sets up email transporter for Gmail SMTP. Used for password resets and welcome emails.

---

## Running the Application

### Development Mode

```bash
npm start
```

This starts the server with Nodemon, which automatically restarts on file changes.

**Output:**
```
🚀 Server running on port 9000
📍 Environment: development
🔗 Health check: http://localhost:9000/health
```

### Health Check

Verify the server is running:

```bash
curl http://localhost:9000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-09T10:00:00.000Z",
  "environment": "development"
}
```

### Production Mode

```bash
NODE_ENV=production npm start
```

This runs the application in production mode with optimized settings.

### Using Docker (Optional)

If you have Docker installed:

```bash
docker build -t maio-backend .
docker run -p 9000:9000 --env-file .env maio-backend
```

---

## API Documentation

### Base URL

```
http://localhost:9000/api
```

### API Response Format

All endpoints return standardized JSON responses:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { /* response payload */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details (in development only)"
}
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access-token>
```

To get a token, login first using the auth endpoints below.

---

### Authentication Endpoints

#### Register Doctor
```http
POST /api/auth/register/doctor
Content-Type: multipart/form-data

{
  "email": "doctor@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "gender": "male",
  "yearsOfExperience": 5,
  "specialization": "Cardiology",
  "clinicAddress": "123 Medical St",
  "bio": "Experienced cardiologist",
  "phdCertificate": <file>,
  "medicalLicense": <file>,
  "idProof": <file>,
  "profilePicture": <file>
}
```

#### Register Patient
```http
POST /api/auth/register/patient
Content-Type: multipart/form-data

{
  "email": "patient@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "age": 30,
  "gender": "female",
  "emergencyContactNumber": "9876543210",
  "reasonForSeeingDoctor": "Annual checkup",
  "drugAllergies": "Penicillin",
  "illnesses": ["Hypertension"],
  "profilePicture": <file>
}
```

#### Login
```http
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "doctor"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh

{
  "refreshToken": "eyJhbGc..."
}
```

#### Reset Password
```http
GET /api/auth/reset?email=user@example.com
```

Then submit the reset code:
```http
POST /api/auth/reset

{
  "email": "user@example.com",
  "resetCode": "123456",
  "newPassword": "newPassword123"
}
```

---

### Doctor Endpoints

#### Get My Profile
```http
GET /api/doctors/me
Authorization: Bearer <token>
```

#### Search Doctors
```http
GET /api/doctors/search?specialization=Cardiology&experience=5&page=1&limit=10
```

#### Get Doctor Profile by ID
```http
GET /api/doctors/{doctorId}
```

#### Update My Profile
```http
PATCH /api/doctors/me
Authorization: Bearer <token>

{
  "firstName": "John",
  "bio": "Updated bio",
  "clinicAddress": "New address"
}
```

#### Upload Verification Documents
```http
POST /api/doctors/me/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "phdCertificate": <file>,
  "medicalLicense": <file>,
  "idProof": <file>
}
```

#### Get My Upcoming Appointments
```http
GET /api/doctors/me/appointments/upcoming
Authorization: Bearer <token>
```

#### Get Appointments by Date
```http
GET /api/doctors/me/appointments/date/2025-01-15
Authorization: Bearer <token>
```

#### Get My Patients
```http
GET /api/doctors/me/patients
Authorization: Bearer <token>
```

#### Add Prescription
```http
POST /api/doctors/patients/{patientId}/prescriptions
Authorization: Bearer <token>

{
  "medication": "Aspirin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "instructions": "Take with food"
}
```

#### Get Patient Prescriptions
```http
GET /api/doctors/patients/{patientId}/prescriptions
Authorization: Bearer <token>
```

---

### Patient Endpoints

#### Get My Profile
```http
GET /api/patients/me
Authorization: Bearer <token>
```

#### Update My Profile
```http
PATCH /api/patients/me
Authorization: Bearer <token>

{
  "firstName": "Jane",
  "age": 31,
  "emergencyContactNumber": "9876543210"
}
```

#### Add Medical History
```http
POST /api/patients/me/medical-history
Authorization: Bearer <token>

{
  "chronicDiseases": ["Hypertension"],
  "surgeries": ["Appendectomy in 2015"],
  "familyHistory": "Diabetes in family",
  "allergies": "Penicillin"
}
```

#### Update Medical History
```http
PUT /api/patients/me/medical-history
Authorization: Bearer <token>

{
  "chronicDiseases": ["Hypertension", "Diabetes"],
  "surgeries": ["Appendectomy in 2015"],
  "familyHistory": "Diabetes and heart disease in family",
  "allergies": "Penicillin, Sulfonamides"
}
```

#### Get My Medical History
```http
GET /api/patients/me/medical-history
Authorization: Bearer <token>
```

#### Upload Medical Document
```http
POST /api/patients/me/medical-documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "medicalDocument": <file>,
  "documentType": "Lab Report",
  "documentDate": "2025-01-08"
}
```

#### Get My Medical Records
```http
GET /api/patients/me/medical-records
Authorization: Bearer <token>
```

#### Change Password
```http
POST /api/patients/me/change-password
Authorization: Bearer <token>

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

#### Get My Upcoming Appointments
```http
GET /api/patients/me/appointments/upcoming
Authorization: Bearer <token>
```

#### Get My Appointments
```http
GET /api/patients/appointments/my?type=upcoming&page=1&limit=5
Authorization: Bearer <token>
```

---

### Appointment Endpoints

#### Get Doctor Availability
```http
GET /api/doctors/{doctorId}/availability?date=2025-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorId": "507f1f77bcf86cd799439011",
    "date": "2025-01-15",
    "availableSlots": [
      { "startTime": "09:00", "endTime": "09:30", "available": true },
      { "startTime": "09:30", "endTime": "10:00", "available": false }
    ]
  }
}
```

#### Get Available Days
```http
GET /api/doctors/{doctorId}/availableDays
```

#### Reserve Appointment Slot
```http
POST /api/reservations
Authorization: Bearer <token>

{
  "doctorId": "507f1f77bcf86cd799439011",
  "appointmentDate": "2025-01-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "reasonForVisit": "Chest pain consultation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reservationId": "507f1f77bcf86cd799439012",
    "reservationExpiresAt": "2025-01-15T09:00:00Z",
    "amountDue": 50.00
  }
}
```

#### Create Payment Intent
```http
POST /api/payments/intent
Authorization: Bearer <token>

{
  "reservationId": "507f1f77bcf86cd799439012",
  "amount": 5000  // in cents
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx#secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

#### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer <token>

{
  "paymentIntentId": "pi_xxx",
  "reservationId": "507f1f77bcf86cd799439012"
}
```

#### Confirm Appointment
```http
POST /api/appointments/confirm
Authorization: Bearer <token>

{
  "reservationId": "507f1f77bcf86cd799439012",
  "paymentIntentId": "pi_xxx"
}
```

#### Get My Appointments
```http
GET /api/appointments/my?type=upcoming&page=1&limit=5
Authorization: Bearer <token>
```

#### Get Appointment Details
```http
GET /api/appointments/{appointmentId}
Authorization: Bearer <token>
```

#### Reschedule Appointment
```http
PUT /api/appointments/{appointmentId}/reschedule
Authorization: Bearer <token>

{
  "newDate": "2025-01-20",
  "newStartTime": "10:00",
  "newEndTime": "10:30"
}
```

#### Cancel Appointment
```http
DELETE /api/appointments/{appointmentId}
Authorization: Bearer <token>

{
  "reason": "Cannot make it on that day"
}
```

---

### Admin Endpoints

#### Register Admin
```http
POST /api/admin/register

{
  "email": "admin@example.com",
  "password": "adminPassword123"
}
```

#### Admin Login
```http
POST /api/admin/login

{
  "email": "admin@example.com",
  "password": "adminPassword123"
}
```

#### Get Dashboard Metrics
```http
GET /api/admin/dashboard/metrics
Authorization: Bearer <token>
```

#### Get All Users
```http
GET /api/admin/users?page=1&limit=10&role=doctor
Authorization: Bearer <token>
```

#### Get Pending Users (Verification Queue)
```http
GET /api/admin/users/pending
Authorization: Bearer <token>
```

#### Get Specific User
```http
GET /api/admin/users/{userId}
Authorization: Bearer <token>
```

#### Update User Status
```http
PATCH /api/admin/users/{userId}/status
Authorization: Bearer <token>

{
  "status": "approved"  // or "suspended", "active", "pending"
}
```

#### Update Verification Status
```http
PATCH /api/admin/users/{userId}/verification
Authorization: Bearer <token>

{
  "verificationStatus": "approved",  // or "rejected"
  "rejectionReason": "Invalid credentials (if rejected)"
}
```

#### Get All Appointments
```http
GET /api/admin/appointments?page=1&limit=10&status=confirmed
Authorization: Bearer <token>
```

#### Soft Delete User
```http
DELETE /api/admin/users/{userId}
Authorization: Bearer <token>
```

---

### Notification Endpoints

#### Get My Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/unread/count
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

---

### Prescription Endpoints

#### Get My Prescriptions
```http
GET /api/prescriptions
Authorization: Bearer <token>
```

#### Get Prescription Details
```http
GET /api/prescriptions/{prescriptionId}
Authorization: Bearer <token>
```

#### Create Prescription
```http
POST /api/prescriptions
Authorization: Bearer <token>

{
  "patientId": "507f1f77bcf86cd799439011",
  "medication": "Aspirin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days"
}
```

#### Update Prescription Status
```http
PATCH /api/prescriptions/{prescriptionId}/status
Authorization: Bearer <token>

{
  "status": "discontinued"  // or "completed", "active"
}
```

---

### Chat Room Endpoints

#### Create Chat Room
```http
POST /api/v1/rooms/create
Authorization: Bearer <token>

{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012"
}
```

#### Get My Rooms
```http
GET /api/v1/rooms/my-rooms
Authorization: Bearer <token>
```

#### Get Messages
```http
GET /api/v1/messages/{roomId}
Authorization: Bearer <token>
```

---

## Real-Time Features

### WebSocket Events

The backend uses Socket.IO for real-time communication. Connect using:

```javascript
const socket = io('http://localhost:9000', {
  auth: {
    token: accessToken
  }
});
```

#### Chat Events

**Doctor joins a room:**
```javascript
socket.emit('join_room', { roomId: '507f...' });
```

**Send message:**
```javascript
socket.emit('send_message', {
  roomId: '507f...',
  content: 'Hello doctor!',
  messageType: 'text',
  attachments: []
});
```

**Receive message:**
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### Notification Events

**Broadcast notification:**
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

Example notifications:
- Appointment confirmed/cancelled
- Prescription updated
- Payment received
- Doctor status changes

---

## Database Models

### User Schema
Base user authentication model for all roles.

**Fields:**
- `email` (String, unique, required)
- `password` (String, hashed, required)
- `phoneNumber` (String, validated)
- `role` (enum: "patient", "doctor", "admin")
- `status` (enum: "pending", "approved", "active", "suspended")
- `verificationStatus` (enum: "pending", "approved", "rejected")
- `verifiedBy` (ObjectId, references User)
- `verifiedAt` (Date)
- `isDeleted` (Boolean, default: false - for soft deletion)
- `timestamps` (createdAt, updatedAt)

### Doctor Schema
Extended profile for doctors.

**Key Fields:**
- `userId` (ObjectId, ref: User, unique)
- `firstName`, `lastName` (String)
- `specialization` (enum: Cardiology, Dermatology, etc.)
- `yearsOfExperience` (Number)
- `clinicAddress` (String)
- `bio` (Text)
- `consultationFee` (Number)
- `verificationDocuments` (Object with file paths)
- `profilePicture` (String, file path)
- `isAvailable` (Boolean)

### Patient Schema
Extended profile for patients.

**Key Fields:**
- `userId` (ObjectId, ref: User, unique)
- `firstName`, `lastName` (String)
- `age` (Number)
- `gender` (enum: "male", "female", "other")
- `emergencyContactNumber` (String)
- `medicalHistory` (Object)
- `illnesses` (Array of strings)
- `drugAllergies` (String)
- `reasonForSeeingDoctor` (String)
- `profilePicture` (String)

### Appointment Schema
Booked appointments.

**Fields:**
- `patientId`, `doctorId` (ObjectId references)
- `appointmentDate` (Date)
- `startTime`, `endTime` (String, "HH:MM")
- `status` (enum: "scheduled", "confirmed", "cancelled", "completed", "no-show")
- `reasonForVisit` (String)
- `notes` (String)
- `cancelledBy` (enum: "patient", "doctor", "admin")
- `cancellationReason` (String)

### Reservation Schema
Temporary slot reservations before payment confirmation.

**Fields:**
- `patientId`, `doctorId` (ObjectId)
- `appointmentDate` (Date)
- `startTime`, `endTime` (String)
- `status` (enum: "pending", "confirmed", "expired", "cancelled")
- `expiresAt` (Date)
- `reservationPrice` (Number)

### Payment Schema
Payment transaction records.

**Fields:**
- `reservationId`, `appointmentId` (ObjectId)
- `patientId`, `doctorId` (ObjectId)
- `amount` (Number)
- `currency` (String, default: "USD")
- `status` (enum: "pending", "completed", "failed", "refunded")
- `paymentIntentId` (String, Stripe reference)
- `paymentGateway` (String, default: "stripe")
- `paidAt`, `refundedAt` (Date)
- `invoice` (Object with number and URL)

### Prescription Schema
Doctor-written prescriptions.

**Fields:**
- `doctorId`, `patientId` (ObjectId)
- `medication` (String)
- `dosage` (String)
- `frequency` (String)
- `duration` (String)
- `instructions` (String)
- `status` (enum: "active", "completed", "discontinued")
- `startDate`, `endDate` (Date)

### Message Schema
Chat messages.

**Fields:**
- `roomId` (ObjectId, ref: Room)
- `senderId` (ObjectId, ref: User)
- `content` (String)
- `messageType` (enum: "text", "image", "file")
- `attachments` (Array)
- `isRead` (Boolean)
- `readAt` (Date)
- `createdAt`, `updatedAt` (Timestamps)

### Room Schema
Chat rooms between doctor and patient.

**Fields:**
- `doctorId`, `patientId` (ObjectId)
- `appointmentId` (ObjectId, optional)
- `title` (String)
- `status` (enum: "active", "closed")
- `lastMessage` (String)
- `lastMessageAt` (Date)

### DoctorSchedule Schema
Doctor's availability configuration.

**Fields:**
- `doctorId` (ObjectId, ref: Doctor)
- `dayOfWeek` (0-6)
- `isAvailable` (Boolean)
- `startTime`, `endTime` (String, "HH:MM")
- `slotDuration` (Number, in minutes)
- `breakTimes` (Array)

### Notification Schema
User notifications.

**Fields:**
- `userId` (ObjectId)
- `type` (enum: "appointment", "prescription", "payment", "system")
- `title`, `message` (String)
- `relatedId` (ObjectId, e.g., appointmentId)
- `isRead` (Boolean)
- `readAt` (Date)

---

## Security & Authentication

### JWT (JSON Web Token) Authentication

The application uses JWT for stateless authentication:

1. **Access Token**
   - Short-lived (typically 15 minutes)
   - Used for API requests
   - Sent in Authorization header

2. **Refresh Token**
   - Long-lived (typically 7 days)
   - Stored in database
   - Used to get new access tokens
   - Only sent to `/api/auth/refresh`

**Token Structure:**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "id": "...", "email": "...", "role": "...", "status": "..." }
Signature: HMACSHA256(header + payload, JWT_ACCESS_SECRET)
```

### Password Security

- Passwords are hashed using **bcryptjs** (10 rounds of salting)
- Passwords are never stored in plain text
- Passwords are never returned in API responses (using `.select('-password')` in Mongoose queries)
- Password reset tokens are single-use and expire after a set time

### Authorization

Role-based access control (RBAC) via `authorize()` middleware:

```javascript
router.get('/admin-only', protect, authorize('admin'), handler);
```

**Available Roles:**
- `patient` - Patient user
- `doctor` - Doctor user
- `admin` - Platform administrator

### Document Verification

Doctors must upload and have approved:
- Medical License
- PhD Certificate (if applicable)
- ID Proof
- Profile Picture

Admins verify these documents before doctors can accept appointments.

### CORS Security

CORS is configured to accept requests from the frontend domain:

```javascript
cors({
  origin: true, // In dev; in prod, specify exact domain
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
})
```

**Note:** In production, replace `origin: true` with `origin: process.env.CLIENT_URL`

### Input Validation

All request bodies are validated using **Joi** schemas:

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().min(0).max(150)
});
```

Invalid requests return `400 Bad Request` with detailed error messages.

### File Upload Security

- File type validation (MIME type checking)
- File size limits (e.g., 5MB for documents)
- Unique filename generation (prevents overwrites)
- Stored outside web root (uploaded folder)
- Served through static middleware with proper headers

### Socket.IO Security

- WebSocket connections authenticated via JWT
- Token verified before processing events
- Only authenticated users can emit events
- Online status tracked securely

---

## Error Handling & Logging

### Error Handling Strategy

1. **Middleware-Level Errors**
   - Authentication failures → 401 Unauthorized
   - Authorization failures → 403 Forbidden
   - Validation failures → 400 Bad Request

2. **Service-Level Errors**
   - Database errors → 500 Internal Server Error
   - Stripe errors → 402 Payment Required or 500
   - Email sending failures → 500

3. **Global Error Handler**
   - Catches all unhandled errors
   - Returns consistent error format
   - Logs errors (in development, includes stack traces)

**Error Response Format:**
```json
{
  "success": false,
  "message": "User not found",
  "error": "Error details..." // Only in development
}
```

### Logging

Logging is done via `console` statements strategically placed throughout the codebase:

**Logged Events:**
- Server startup and shutdown
- Database connections
- Authentication attempts
- File uploads
- API errors
- Socket.IO events
- Email sends
- Stripe events

**Example Logs:**
```
🚀 Server running on port 9000
✅ User connected: socket_id, UserID: user_id
❌ User disconnected: socket_id, Reason: disconnect reason
Error: Error message with stack trace
```

### Health Check

Monitor server health via:
```bash
GET /health
```

Returns status, environment, and timestamp.

---

## Best Practices

### Code Organization

1. **Single Responsibility Principle**
   - Each service handles one domain (e.g., AuthService, PaymentService)
   - Controllers delegate to services
   - Routes only define endpoints

2. **DRY (Don't Repeat Yourself)**
   - Common logic in services
   - Reusable middleware
   - Shared validation schemas
   - Utility functions for common operations

3. **Consistent Naming**
   - Routes: RESTful conventions (`/api/resource/{id}`)
   - Methods: Verb-noun pairs (`getUser`, `createAppointment`)
   - Variables: camelCase

### Database Best Practices

1. **Indexing**
   - Compound indexes on frequently queried fields
   - Example: `Appointment.index({ doctorId: 1, appointmentDate: 1 })`

2. **Relationships**
   - Use `ObjectId` references between collections
   - Populate related data efficiently
   - Avoid circular references

3. **Soft Deletes**
   - Instead of hard deletes, mark `isDeleted: true`
   - Comply with GDPR data retention
   - Example: `User.find({ isDeleted: false })`

### API Best Practices

1. **RESTful Conventions**
   - POST for creating
   - GET for retrieving
   - PATCH for updating
   - DELETE for removing
   - PUT for full replacement

2. **Status Codes**
   - 200 OK - Success
   - 201 Created - Resource created
   - 400 Bad Request - Invalid input
   - 401 Unauthorized - Missing/invalid token
   - 403 Forbidden - Insufficient permissions
   - 404 Not Found - Resource doesn't exist
   - 500 Internal Server Error - Server error

3. **Pagination**
   - Use query parameters: `?page=1&limit=10`
   - Return total count in response
   - Default limit to prevent large queries

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git
   - Different secrets for dev/prod
   - Rotate secrets periodically

2. **Input Validation**
   - Validate on both client and server
   - Sanitize inputs before database queries
   - Use Joi schemas for consistency

3. **Rate Limiting**
   - Consider adding rate limiting middleware for production
   - Especially for auth endpoints (brute-force protection)

4. **HTTPS**
   - Always use HTTPS in production
   - Enforce HSTS headers
   - Use secure cookies (httpOnly, sameSite)

5. **Secrets Management**
   - Store secrets in environment variables
   - Never log sensitive information
   - Rotate secrets after employee departure

---

## Deployment

### Environment Preparation

1. **Set production environment variables:**
   ```bash
   NODE_ENV=production
   PORT=9000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maio
   JWT_ACCESS_SECRET=<strong-random-string>
   JWT_REFRESH_SECRET=<strong-random-string>
   # ... other variables
   ```

2. **Use MongoDB Atlas** (cloud) instead of local MongoDB
   - More reliable
   - Automatic backups
   - Security features

3. **Configure Stripe** production keys
   - Get from Stripe dashboard
   - Different keys for test/production

### Deployment Options

#### Option 1: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create maio-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
# ... set other variables

# Deploy
git push heroku main
```

#### Option 2: AWS EC2

```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Install Node.js and MongoDB
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16

# Clone repository
git clone <repo-url>
cd MAIO-Backend

# Install dependencies
npm install

# Set environment variables
nano .env

# Use PM2 for process management
npm install -g pm2
pm2 start index.js --name "maio-backend"
pm2 startup
pm2 save
```

#### Option 3: Docker & Docker Compose

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 9000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "9000:9000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/maio
      - PORT=9000
    depends_on:
      - mongo
    
  mongo:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongodb_data:
```

Run:
```bash
docker-compose up -d
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] SSL/HTTPS certificate installed
- [ ] CORS origin set to frontend URL
- [ ] Email service configured (Gmail app password created)
- [ ] Stripe keys configured
- [ ] Logging configured and monitored
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Database indexes created
- [ ] API rate limiting enabled
- [ ] Security headers configured
- [ ] HSTS enabled
- [ ] Database connection pooling optimized
- [ ] Load balancer configured (if needed)
- [ ] CDN for static files (if needed)
- [ ] Database replication/redundancy set up
- [ ] Backup strategy verified

---

## Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB (if not running)
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows:
net start MongoDB

# Or use MongoDB Atlas cloud URL instead
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maio
```

#### 2. Port Already in Use

**Error:** `Error: listen EADDRINUSE :::9000`

**Solution:**
```bash
# Find process using port
# macOS/Linux:
lsof -i :9000

# Windows:
netstat -ano | findstr :9000

# Kill the process or use different port
PORT=3000 npm start
```

#### 3. JWT Token Errors

**Error:** `Invalid access token` or `Not authorized, token failed`

**Solution:**
- Ensure token is sent in header: `Authorization: Bearer <token>`
- Check token expiration time
- Verify JWT secrets match in `.env`
- Generate new token by logging in again

#### 4. Email Not Sending

**Error:** `Error: Invalid login: 535-5.7.8 Username and password not accepted`

**Solution:**
```bash
# For Gmail:
1. Enable 2-Step Verification
2. Create App Password (not account password)
3. Use 16-character app password in EMAIL_PASS

# Test with curl:
curl -X POST http://localhost:9000/api/auth/reset?email=test@example.com
```

#### 5. Stripe Payment Errors

**Error:** `Error: Invalid API Key provided`

**Solution:**
- Ensure STRIPE_SECRET_KEY is set in `.env`
- Get key from Stripe Dashboard → API Keys
- Use test keys for development, live keys for production
- Verify key format: `sk_test_...` or `sk_live_...`

#### 6. File Upload Not Working

**Error:** `Required files are missing` or file not saved

**Solution:**
```bash
# Check upload directory exists
ls -la uploads/

# Ensure write permissions
chmod -R 755 uploads/

# Check file size limits in config/multer.js
# Verify Content-Type header is multipart/form-data
```

#### 7. Socket.IO Connection Failed

**Error:** `WebSocket connection failed` or `401 Unauthorized`

**Solution:**
- Ensure token is passed in auth: `io('url', { auth: { token: '...' } })`
- Check socket auth middleware validates token correctly
- Verify CORS settings allow frontend domain
- Check server and client socket versions match

#### 8. CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```javascript
// In .env
CLIENT_URL=http://localhost:5173

// In index.js, verify CORS config:
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

#### 9. Validation Errors

**Error:** `Validation error` with list of fields

**Solution:**
- Check request body matches schema
- Ensure all required fields are included
- Verify data types (string vs number)
- Review error message for specific issues

#### 10. Database Indexes Not Working

**Solution:**
```javascript
// In Mongoose model, explicitly create indexes:
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

// Create indexes in database:
// In MongoDB shell:
db.appointments.createIndex({ doctorId: 1, appointmentDate: 1 });
```

### Getting Help

1. Check server logs in terminal
2. Review error response message
3. Check MongoDB logs
4. Use Postman to test endpoints
5. Review Postman collection in `/postman` folder
6. Check related service/controller code
7. Verify environment variables are set

---

## Additional Resources

### Project Files & Documentation

- **Postman Collections:** `/postman/` folder
  - Admin API Collection
  - Doctor API Collection
  - Patient API Collection
  - Test flows and environment variables

- **Validators:** `/validators/` folder
  - Joi validation schemas for all endpoints
  - Data type and constraint definitions

- **Controllers:** `/controllers/` folder
  - Request/response handling
  - Service orchestration

### External Documentation

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [JWT.io](https://jwt.io/)
- [Joi Validation](https://joi.dev/)

### Development Tools

- **Postman:** API testing
- **MongoDB Compass:** Database management (GUI)
- **VS Code:** Code editor
- **Git:** Version control

---

## Assumptions & Notes

### Assumptions Made in This Documentation

1. **File Storage:** Uploads are stored locally in the `uploads/` folder. For production, consider cloud storage (AWS S3, Azure Blob) to handle multiple servers and scalability.

2. **Email Service:** Uses Gmail SMTP. For production, consider a dedicated email service (SendGrid, AWS SES) for better deliverability and rate limits.

3. **Real-Time Availability:** Socket.IO connections are not persisted across server restarts. For production with multiple servers, use Redis adapter.

4. **Database:** MongoDB is used. Alternatives include PostgreSQL (with TypeORM), MySQL, or Cloud Firestore.

5. **Rate Limiting:** Not currently implemented. Add `express-rate-limit` package for production security.

6. **Logging:** Uses `console.log`. For production, use a proper logging library (Winston, Pino) that logs to files or external services.

7. **Error Tracking:** No error tracking service integrated. Consider Sentry or New Relic for production.

8. **Testing:** No test suite included. Consider adding Jest and Supertest for unit and integration testing.

### Future Enhancements

- [ ] Unit and integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Rate limiting middleware
- [ ] Advanced logging system
- [ ] Video consultation integration
- [ ] Prescription refill system
- [ ] Insurance integration
- [ ] Analytics dashboard
- [ ] SMS notifications
- [ ] Mobile app API versioning
- [ ] GraphQL API option
- [ ] Caching layer (Redis)
- [ ] Background job queue (Bull, RabbitMQ)
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, Apple sign-in)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-09 | Initial release with core features |

---

## License

ISC License - See LICENSE file for details.

---

## Contact & Support

For issues, questions, or contributions, please reach out to the development team.

**Last Updated:** January 9, 2025  
**Maintained By:** Backend Development Team  
**Repository:** [Link to repository]

---

**Thank you for using MAIO Backend! Happy coding! 🚀**
