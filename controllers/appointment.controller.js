const appointmentService = require("../services/appointment.service");

exports.confirmAppointment = async (req, res) => {
  try {
    const patientId = req.user.patientId; // from auth middleware
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

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    res.status(409).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { type, page, limit } = req.body;

    const result = appointmentService.getMyAppointments({
      patientId,
      type,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAppointmentDetails = async (req, res) => {
  try {
    const patientId = req.user.patientId;
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
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAppointmentHistory = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { doctorId, startDate, endDate, page, limit } = req.query;

    const result = await appointmentService({
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
