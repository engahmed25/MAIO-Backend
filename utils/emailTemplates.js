exports.welcomeDoctorEmailTemplate = (username) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MAIO</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We’re excited to have you join MAIO as a healthcare professional.</p>
          <p>You can now:</p>
          <ul>
            <li>Manage your availability</li>
            <li>Receive and manage appointments</li>
            <li>Communicate with patients</li>
            <li>Upload and review medical documents</li>
            <li>Collaborate with other doctors</li>
          </ul>
          <p>If you need any help, our support team is always here for you.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MAIO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.welcomePatientEmailTemplate = (username) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MAIO</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Thank you for joining MAIO. We're happy to support your healthcare journey.</p>
          <p>You can now:</p>
          <ul>
            <li>Book medical appointments</li>
            <li>View doctor profiles and availability</li>
            <li>Upload and manage your medical documents</li>
            <li>Communicate with your doctors</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MAIO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.passwordResetEmail = (username, resetToken) => {
  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/reset-password?token=${resetToken}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 5 hours. If you didn't request this password reset, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Social Media API. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
