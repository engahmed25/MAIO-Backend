const paymentService = require("../services/payment.service");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res
        .status(400)
        .json({ success: false, message: "reservationId is required" });
    }

    const result = await paymentService.createPaymentIntent({
      reservationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.confirmPaymentIntent = async (req, res) => {
  try {
    const { reservationId, paymentIntentId } = req.body;

    if (!reservationId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "reservationId and paymentIntentId are required",
      });
    }

    const appointment = await paymentService.confirmPaymentIntent({
      reservationId,
      paymentIntentId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
