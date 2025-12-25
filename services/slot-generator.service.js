const { timeToMinutes, minutesToTime } = require("../utils/time.utils");

exports.generateSlotsFromSchedule = (schedule) => {
  const { startTime, endTime, maxPatients } = schedule;

  if (!maxPatients || maxPatients <= 0) {
    throw new Error("Invalid maxPatients value");
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const totalMinutes = endMinutes - startMinutes;

  if (totalMinutes <= 0) {
    throw new Error("Invalid time range");
  }

  const slotDuration = totalMinutes / maxPatients;

  if (!Number.isInteger(slotDuration)) {
    throw new Error("Time range must be divisible by maxPatients");
  }

  const slots = [];
  let currentStart = startMinutes;

  for (let i = 0; i < maxPatients; i++) {
    const currentEnd = currentStart + slotDuration;

    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(currentEnd),
    });

    currentStart = currentEnd;
  }

  return slots;
};
