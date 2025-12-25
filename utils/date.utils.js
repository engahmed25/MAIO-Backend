exports.getDayOfWeek = (date) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date(date).getDay()];
};
