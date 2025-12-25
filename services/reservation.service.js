const Reservation = require("../models/Reservation");
const Appointment = require("../models/Appointment");

const RESERVATION_TTL_MINUTES = 10;

exports.reserveSlot = async ({
  doctorId,
  patientId,
  date,
  startTime,
  endTime,
}) => {
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES);
  /**
   * STEP 1 — Ensure slot is not already booked
   */

  const booked = await Appointment.findOne({
    doctorId,
    appointmentDate: date,
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
      appointmentDate: date,
      startTime,
      endTime,
      status: "PENDING",
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
  return await Reservation.find({
    doctorId,
    appointmentDate: date,
    expiresAt: { $gt: new Date() },
  }).select("startTime endTime -_id");
};
