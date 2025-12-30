const crypto = require("crypto");
const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const RESERVATION_TTL_MINUTES = 10;
const DEFAULT_CURRENCY = (process.env.STRIPE_CURRENCY || "usd").toUpperCase();

const buildExpiryDate = () =>
  new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

const generateAppointmentCode = () =>
  crypto.randomBytes(4).toString("hex").toUpperCase();

const normalizeDate = (dateValue) => {
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

exports.reserveSlot = async ({
  doctorId,
  patientId,
  date,
  startTime,
  endTime,
  reasonForVisit,
}) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error("Invalid doctorId");
  }

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new Error("Invalid patientId");
  }

  if (!reasonForVisit) {
    throw new Error("reasonForVisit is required");
  }

  const appointmentDate = normalizeDate(date);

  const doctor = await Doctor.findById(doctorId).select("ratePerSession");
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const expiresAt = buildExpiryDate();
  const amount = Number(doctor.ratePerSession || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Doctor consultation fee is not configured for payments");
  }

  /**
   * STEP 1 — Ensure slot is not already booked
   */

  const booked = await Appointment.findOne({
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    status: { $in: ["scheduled", "confirmed"] },
  });
  if (booked) {
    throw new Error("Slot already booked");
  }
  /**
   * STEP 2 — Create reservation
   * DB unique index prevents race conditions
   */
  try {
    return await Reservation.create({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
      status: "PENDING",
      reasonForVisit,
      amount,
      currency: DEFAULT_CURRENCY,
      appointmentCode: generateAppointmentCode(),
      expiresAt,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Slot is already reserved");
    }
    throw err;
  }
};

exports.getActiveReservationsForDoctor = async ({ doctorId, date }) => {
  const appointmentDate = normalizeDate(date);
  return await Reservation.find({
    doctorId,
    appointmentDate,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  }).select("startTime endTime -_id");
};

exports.findPendingReservationById = async ({ reservationId, patientId }) => {
  const filter = {
    _id: reservationId,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  };

  if (patientId) {
    filter.patientId = patientId;
  }

  return Reservation.findOne(filter);
};

exports.getReservationDetailsForPatient = async ({
  reservationId,
  patientId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    const error = new Error("Invalid reservationId");
    error.statusCode = 400;
    throw error;
  }

  const reservation = await Reservation.findOne({
    _id: reservationId,
    patientId,
  })
    .populate(
      "doctorId",
      "firstName lastName specialization ratePerSession clinicAddress"
    )
    .lean();

  if (!reservation) {
    const error = new Error("Reservation not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const isExpiredStatus = reservation.status === "EXPIRED";
  const isPendingAndExpired =
    reservation.status === "PENDING" && reservation.expiresAt <= now;

  if (isExpiredStatus || isPendingAndExpired) {
    // Clean up pending reservations that passed TTL
    if (isPendingAndExpired) {
      await Reservation.deleteOne({ _id: reservation._id });
    }
    const error = new Error("Reservation has expired");
    error.statusCode = 410;
    throw error;
  }

  return reservation;
};

exports.releaseReservation = async (reservationId) => {
  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    return;
  }
  return Reservation.deleteOne({ _id: reservationId });
};
