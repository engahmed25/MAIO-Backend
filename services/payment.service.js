const mongoose = require("mongoose");
const stripe = require("../config/stripe.config");
const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const reservationService = require("./reservation.service");

const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

const getPatientForUser = async (userId) => {
  const patient = await Patient.findOne({ userId }).select("_id userId");
  if (!patient) {
    const error = new Error("Patient profile not found");
    error.statusCode = 404;
    throw error;
  }
  return patient;
};

const ensureAmount = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const error = new Error("Invalid consultation fee configured for doctor");
    error.statusCode = 400;
    throw error;
  }
  return numericAmount;
};

const buildPaymentDetails = (intent) => ({
  status: intent.status,
  paymentMethodTypes: intent.payment_method_types,
  latestChargeId: intent.latest_charge || null,
  charges:
    intent.charges && intent.charges.data
      ? intent.charges.data.map((charge) => ({
          id: charge.id,
          receiptUrl: charge.receipt_url,
          paymentMethodDetails: charge.payment_method_details,
          outcome: charge.outcome,
        }))
      : [],
});

const upsertPaymentRecord = async ({
  reservation,
  patientId,
  paymentIntent,
  status = "pending",
  appointmentId,
  session,
}) => {
  const update = {
    reservationId: reservation._id,
    appointmentId,
    patientId,
    doctorId: reservation.doctorId,
    amount: reservation.amount,
    currency: reservation.currency,
    paymentMethod: "card",
    status,
    paymentIntentId: paymentIntent?.id,
    transactionId: paymentIntent?.id,
    paymentGateway: "stripe",
    paymentDetails: paymentIntent ? buildPaymentDetails(paymentIntent) : {},
  };

  if (status === "completed") {
    update.paidAt = new Date();
  }

  return Payment.findOneAndUpdate(
    { reservationId: reservation._id },
    update,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );
};

exports.createPaymentIntent = async ({ reservationId, userId }) => {
  const patient = await getPatientForUser(userId);

  const reservation = await reservationService.findPendingReservationById({
    reservationId,
    patientId: patient._id,
  });

  if (!reservation) {
    const error = new Error("Reservation not found or expired");
    error.statusCode = 404;
    throw error;
  }

  if (reservation.expiresAt <= new Date()) {
    await reservationService.releaseReservation(reservation._id);
    const error = new Error("Reservation has expired");
    error.statusCode = 410;
    throw error;
  }

  const amount = ensureAmount(reservation.amount);
  const amountInCents = Math.round(amount * 100);

  const existingPayment = await Payment.findOne({
    reservationId: reservation._id,
    status: { $in: ["pending", "completed"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (existingPayment && existingPayment.status === "completed") {
    const error = new Error("Payment already completed for this reservation");
    error.statusCode = 409;
    throw error;
  }

  if (existingPayment?.paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(
      existingPayment.paymentIntentId
    );
    if (intent && intent.status !== "canceled") {
      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        reservationId: reservation._id,
        amount: reservation.amount,
        currency: reservation.currency,
      };
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: (reservation.currency || STRIPE_CURRENCY).toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      reservationId: reservation._id.toString(),
      appointmentCode: reservation.appointmentCode,
      patientId: reservation.patientId.toString(),
      doctorId: reservation.doctorId.toString(),
    },
  });

  await upsertPaymentRecord({
    reservation,
    patientId: reservation.patientId,
    paymentIntent,
    status: "pending",
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    reservationId: reservation._id,
    amount: reservation.amount,
    currency: reservation.currency,
  };
};

const performBooking = async ({ reservationId, reservation, intent, session }) => {
  const queryOptions = session ? { session } : {};

  const freshReservation = await Reservation.findOne({
    _id: reservationId,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  }).session(session || null);

  if (!freshReservation) {
    const error = new Error("Reservation expired before confirmation");
    error.statusCode = 410;
    throw error;
  }

  const alreadyBooked = await Appointment.findOne({
    doctorId: reservation.doctorId,
    appointmentDate: reservation.appointmentDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: { $in: ["scheduled", "confirmed"] },
  }).session(session || null);

  if (alreadyBooked) {
    const error = new Error("Slot already booked");
    error.statusCode = 409;
    throw error;
  }

  const [appointment] = await Appointment.create(
    [
      {
        doctorId: reservation.doctorId,
        patientId: reservation.patientId,
        appointmentDate: reservation.appointmentDate,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: "confirmed",
        reasonForVisit: reservation.reasonForVisit,
        notes: `Booked via Stripe payment ${intent.id}`,
      },
    ],
    queryOptions
  );

  await Reservation.deleteOne({ _id: reservation._id }, queryOptions);

  await upsertPaymentRecord({
    reservation,
    patientId: reservation.patientId,
    paymentIntent: intent,
    status: "completed",
    appointmentId: appointment._id,
    session,
  });

  return appointment;
};

exports.confirmPaymentIntent = async ({
  reservationId,
  paymentIntentId,
  userId,
}) => {
  const patient = await getPatientForUser(userId);

  const reservation = await reservationService.findPendingReservationById({
    reservationId,
    patientId: patient._id,
  });

  if (!reservation) {
    const error = new Error("Reservation not found or expired");
    error.statusCode = 404;
    throw error;
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!intent || intent.status !== "succeeded") {
    const error = new Error("Payment not completed");
    error.statusCode = 400;
    throw error;
  }

  if (
    intent.metadata?.reservationId &&
    intent.metadata.reservationId !== reservationId.toString()
  ) {
    const error = new Error("PaymentIntent does not match reservation");
    error.statusCode = 400;
    throw error;
  }

  if (
    intent.metadata?.appointmentCode &&
    intent.metadata.appointmentCode !== reservation.appointmentCode
  ) {
    const error = new Error("Appointment code validation failed");
    error.statusCode = 400;
    throw error;
  }

  try {
    // Try transaction first (requires replica set)
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const appointment = await performBooking({
        reservationId,
        reservation,
        intent,
        session,
      });
      await session.commitTransaction();
      session.endSession();
      return appointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      // Fallback if transactions are not supported (standalone Mongo)
      if (
        err &&
        typeof err.message === "string" &&
        err.message.includes("Transaction numbers are only allowed on a replica set")
      ) {
        return await performBooking({
          reservationId,
          reservation,
          intent,
          session: null,
        });
      }
      throw err;
    }
  } catch (error) {
    throw error;
  }
};
