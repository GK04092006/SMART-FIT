const express = require('express');
const router = express.Router();
const { sendBookingConfirmationEmail, sendContactEmail } = require('../utils/mailer');

router.post('/booking-confirmation', async (req, res) => {
  try {
    const { to, name, itemTitle, bookingCode, bookingDate, totalPrice } = req.body;

    if (!to || !itemTitle) {
      return res.status(400).json({ success: false, message: 'Recipient email and booking title are required.' });
    }

    const result = await sendBookingConfirmationEmail({
      to,
      name,
      itemTitle,
      bookingCode,
      bookingDate,
      totalPrice,
    });

    if (result.success) {
      return res.json({ success: true, message: 'Booking confirmation email sent successfully.' });
    }

    return res.json({
      success: true,
      message: result.message || 'Email service is not configured, but the booking flow continues in demo mode.',
      demoMode: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const result = await sendContactEmail({ name, email, subject, message });

    if (result.success) {
      return res.json({ success: true, message: 'Your message has been sent.' });
    }

    return res.json({
      success: true,
      message: result.message || 'Email service is not configured, but the contact form accepted your request in demo mode.',
      demoMode: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;