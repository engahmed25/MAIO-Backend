const dotenv = require("dotenv");
dotenv.config();

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
}

module.exports = require("stripe")(stripeSecret);
