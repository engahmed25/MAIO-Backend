const Room = require("../models/Room");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const mongoose = require("mongoose");

class RoomService {
  /**
   * Helper to get doctor profile from either userId or doctorId
   */
  async getDoctorProfile(id) {
    if (!id) return null;

    // Try to find by doctor ID first (direct lookup)
    let doctor = await Doctor.findById(id);

    // If not found, try to find by userId
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: id });
    }

    return doctor;
  }

  async createRoom(doctorAId, doctorBId, patientId) {
    // Get doctor profiles (accepts both user ID and doctor ID)
    const [doctorA, doctorB] = await Promise.all([
      this.getDoctorProfile(doctorAId),
      this.getDoctorProfile(doctorBId),
    ]);

    if (!doctorA) {
      throw new Error("Doctor A not found");
    }

    if (!doctorB) {
      throw new Error("Doctor B not found");
    }

    if (doctorA._id.toString() === doctorB._id.toString()) {
      throw new Error("Cannot create room with yourself");
    }

    // Get patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Generate roomName
    const doctors = [doctorA._id.toString(), doctorB._id.toString()].sort();
    const roomName = `room_${doctors[0]}_${doctors[1]}_${patient._id}`;

    // Check if room already exists
    const existingRoom = await Room.findOne({
      $or: [
        { doctorA: doctorA._id, doctorB: doctorB._id, patient: patient._id },
        { doctorA: doctorB._id, doctorB: doctorA._id, patient: patient._id },
      ],
    }).populate(["doctorA", "doctorB", "patient"]);

    if (existingRoom) {
      return { room: existingRoom, isNew: false };
    }

    const room = new Room({
      doctorA: doctorA._id,
      doctorB: doctorB._id,
      patient: patient._id,
      roomName: roomName,
    });

    await room.save();
    await room.populate(["doctorA", "doctorB", "patient"]);

    return { room, isNew: true };
  }

  async getRooms(userIdOrDoctorId) {
    // Get doctor profile (accepts both user ID and doctor ID)
    const doctorProfile = await this.getDoctorProfile(userIdOrDoctorId);

    if (!doctorProfile) {
      throw new Error("Doctor profile not found");
    }

    const doctorId = doctorProfile._id;

    return await Room.find({
      $or: [{ doctorA: doctorId }, { doctorB: doctorId }],
    })
      .populate("doctorA", "firstName lastName specialization")
      .populate("doctorB", "firstName lastName specialization")
      .populate("patient", "firstName lastName age gender")
      .sort({ updatedAt: -1 });
  }
}

module.exports = new RoomService();
