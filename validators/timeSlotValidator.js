const allowedDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

exports.validateSlots = (slots) => {
  if (!Array.isArray(slots) || slots.length === 0) {
    const err = new Error("Slots must be a non-empty array");
    err.status = 400;
    throw err;
  }

  slots.forEach((slot, index) => {
    const { day, start, end, maxPersonsPerSlot } = slot;

    // Required fields
    if (!day || !start || !end || maxPersonsPerSlot === undefined) {
      const err = new Error(
        `Slot ${index + 1}: day, start, end, and maxPersonsPerSlot are required`
      );
      err.status = 400;
      throw err;
    }

    // Day validation
    const normalizedDay = day.toLowerCase();
    if (!allowedDays.includes(normalizedDay)) {
      const err = new Error(`Slot ${index + 1}: invalid day "${day}"`);
      err.status = 400;
      throw err;
    }

    // Time format validation
    if (!isValidTime(start) || !isValidTime(end)) {
      const err = new Error(`Slot ${index + 1}: invalid time format (HH:mm)`);
      err.status = 400;
      throw err;
    }

    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    if (startMinutes >= endMinutes) {
      const err = new Error(
        `Slot ${index + 1}: start time must be before end time`
      );
      err.status = 400;
      throw err;
    }

    // maxPersonsPerSlot validation
    if (!Number.isInteger(maxPersonsPerSlot) || maxPersonsPerSlot <= 0) {
      const err = new Error(
        `Slot ${index + 1}: maxPersonsPerSlot must be a positive integer`
      );
      err.status = 400;
      throw err;
    }

    // Divisibility check (important for slot generation)
    const totalMinutes = endMinutes - startMinutes;
    if (totalMinutes % maxPersonsPerSlot !== 0) {
      const err = new Error(
        `Slot ${index + 1}: time range must be divisible by maxPersonsPerSlot`
      );
      err.status = 400;
      throw err;
    }
  });
};

exports.validateAggregatedSlots = (slots) => {
  if (!Array.isArray(slots) || slots.length === 0) {
    const err = new Error("Slots must be a non-empty array");
    err.status = 400;
    throw err;
  }

  slots.forEach((slot, index) => {
    const { day, start, end, maxPersonsPerSlot } = slot;

    if (!day || !start || !end || maxPersonsPerSlot === undefined) {
      const err = new Error(
        `Slot ${index + 1}: day, start, end, and maxPersonsPerSlot are required`
      );
      err.status = 400;
      throw err;
    }

    const normalizedDay = day.toLowerCase();
    if (!allowedDays.includes(normalizedDay)) {
      const err = new Error(`Slot ${index + 1}: invalid day "${day}"`);
      err.status = 400;
      throw err;
    }

    if (!isValidTime(start) || !isValidTime(end)) {
      const err = new Error(`Slot ${index + 1}: invalid time format (HH:mm)`);
      err.status = 400;
      throw err;
    }

    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    if (startMinutes >= endMinutes) {
      const err = new Error(
        `Slot ${index + 1}: start time must be before end time`
      );
      err.status = 400;
      throw err;
    }

    if (!Number.isInteger(maxPersonsPerSlot) || maxPersonsPerSlot <= 0) {
      const err = new Error(
        `Slot ${index + 1}: maxPersonsPerSlot must be a positive integer`
      );
      err.status = 400;
      throw err;
    }
  });
};
