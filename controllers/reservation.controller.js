const reservationService = require("../services/reservation.service");
const Patient = require("../models/Patient");

exports.reserveSlot = async (req, res) => {
  try {
    const userId = req.user._id;
    const { doctorId, date, startTime, endTime, reasonForVisit } = req.body;
    if (!doctorId || !date || !startTime || !endTime || !reasonForVisit) {
      return res.status(400).json({
        message:
          "doctorId, date, startTime, endTime and reasonForVisit are required",
      });
    }

    const patient = await Patient.findOne({ userId }).select("_id");
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found" });
    }

    const reservation = await reservationService.reserveSlot({
      doctorId,
      patientId: patient._id,
      date,
      startTime,
      endTime,
      reasonForVisit,
    });
    res.status(201).json({
      success: true,
      reservation,
      expiresInMinutes: 10,
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message && error.message.includes("Slot") ? 409 : 400);
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReservationDetails = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "reservationId is required",
      });
    }

    const patient = await Patient.findOne({ userId: req.user._id }).select(
      "_id"
    );
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found" });
    }

    const reservation = await reservationService.getReservationDetailsForPatient(
      {
        reservationId,
        patientId: patient._id,
      }
    );

    return res.status(200).json({
      success: true,
      reservation,
    });
  } catch (error) {
    const status = error.statusCode || 404;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
