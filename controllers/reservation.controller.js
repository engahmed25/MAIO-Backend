const reservationService = require("../services/reservation.service");

exports.reserveSlot = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { doctorId, date, startTime, endTime } = req.body;
    if (!doctorId || !date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "doctorId, date, startTime, endTime are required" });
    }
    const reservation = await reservationService.reserveSlot({
      doctorId,
      patientId,
      date,
      startTime,
      endTime,
    });
    res.status(201).json({
      success: true,
      reservation,
      expiresInMinutes: 10,
    });
  } catch (error) {
    res.status(409).json({
      success: false,
      message: error.message,
    });
  }
};
