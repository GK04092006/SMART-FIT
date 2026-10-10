const nodemailer = require('nodemailer');
const { isBrevoConfigured, sendBrevoEmail } = require('./brevoService');

/**
 * Check if SMTP / Email service or Brevo is configured via environment variables
 */
const isEmailConfigured = () => {
  if (isBrevoConfigured()) return true;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  return Boolean(host && user && pass);
};

/**
 * Generate standard mailto: deep link for desktop / mobile email clients
 */
const generateMailtoLink = ({ to, subject = '', body = '' }) => {
  if (!to) return '';
  const cleanTo = String(to).trim();
  const encSubject = encodeURIComponent(subject || '');
  const encBody = encodeURIComponent(body || '');
  return `mailto:${cleanTo}?subject=${encSubject}&body=${encBody}`;
};

/**
 * Build nodemailer transporter instance
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);

  // If using Gmail SMTP
  if (host.includes('gmail.com') || process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send raw email message (via SMTP / Brevo with 1-Click mailto deep link fallback)
 */
const sendRawEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    return {
      success: false,
      status: 'FAILED',
      error: 'Recipient email address is required',
      directUrl: '',
    };
  }

  const cleanTo = String(to).trim();
  const directUrl = generateMailtoLink({ to: cleanTo, subject, body: text });

  // 1. Unified Brevo Email API
  if (isBrevoConfigured()) {
    try {
      const brevoRes = await sendBrevoEmail({ to: cleanTo, subject, html, text });
      if (brevoRes.success) {
        return { ...brevoRes, directUrl };
      }
      console.warn('[Brevo Email Warning]:', brevoRes.error);
    } catch (e) {
      console.warn('[Brevo Email Error]:', e.message);
    }
  }

  // 2. SMTP / Nodemailer (e.g. Gmail App Password, Outlook, Custom SMTP)
  if (isEmailConfigured()) {
    try {
      const transporter = getTransporter();
      if (!transporter) throw new Error('SMTP credentials incomplete in .env');

      const from =
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        'no-reply@adventurefitness.com';

      const info = await transporter.sendMail({
        from: `"Adventure Management System" <${from}>`,
        to: cleanTo,
        subject,
        text,
        html: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
      });

      return {
        success: true,
        status: 'SENT',
        messageId: info.messageId,
        provider: 'nodemailer-smtp',
        directUrl,
      };
    } catch (error) {
      console.warn('[SMTP Live Error]:', error.message);
      return {
        success: false,
        status: 'FAILED',
        error: error.message || 'Failed to send email via SMTP provider',
        directUrl,
      };
    }
  }

  // Fallback: 1-Click Mailto link ready for browser / mail client
  const mockId = `<simulated-${Date.now()}@adventurefitness.com>`;
  console.log(`[Email Direct Ready -> ${cleanTo}]: ${subject}`);

  return {
    success: true,
    status: 'SENT',
    messageId: mockId,
    provider: 'email-direct-link',
    directUrl,
    simulated: !isEmailConfigured(),
    note: isEmailConfigured()
      ? 'SMTP delivery issue. Use 1-Click Mailto link.'
      : 'Email ready for 1-Click dispatch via mail client.',
  };
};

/**
 * Modern HTML email layout wrapper with Adventure theme
 */
const wrapEmailTemplate = ({ title, bodyHtml, badgeText = 'SMARTFIT ADVENTURE' }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, #059669 0%, #0891b2 100%);">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #ffffff; text-transform: uppercase; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 20px;">
                ${badgeText}
              </span>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 6px 0;">Adventure Management System with Fitness-Based Participant Readiness</p>
              <p style="margin: 0;">Stay safe, stay prepared, and conquer the trail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = {
  isEmailConfigured,
  isConfigured: isEmailConfigured,
  generateMailtoLink,
  sendRawEmail,
  sendEmail: sendRawEmail,
  wrapEmailTemplate,
};
