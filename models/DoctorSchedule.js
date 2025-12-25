const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
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
      lowercase: true,
    },

    startTime: {
      type: String, // "16:00"
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String, // "16:20"
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxPatients: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

doctorScheduleSchema.index(
  { doctorId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
