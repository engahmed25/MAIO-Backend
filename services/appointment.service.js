const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Reservation = require("../models/Reservation");
const Patient = require("../models/Patient");

const ACTIVE_APPOINTMENT_STATUSES = ["scheduled", "confirmed"];

const normalizeDate = (dateValue) => {
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const buildDateTime = (date, timeString) => {
  const [hours, minutes] = (timeString || "00:00").split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(hours || 0, minutes || 0, 0, 0);
  return dt;
};

exports.getBookedSlotsForDoctor = async ({ doctorId, date }) => {
  const appointmentDate = normalizeDate(date);

  return await Appointment.find({
    doctorId,
    appointmentDate,
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
exports.rescheduleAppointment = async ({
  appointmentId,
  patientId,
  newDate,
  newStartTime,
  newEndTime,
}) => {
  // 1️⃣ Find the appointment
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  });

  if (!appointment) {
    throw new Error("Appointment not found or cannot be rescheduled");
  }

  // 2️⃣ Normalize the new date
  const newAppointmentDate = normalizeDate(newDate);

  // 3️⃣ Check if the new slot is available
  const conflictingAppointment = await Appointment.findOne({
    doctorId: appointment.doctorId,
    appointmentDate: newAppointmentDate,
    startTime: newStartTime,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    _id: { $ne: appointmentId }, // Exclude current appointment
  });

  if (conflictingAppointment) {
    throw new Error("The selected time slot is not available");
  }

  // 4️⃣ Update the appointment
  appointment.appointmentDate = newAppointmentDate;
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  appointment.status = "scheduled"; // Reset to scheduled after reschedule

  await appointment.save();

  // Return populated appointment
  return await Appointment.findById(appointment._id).populate(
    "doctorId",
    "firstName lastName specialization"
  );
};

exports.cancelAppointment = async ({ appointmentId, patientId }) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId,
  });

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status === "cancelled") {
    throw new Error("Appointment is already cancelled");
  }

  if (appointment.status === "completed") {
    throw new Error("Cannot cancel a completed appointment");
  }

  appointment.status = "cancelled";
  await appointment.save();

  return appointment;
};

exports.getAppointmentsForDoctorByDate = async ({ doctorId, date }) => {
  // Normalize the date to start of day
  const appointmentDate = normalizeDate(date);

  // Find appointments for the doctor on the specified date
  const appointments = await Appointment.find({
    doctorId,
    appointmentDate,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  })
    .populate({
      path: "patientId",
      select:
        "firstName lastName age gender phoneNumber emergencyContactNumber drugAllergies illnesses currentMedications medicalHistory",
    })
    .sort({ startTime: 1 }) // Sort by start time ascending
    .lean();

  // Format the response
  const formattedAppointments = appointments.map((appointment) => ({
    appointmentId: appointment._id,
    patientName: appointment.patientId
      ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
      : "Unknown Patient",
    patientInfo: {
      age: appointment.patientId?.age,
      gender: appointment.patientId?.gender,
      phoneNumber: appointment.patientId?.phoneNumber,
      emergencyContact: appointment.patientId?.emergencyContactNumber,
    },
    medicalInfo: {
      drugAllergies: appointment.patientId?.drugAllergies || "None",
      illnesses: appointment.patientId?.illnesses || [],
      currentMedications: appointment.patientId?.currentMedications || "None",
      chronicDiseases:
        appointment.patientId?.medicalHistory?.chronicDiseases || [],
      allergies: appointment.patientId?.medicalHistory?.allergies || [],
      medicalNotes: appointment.patientId?.medicalHistory?.notes || "",
    },
    appointmentDetails: {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      reasonForVisit: appointment.reasonForVisit,
      notes: appointment.notes || "",
    },
    createdAt: appointment.createdAt,
  }));

  return {
    totalAppointments: formattedAppointments.length,
    appointments: formattedAppointments,
  };
};

exports.getDoctorPatient = async ({ doctorId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // Get all unique patient IDs who have appointments with this doctor
  const patientIds = await Appointment.distinct("patientId", {
    doctorId,
    status: { $in: ["confirmed", "completed"] },
  });

  // Build patient filter
  const patientFilter = { _id: { $in: patientIds } };

  // Get patients with pagination
  const [patients, totalPatients] = await Promise.all([
    Patient.find(patientFilter)
      .select(
        "firstName lastName age gender emergencyContactNumber drugAllergies illnesses currentMedications medicalHistory reasonForSeeingDoctor createdAt"
      )
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(patientFilter),
  ]);

  // Get appointment statistics for each patient
  const patientsWithStats = await Promise.all(
    patients.map(async (patient) => {
      const appointmentStats = await Appointment.aggregate([
        {
          $match: {
            doctorId: doctorId,
            patientId: patient._id,
          },
        },
        {
          $group: {
            _id: null,
            totalAppointments: { $sum: 1 },
            completedAppointments: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            upcomingAppointments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", ["confirmed", "scheduled"]] },
                      { $gte: ["$appointmentDate", new Date()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            lastAppointment: {
              $max: {
                $cond: [
                  { $eq: ["$status", "completed"] },
                  "$appointmentDate",
                  null,
                ],
              },
            },
            nextAppointment: {
              $min: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", ["confirmed", "scheduled"]] },
                      { $gte: ["$appointmentDate", new Date()] },
                    ],
                  },
                  "$appointmentDate",
                  null,
                ],
              },
            },
          },
        },
      ]);

      const stats = appointmentStats[0] || {
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        lastAppointment: null,
        nextAppointment: null,
      };

      return {
        patientId: patient._id,
        personalInfo: {
          fullName: `${patient.firstName} ${patient.lastName}`,
          firstName: patient.firstName,
          lastName: patient.lastName,
          age: patient.age,
          gender: patient.gender,
          emergencyContact: patient.emergencyContactNumber,
        },
        medicalOverview: {
          reasonForSeeingDoctor: patient.reasonForSeeingDoctor,
          drugAllergies: patient.drugAllergies || "None",
          illnesses: patient.illnesses || [],
          currentMedications: patient.currentMedications || "None",
          chronicDiseases: patient.medicalHistory?.chronicDiseases || [],
          allergies: patient.medicalHistory?.allergies || [],
          medicalNotes: patient.medicalHistory?.notes || "",
        },
        appointmentStats: {
          totalAppointments: stats.totalAppointments,
          completedAppointments: stats.completedAppointments,
          upcomingAppointments: stats.upcomingAppointments,
          lastVisit: stats.lastAppointment,
          nextVisit: stats.nextAppointment,
        },
        registeredDate: patient.createdAt,
      };
    })
  );

  return {
    totalPatients,
    patients: patientsWithStats,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalPatients / limit),
      limit,
      hasNextPage: page < Math.ceil(totalPatients / limit),
      hasPrevPage: page > 1,
    },
  };
};
