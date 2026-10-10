/**
 * Brevo Unified Communication Service
 * Handles transactional Email, SMS, and WhatsApp dispatch via Brevo REST APIs v3.
 * https://developers.brevo.com
 */

const isBrevoConfigured = () => {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
};

/**
 * 1. Brevo Transactional Email
 * POST https://api.brevo.com/v3/smtp/email
 */
const sendBrevoEmail = async ({ to, toName = '', subject, html, text }) => {
  if (!isBrevoConfigured()) {
    return { success: false, status: 'FAILED', error: 'BREVO_API_KEY is not configured' };
  }

  const apiKey = process.env.BREVO_API_KEY.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@adventurefitness.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Adventure Management System';

  try {
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name: toName || to.split('@')[0] }],
      subject: subject || 'Adventure Management Notification',
      htmlContent: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
    };

    if (text) payload.textContent = text;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        status: 'SENT',
        messageId: data.messageId || `brevo-mail-${Date.now()}`,
        provider: 'brevo-email',
      };
    } else {
      return {
        success: false,
        status: 'FAILED',
        error: data.message || `Brevo Email API HTTP ${res.status}`,
        provider: 'brevo-email',
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      error: `Brevo Email network error: ${error.message}`,
      provider: 'brevo-email',
    };
  }
};

/**
 * 2. Brevo Transactional SMS
 * POST https://api.brevo.com/v3/transactionalSMS/send
 */
const sendBrevoSms = async ({ to, message, sender }) => {
  if (!isBrevoConfigured()) {
    return { success: false, status: 'FAILED', error: 'BREVO_API_KEY is not configured' };
  }

  const apiKey = process.env.BREVO_API_KEY.trim();
  // Sender name must be alphanumeric and max 11 characters
  const cleanSender = (sender || process.env.BREVO_SMS_SENDER || 'Adventure').replace(/[^a-zA-Z0-9]/g, '').substring(0, 11) || 'Adventure';
  // Normalize phone number (digits only, e.g. 919876543210)
  const cleanPhone = String(to).replace(/[^0-9]/g, '');

  try {
    const payload = {
      sender: cleanSender,
      recipient: cleanPhone,
      content: message,
    };

    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        status: 'SENT',
        messageId: String(data.reference || data.messageId || `brevo-sms-${Date.now()}`),
        provider: 'brevo-sms',
      };
    } else {
      return {
        success: false,
        status: 'FAILED',
        error: data.message || `Brevo SMS API HTTP ${res.status}`,
        provider: 'brevo-sms',
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      error: `Brevo SMS network error: ${error.message}`,
      provider: 'brevo-sms',
    };
  }
};

/**
 * 3. Brevo Transactional WhatsApp
 * POST https://api.brevo.com/v3/whatsapp/sendMessage
 */
const sendBrevoWhatsapp = async ({ to, message, templateName = null, templateParams = {} }) => {
  if (!isBrevoConfigured()) {
    return { success: false, status: 'FAILED', error: 'BREVO_API_KEY is not configured' };
  }

  const apiKey = process.env.BREVO_API_KEY.trim();
  const cleanPhone = String(to).replace(/[^0-9]/g, '');

  try {
    const payload = {
      recipient: cleanPhone,
    };

    if (templateName) {
      payload.template = {
        name: templateName,
        language: 'en',
        ...templateParams,
      };
    } else {
      payload.text = message;
    }

    const res = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        status: 'SENT',
        messageId: data.messageId || `brevo-wa-${Date.now()}`,
        provider: 'brevo-whatsapp',
      };
    } else {
      return {
        success: false,
        status: 'FAILED',
        error: data.message || `Brevo WhatsApp API HTTP ${res.status}`,
        provider: 'brevo-whatsapp',
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      error: `Brevo WhatsApp network error: ${error.message}`,
      provider: 'brevo-whatsapp',
    };
  }
};

module.exports = {
  isBrevoConfigured,
  sendBrevoEmail,
  sendBrevoSms,
  sendBrevoWhatsapp,
};
