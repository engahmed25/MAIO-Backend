const appointmentService = require("../services/appointment.service");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { notifyUser } = require("../services/notification.service");

const getPatientIdFromUser = async (userId) => {
  const patient = await Patient.findOne({ userId }).select("_id");
  if (!patient) {
    const error = new Error("Patient profile not found");
    error.statusCode = 404;
    throw error;
  }
  return patient._id;
};

const getDoctorIdFromUser = async (userId) => {
  const doctor = await Doctor.findOne({ userId }).select("_id");
  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.statusCode = 404;
    throw error;
  }
  return doctor._id;
};

exports.confirmAppointment = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        message: "reservationId is required",
      });
    }

    const appointment =
      await appointmentService.confirmAppointmentFromReservation({
        reservationId,
        patientId,
      });

    // Notify doctor about new appointment
    try {
      const doctor = await Doctor.findById(appointment.doctorId).select('userId');
      const patient = await Patient.findById(patientId).select('firstName lastName');

      if (doctor && doctor.userId && patient) {
        const patientName = `${patient.firstName} ${patient.lastName}`;
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
        const appointmentTime = `${appointment.startTime}-${appointment.endTime}`;

        await notifyUser(
          doctor.userId,
          'Doctor',
          `${patientName} has booked an appointment with you for ${appointmentDate} at ${appointmentTime}`,
          'appointment_booked',
          'appointment',
          appointment._id,
          null,
          {
            appointmentId: appointment._id.toString(),
            patientId: patientId.toString(),
            doctorId: doctor._id.toString(),
            appointmentDate: appointment.appointmentDate.toISOString(),
            startTime: appointment.startTime,
            endTime: appointment.endTime
          }
        );
      }
    } catch (notifyError) {
      console.error('Error notifying doctor:', notifyError.message);
    }

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    const status = error.statusCode || 409;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { type, page, limit } = req.body;

    const result = await appointmentService.getMyAppointments({
      patientId,
      type,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

exports.getAppointmentDetails = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required",
      });
    }

    const appointment =
      await appointmentService.getAppointmentDetailsForPatient({
        appointmentId,
        patientId,
      });

    res.status(200).json({
      success: true,
      data: {
        id: appointment._id,
        date: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes || null,
        doctor: appointment.doctorId,
      },
    });
  } catch (error) {
    const status = error.statusCode || 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAppointmentHistory = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { doctorId, startDate, endDate, page, limit } = req.query;

    const result = await appointmentService.getAppointmentHistory({
      patientId,
      doctorId,
      startDate,
      endDate,
      page: Number(page || 1),
      limit: Number(limit) || 10,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUpcomingForPatient = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const appointments =
      await appointmentService.getUpcomingAppointmentsForPatient(patientId);

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUpcomingForDoctor = async (req, res) => {
  try {
    const doctorId = await getDoctorIdFromUser(req.user._id);
    const appointments =
      await appointmentService.getUpcomingAppointmentsForDoctor(doctorId);

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { appointmentId } = req.params;
    const { newDate, newStartTime, newEndTime } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required",
      });
    }

    if (!newDate || !newStartTime || !newEndTime) {
      return res.status(400).json({
        success: false,
        message: "newDate, newStartTime, and newEndTime are required",
      });
    }

    const appointment = await appointmentService.rescheduleAppointment({
      appointmentId,
      patientId,
      newDate,
      newStartTime,
      newEndTime,
    });

    // ✅ Notify doctor about rescheduled appointment
    try {
      const doctor = await Doctor.findById(appointment.doctorId).select('userId');
      const patient = await Patient.findById(patientId).select('firstName lastName');

      if (doctor && doctor.userId && patient) {
        const patientName = `${patient.firstName} ${patient.lastName}`;
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
        const appointmentTime = `${appointment.startTime}-${appointment.endTime}`;

        await notifyUser(
          doctor.userId,
          'Doctor',
          `${patientName} has rescheduled their appointment to ${appointmentDate} at ${appointmentTime}`,
          'appointment_rescheduled',
          'appointment',
          appointment._id,
          null,
          {
            appointmentId: appointment._id.toString(),
            patientId: patientId.toString(),
            doctorId: doctor._id.toString(),
            newDate: appointment.appointmentDate.toISOString(),
            newTime: appointmentTime
          }
        );
      }
    } catch (notifyError) {
      console.error('Error notifying doctor about reschedule:', notifyError.message);
    }

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const patientId = await getPatientIdFromUser(req.user._id);
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required",
      });
    }

    await appointmentService.cancelAppointment({
      appointmentId,
      patientId,
    });

    // ✅ Notify doctor about cancelled appointment
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'userId')
        .populate('patientId', 'firstName lastName');

      if (appointment && appointment.doctorId && appointment.doctorId.userId) {
        const patientName = appointment.patientId
          ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
          : 'Patient';
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();

        await notifyUser(
          appointment.doctorId.userId,
          'Doctor',
          `${patientName} has cancelled their appointment scheduled for ${appointmentDate}`,
          'appointment_cancelled',
          'appointment',
          appointmentId,
          null,
          {
            appointmentId: appointmentId.toString(),
            patientId: patientId.toString(),
            cancelledDate: appointment.appointmentDate.toISOString()
          }
        );
      }
    } catch (notifyError) {
      console.error('Error notifying doctor about cancellation:', notifyError.message);
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    const status = error.statusCode || 404;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDoctorAppointmentsByDate = async (req, res) => {
  try {
    const doctorId = await getDoctorIdFromUser(req.user._id);
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date parameter is required",
      });
    }

    const result = await appointmentService.getAppointmentsForDoctorByDate({
      doctorId,
      date,
    });

    res.status(200).json({
      success: true,
      date: date,
      totalAppointments: result.totalAppointments,
      appointments: result.appointments,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = await getDoctorIdFromUser(req.user._id);
    const { page, limit } = req.query;

    const result = await appointmentService.getDoctorPatient({
      doctorId,
      page: Number(page || 1),
      limit: Number(limit) || 10,
    });

    res.status(200).json({
      success: true,
      totalPatients: result.totalPatients,
      patients: result.patients,
      pagination: result.pagination,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
