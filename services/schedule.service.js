const DoctorSchedule = require("../models/DoctorSchedule");
const { getDayOfWeek } = require("../utils/date.utils");

exports.getDoctorScheduleForDate = async ({ doctorId, date }) => {
  const dayOfWeek = getDayOfWeek(date);

  const schedules = await DoctorSchedule.find({
    doctorId,
    dayOfWeek,
    isActive: true,
  }).sort({ startTime: 1 });

  /**
   * Example output:
   * [
   *   { startTime: "09:00", endTime: "12:00" },
   *   { startTime: "14:00", endTime: "18:00" }
   * ]
   */

  return schedules.map((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    maxPatients: s.maxPatients,
  }));
};

exports.getAvailableDaysForDoctor = async ({ doctorId }) => {
  const schedules = await DoctorSchedule.find({
    doctorId,
  });
  const availableDays = schedules.map((s) => s.dayOfWeek);
  // Return unique days
  return [...new Set(availableDays)];
};
