const nodemailer = require('nodemailer');

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      success: false,
      mode: 'simulated',
      message: 'SMTP is not configured. Email was not sent outside the local demo environment.',
    };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return { success: true, mode: 'smtp' };
};

const sendBookingConfirmationEmail = async ({
  to,
  name,
  itemTitle,
  bookingCode,
  bookingDate,
  totalPrice,
}) => {
  if (!to) {
    return { success: false, message: 'Recipient email is required.' };
  }

  const formattedDate = bookingDate ? new Date(bookingDate).toLocaleString() : 'TBD';
  return sendMail({
    to,
    subject: `Booking confirmed: ${itemTitle}`,
    text: `${name || 'Adventure explorer'}, your booking for ${itemTitle} has been confirmed. Reservation code: ${bookingCode}. Date: ${formattedDate}. Total: ₹${totalPrice || 0}.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #17212b; line-height: 1.6;">
        <h2 style="color: #0f172a;">Booking confirmed</h2>
        <p>Hi ${name || 'adventurer'},</p>
        <p>Your reservation for <strong>${itemTitle}</strong> has been confirmed.</p>
        <ul>
          <li><strong>Booking code:</strong> ${bookingCode}</li>
          <li><strong>Booking date:</strong> ${formattedDate}</li>
          <li><strong>Total:</strong> ₹${totalPrice || 0}</li>
        </ul>
        <p>We look forward to welcoming you on the adventure.</p>
      </div>
    `,
  });
};

const sendContactEmail = async ({ name, email, subject, message }) => {
  const recipient = process.env.SMTP_TO || process.env.SMTP_USER || 'support@fitnessadventure.local';

  return sendMail({
    to: recipient,
    subject: `${subject || 'New contact enquiry'} - ${name || 'Website guest'}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #17212b; line-height: 1.6;">
        <h2 style="color: #0f172a;">New contact form message</h2>
        <p><strong>Name:</strong> ${name || 'Unknown'}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General enquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendBookingConfirmationEmail,
  sendContactEmail,
};