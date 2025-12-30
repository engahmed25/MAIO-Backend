require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

const connectDB = require("./config/db");

// Import routes
const authRouter = require("./routes/authRoutes");
const doctorRouter = require("./routes/doctor.routes");
const adminRouter = require("./routes/adminRoutes");
const patientRouter = require("./routes/patientRoutes");
const availabilityRouter = require("./routes/availability.routes");
const appointmentRouter = require("./routes/appointment.routes");
const reservationRouter = require("./routes/reservation.routes");
const paymentRouter = require("./routes/payment.routes");

// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/patients", patientRouter);
// Mount availability under /api so route paths like
// GET /api/doctors/:doctorId/availability work as expected
app.use("/api", availabilityRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/payments", paymentRouter);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
