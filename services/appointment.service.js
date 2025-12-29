const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Reservation = require("../models/Reservation");

const ACTIVE_APPOINTMENT_STATUSES = ["scheduled", "confirmed"];

const buildDateTime = (date, timeString) => {
  const [hours, minutes] = (timeString || "00:00").split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(hours || 0, minutes || 0, 0, 0);
  return dt;
};

exports.getBookedSlotsForDoctor = async ({ doctorId, date }) => {
  return await Appointment.find({
    doctorId,
    appointmentDate: date,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  }).select("startTime endTime -_id");
};

exports.confirmAppointmentFromReservation = async ({
  reservationId,
  patientId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Fetch reservation
    const reservation = await Reservation.findOne({
      _id: reservationId,
      patientId,
      status: "PENDING",
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!reservation) {
      throw new Error("Reservation not found or expired");
    }

    // 2️⃣ Create appointment
    const appointment = await Appointment.create(
      [
        {
          doctorId: reservation.doctorId,
          patientId: reservation.patientId,
          appointmentDate: reservation.appointmentDate,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          status: "confirmed",
          reasonForVisit: reservation.reasonForVisit || "N/A",
        },
      ],
      { session }
    );

    // 3️⃣ Delete reservation
    await Reservation.deleteOne({ _id: reservation._id }, { session });

    await session.commitTransaction();
    session.endSession();

    return appointment[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Duplicate booking protection
    if (error.code === 11000) {
      throw new Error("Slot already booked");
    }

    throw error;
  }
};

exports.getMyAppointments = async ({
  patientId,
  type = "upcoming",
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filter = { patientId };

  switch (type) {
    case "upcoming":
      filter.status = { $in: ["complete"] };
      filter.appointment = { $gte: today };
      break;
    case "past":
      filter.$or = [
        { appointmentDate: { $lt: today } },
        { status: "complete" },
      ];
      break;
    case "cancelled":
      filter.status = "cancelled";
      break;
    default:
      throw new Error("Invalid appointment type filter");
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("doctorId", "firstName lastName specialization")
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return {
    data: appointments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getAppointmentDetailsForPatient = async ({
  appointmentId,
  patientId,
}) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId,
  }).populate("doctorId", "firstName lastName specialization clinicAddress");
  if (!appointment) {
    throw new Error("Appointment not found");
  }
  return appointment;
};

exports.getAppointmentHistory = async ({
  patientId,
  doctorId,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * limit;

  const filter = { patientId, status: { $in: ["completed", "cancelled"] } };

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  // Optional date range filter
  if (startDate || endDate) {
    filter.appointmentDate = {};
    if (startDate) {
      filter.appointmentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.appointmentDate.$lte = new Date(endDate);
    }
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("doctorId", "firstName lastName specialization")
      .sort({ appointment: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return {
    data: appointments,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

exports.getUpcomingAppointmentsForPatient = async (patientId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const appointments = await Appointment.find({
    patientId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    appointmentDate: { $gte: startOfToday },
  })
    .populate("doctorId", "firstName lastName specialization clinicAddress")
    .sort({ appointmentDate: 1, startTime: 1 });

  const now = new Date();
  return appointments.filter(
    (appt) => buildDateTime(appt.appointmentDate, appt.startTime) >= now
  );
};

exports.getUpcomingAppointmentsForDoctor = async (doctorId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const appointments = await Appointment.find({
    doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    appointmentDate: { $gte: startOfToday },
  })
    .populate("patientId", "firstName lastName")
    .sort({ appointmentDate: 1, startTime: 1 });

  const now = new Date();
  return appointments.filter(
    (appt) => buildDateTime(appt.appointmentDate, appt.startTime) >= now
  );
};
