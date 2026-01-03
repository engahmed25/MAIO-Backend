const RoomService = require("../services/RoomService");

const createRoom = async (req, res) => {
  try {
    const { doctorBId } = req.body; // Can be either User ID or Doctor ID
    const doctorAId = req.user._id; // User ID from auth
    const patientId = req.body.patientData.patientId; // Patient ID

    console.log("Creating room with:", {
      doctorAId: doctorAId.toString(),
      doctorBId,
      patientId,
    });

    const { room, isNew } = await RoomService.createRoom(
      doctorAId,
      doctorBId,
      patientId
    );

    if (!isNew) {
      return res.json({
        message: "Room already exists",
        room,
      });
    }

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error.message);

    if (error.message === "Cannot create room with yourself") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Patient not found") {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message.includes("Doctor") &&
      error.message.includes("not found")
    ) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await RoomService.getRooms(req.user._id);

    res.json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createRoom, getAllRooms };
