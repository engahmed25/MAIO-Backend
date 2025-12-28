const availabilityService = require("../services/availability.service");

exports.getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    // Basic validation
    if (!doctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });
    }

    const availability = await availabilityService.getAvailableSlots({
      doctorId,
      date,
    });

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDoctorAvailableDays = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const availability = await availabilityService.getAvailableDays({
      doctorId,
    });
    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
