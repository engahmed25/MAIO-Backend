const timeSlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slotDuration: {
      type: Number,
      default: 30,
    },
    maxAppointmentsPerSlot: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

timeSlotSchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
