require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const { socketAuthMiddleware } = require("./middleware/socketAuthMiddleware");
const connectDB = require("./config/db");
const chatHandler = require("./sockets/chatHandler");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Import routes
const roomRoutes = require("./routes/room.routes");
const messageRoutes = require("./routes/message.routes");
const fileUploadRoutes = require("./routes/fileUpload.routes");
const authRouter = require("./routes/authRoutes");
const doctorRouter = require("./routes/doctor.routes");
const adminRouter = require("./routes/adminRoutes");
const patientRouter = require("./routes/patientRoutes");
const availabilityRouter = require("./routes/availability.routes");
const appointmentRouter = require("./routes/appointment.routes");
const reservationRouter = require("./routes/reservation.routes");
const paymentRouter = require("./routes/payment.routes");

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route (before other routes for quick response)
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/patients", patientRouter);
app.use("/api", availabilityRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/files", fileUploadRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.stack,
      details: err,
    }),
  });
});
// Socket.io authentication middleware
io.use((socket, next) => {
  console.log("Socket auth attempt:", {
    auth: socket.handshake.auth,
    query: socket.handshake.query,
    headers: socket.handshake.headers.authorization,
  });
  socketAuthMiddleware(socket, next);
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}, UserID: ${socket.userId}`);

  chatHandler(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, Reason: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    console.error(`Socket connection error:`, error.message);
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server after DB connection
const PORT = process.env.PORT || 9000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
