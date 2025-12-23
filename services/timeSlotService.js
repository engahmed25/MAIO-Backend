const TimeSlot = require("../models/TimeSlot");
const { validateSlots } = require("../validators/timeSlotValidator");

exports.createDoctorTimeSlots = async (doctorId, slots) => {
  console.log("from Create Slots");

  // Parse slots if sent as string (FormData)
  if (typeof slots === "string") {
    try {
      slots = JSON.parse(slots);
    } catch {
      const error = new Error("Invalid JSON for slots");
      error.status = 400;
      throw error;
    }
  }

  validateSlots(slots);

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const toTime = (minutes) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const slotsToInsert = [];

  for (const slot of slots) {
    const { day, start, end, maxPersonsPerSlot } = slot;

    // ✅ Validate maxPersonsPerSlot per slot
    if (!maxPersonsPerSlot || maxPersonsPerSlot <= 0) {
      const error = new Error(`Invalid maxPersonsPerSlot for ${day}`);
      error.status = 400;
      throw error;
    }

    const dayOfWeek = day.toLowerCase();
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);

    const totalMinutes = endMin - startMin;

    if (totalMinutes <= 0) {
      const error = new Error(`Invalid time range for ${day}`);
      error.status = 400;
      throw error;
    }

    const slotDuration = totalMinutes / maxPersonsPerSlot;

    if (!Number.isInteger(slotDuration)) {
      const error = new Error(
        `Time range must be divisible by maxPersonsPerSlot for ${day}`
      );
      error.status = 400;
      throw error;
    }

    let currentStart = startMin;

    for (let i = 0; i < maxPersonsPerSlot; i++) {
      const currentEnd = currentStart + slotDuration;

      slotsToInsert.push({
        doctorId,
        dayOfWeek,
        startTime: toTime(currentStart),
        endTime: toTime(currentEnd),
        status: "available",
      });

      currentStart = currentEnd;
    }
  }

  // 🔒 Overlap & duplicate check
  for (const slot of slotsToInsert) {
    const existing = await TimeSlot.find({
      doctorId,
      dayOfWeek: slot.dayOfWeek,
    });

    const newStart = toMinutes(slot.startTime);
    const newEnd = toMinutes(slot.endTime);

    for (const ex of existing) {
      const exStart = toMinutes(ex.startTime);
      const exEnd = toMinutes(ex.endTime);

      if (newStart < exEnd && newEnd > exStart) {
        const error = new Error(
          `Overlapping slot for ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`
        );
        error.status = 409;
        throw error;
      }
    }
  }

  return await TimeSlot.insertMany(slotsToInsert);
};
