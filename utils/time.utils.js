exports.timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

exports.minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");

  const m = (minutes % 60).toString().padStart(2, "0");

  return `${h}:${m}`;
};
