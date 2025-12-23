const nodemailer = require("nodemailer");
const { createTransporter } = require("../config/nodemailer");
const {
  welcomeDoctorEmailTemplate,
  welcomePatientEmailTemplate,
  passwordResetEmail,
} = require("../utils/emailTemplates");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: "MAIN APP",
        address: process.env.EMAIL_USER,
      },
      to,
      subject,
      html,
    };
    await transporter.sendMail(mailOptions);
    console.log("email sent");
  } catch (error) {
    console.error("error sending email", error);
    throw error;
  }
};

const sendPatientWelcomeEmail = async (username, email) => {
  const subject = "welcome to my app";
  const html = welcomePatientEmailTemplate(username);
  return sendEmail(email, subject, html);
};
const sendDoctorWelcomeEmail = async (username, email) => {
  const subject = "welcome to my app";
  const html = welcomeDoctorEmailTemplate(username);
  return sendEmail(email, subject, html);
};
const sendResetEmail = async (email, username, resetToken) => {
  const subject = "Reset password";
  const html = passwordResetEmail(username, resetToken);
  return sendEmail(email, subject, html);
};

module.exports = {
  // sendEmail,
  sendPatientWelcomeEmail,
  sendDoctorWelcomeEmail,
  sendResetEmail,
};
