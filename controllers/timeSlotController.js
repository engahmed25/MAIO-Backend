const timeSlotService = require("../services/timeSlotService");

exports.createTimeSlots = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const doctorId = req.user.id;
    const { slots } = req.body || {};

    if (!slots) {
      return res.status(400).json({ success: false, message: "Slots are required" });
    }

    const createdSlots = await timeSlotService.createDoctorTimeSlots(doctorId, slots);
    res.status(201).json({
      success: true,
      message: "Time slots created successfully",
      data: createdSlots,
    });
  } catch (error) {
    next(error);
  }
};
