exports.welcomeDoctorEmailTemplate = (username) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #EFF6FF;
      margin: 0;
      padding: 0;
      color: #1E293B;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #DBEAFE;
    }
    .header {
      background: #2563EB;
      color: #FFFFFF;
      padding: 24px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    h1, h2 {
      margin-top: 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #64748B;
      background: #F8FAFC;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to MAIO</h1>
      <p>Your Medical Practice Companion</p>
    </div>

    <div class="content">
      <h2>Hello Dr. ${username},</h2>
      <p>We’re honored to have you join <strong>MAIO</strong> as part of our healthcare professional network.</p>

      <p>With MAIO, you can:</p>
      <ul>
        <li>Manage your availability with ease</li>
        <li>Receive and organize appointments</li>
        <li>Communicate securely with patients</li>
        <li>Review and upload medical documents</li>
        <li>Collaborate with fellow healthcare professionals</li>
      </ul>

      <p>If you need assistance, our medical support team is always ready to help.</p>
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
    body {
      font-family: Arial, sans-serif;
      background-color: #EFF6FF;
      margin: 0;
      padding: 0;
      color: #1E293B;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 8px;
      border: 1px solid #DBEAFE;
      overflow: hidden;
    }
    .header {
      background: #2563EB;
      color: #FFFFFF;
      padding: 24px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #64748B;
      background: #F8FAFC;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to MAIO</h1>
      <p>Your Healthcare, Simplified</p>
    </div>

    <div class="content">
      <h2>Hello ${username},</h2>
      <p>Thank you for joining <strong>MAIO</strong>. We’re here to support you on your healthcare journey.</p>

      <p>You can now:</p>
      <ul>
        <li>Book medical appointments easily</li>
        <li>Explore doctor profiles and schedules</li>
        <li>Upload and manage your medical records</li>
        <li>Communicate securely with your doctors</li>
      </ul>

      <p>Your health and privacy are always our top priority.</p>
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
    body {
      font-family: Arial, sans-serif;
      background-color: #EFF6FF;
      margin: 0;
      padding: 0;
      color: #1E293B;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 8px;
      border: 1px solid #DBEAFE;
      overflow: hidden;
    }
    .header {
      background: #2563EB;
      color: #FFFFFF;
      padding: 24px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #2563EB;
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .warning {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #64748B;
      background: #F8FAFC;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>

    <div class="content">
      <h2>Hello ${username},</h2>
      <p>We received a request to reset your password.</p>

      <center>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </center>

      <p>If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563EB;">${resetUrl}</p>

      <div class="warning">
        <strong>Security Notice:</strong>
        This link will expire in 5 hours. If you didn’t request this, please ignore this email.
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} MAIO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};
