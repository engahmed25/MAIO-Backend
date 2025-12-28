const mongoose = require("mongoose");
const scheduleService = require("./schedule.service");
const slotGenerator = require("./slot-generator.service");
const appointmentService = require("./appointment.service");
const reservationService = require("./reservation.service");

exports.getAvailableSlots = async ({ doctorId, date }) => {
  /**
   * =========================
   * TASK 1 — Validation
   * =========================
   */

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error("Invalid doctorId");
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedDate < today) {
    throw new Error("Date cannot be in the past");
  }

  /**
   * =========================
   * TASK 2 — Get Doctor Schedule
   * =========================
   */

  const schedules = await scheduleService.getDoctorScheduleForDate({
    doctorId,
    date,
  });

  if (!schedules || schedules.length === 0) {
    return {
      doctorId,
      date,
      slots: [],
    };
  }
  /**
   * =========================
   * TASK 3 — Generate Time Slots
   * =========================
   */

  let slots = [];

  for (const schedule of schedules) {
    const generatedSlots = slotGenerator.generateSlotsFromSchedule(schedule);

    slots = slots.concat(generatedSlots);
  }
  /**
   * =========================
   * TASK 4 — Remove Booked Appointments
   * =========================
   */
  const bookedSlots = await appointmentService.getBookedSlotsForDoctor({
    doctorId,
    date,
  });

  if (bookedSlots.length) {
    slots = slots.filter((slot) => {
      return !bookedSlots.some(
        (booked) =>
          booked.startTime === slot.startTime && booked.endTime === slot.endTime
      );
    });
  }

  /**
   * =========================
   * TASK 5 — Remove Pending Reservations
   * =========================
   */
  const reservedSlots = await reservationService.getActiveReservationsForDoctor(
    {
      doctorId,
      date,
    }
  );

  if (reservedSlots.length) {
    slots = slots.filter(
      (slot) =>
        !reservedSlots.some(
          (reserved) =>
            reserved.startTime === slot.startTime &&
            reserved.endTime === slot.endTime
        )
    );
  }
  return {
    doctorId,
    date,
    slots,
  };
};

exports.getAvailableDays = async ({ doctorId }) => {
  /**
   * =========================
   * TASK 1 — Validation
   * =========================
   */
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error("Invalid doctorId");
  }
  /**
   * =========================
   * TASK 2 — Get Available Days
   * =========================
   */
  const availableDays = await scheduleService.getAvailableDaysForDoctor({
    doctorId,
  });
  return availableDays;
};
