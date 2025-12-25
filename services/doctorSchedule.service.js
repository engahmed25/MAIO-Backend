const DoctorSchedule = require("../models/DoctorSchedule");
const { validateAggregatedSlots } = require("../validators/timeSlotValidator");

exports.createDoctorSchedule = async (doctorId, slots) => {
  console.log("createDoctorSchedule called for doctor:", doctorId);
  console.log("received slots:", JSON.stringify(slots));

  // Parse slots if sent as string (FormData)
  if (!slots) {
    console.log("no slots provided, skipping schedule creation");
    return [];
  }

  if (typeof slots === "string") {
    try {
      slots = JSON.parse(slots);
    } catch {
      const error = new Error("Invalid JSON for slots");
      error.status = 400;
      throw error;
    }
  }

  validateAggregatedSlots(slots);

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const slotsToInsert = [];

  for (const slot of slots) {
    const { day, start, end, maxPersonsPerSlot } = slot;
    const dayOfWeek = day.toLowerCase();

    // Overlap check per day
    const existing = await DoctorSchedule.find({ doctorId, dayOfWeek });
    const newStart = toMinutes(start);
    const newEnd = toMinutes(end);

    for (const ex of existing) {
      const exStart = toMinutes(ex.startTime);
      const exEnd = toMinutes(ex.endTime);
      if (newStart < exEnd && newEnd > exStart) {
        const error = new Error(
          `Overlapping slot for ${dayOfWeek}: ${start}-${end}`
        );
        error.status = 409;
        throw error;
      }
    }

    slotsToInsert.push({
      doctorId,
      dayOfWeek,
      startTime: start,
      endTime: end,
      maxPatients: Number(maxPersonsPerSlot),
    });
  }

  try {
    const inserted = await DoctorSchedule.insertMany(slotsToInsert);
    console.log("inserted schedule count:", inserted.length);
    return inserted;
  } catch (err) {
    console.error("Error inserting doctor schedule:", err.message || err);
    throw err;
  }
};
