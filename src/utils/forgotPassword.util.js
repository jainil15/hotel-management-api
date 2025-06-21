const formatForgotPasswordMail = (user, token) => {
  return `
<html>
  <body>
    <p>Dear ${user.firstName} </p>
    
    <p>Please click the link below to reset your password:</p>
    <p><a href="${process.env.FRONTEND_URL}/resetpassword?token=${token.token}">Reset Password</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Best regards,</p>
    <p>Onelyk Team</p>
  </body>
</html>
  `;
};

module.exports = { formatForgotPasswordMail };
