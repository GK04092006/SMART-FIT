const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const CommunicationLog = require('../models/CommunicationLog');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Adventure = require('../models/Adventure');
const { getDBStatus } = require('../config/db');

const { sendRawEmail, wrapEmailTemplate } = require('./emailService');
const { sendRawSms } = require('./smsService');
const { sendRawWhatsapp } = require('./whatsappService');
const { publishNotification } = require('./notificationStream');

/**
 * Helper to record communication logs safely in MongoDB
 */
const logCommunication = async ({
  userId = null,
  channel,
  eventType,
  recipient,
  subject = '',
  message,
  status = 'SENT',
  providerMessageId = '',
  relatedAdventure = null,
  relatedBooking = null,
  relatedIncident = null,
  errorMessage = '',
  metadata = {},
}) => {
  if (!getDBStatus()) return null;

  try {
    return await CommunicationLog.create({
      user: userId,
      channel,
      eventType,
      recipient: recipient || 'Unknown',
      subject,
      message,
      status,
      providerMessageId,
      sentAt: new Date(),
      relatedAdventure,
      relatedBooking,
      relatedIncident,
      errorMessage,
      metadata,
    });
  } catch (err) {
    console.error('[CommunicationLog Error]', err.message);
    return null;
  }
};

/**
 * Helper to create in-app notification in MongoDB
 */
const createInAppNotification = async ({
  userId,
  title,
  message,
  type = 'SYSTEM',
  relatedEntity = '',
  relatedEntityId = '',
  actionUrl = '',
  metadata = {},
}) => {
  if (!userId || !getDBStatus()) return null;

  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      read: false,
      relatedEntity,
      relatedEntityId,
      actionUrl,
      metadata,
    });
    publishNotification(userId, notification);

    // Also record in CommunicationLog for unified visibility
    await logCommunication({
      userId,
      channel: 'IN_APP',
      eventType: type,
      recipient: String(userId),
      subject: title,
      message,
      status: 'SENT',
      relatedAdventure: (relatedEntity === 'Adventure' && mongoose.Types.ObjectId.isValid(relatedEntityId)) ? relatedEntityId : null,
      relatedBooking: (relatedEntity === 'Booking' && mongoose.Types.ObjectId.isValid(relatedEntityId)) ? relatedEntityId : null,
      relatedIncident: (relatedEntity === 'SosIncident' && mongoose.Types.ObjectId.isValid(relatedEntityId)) ? relatedEntityId : null,
      metadata,
    });

    return notification;
  } catch (err) {
    console.error('[InAppNotification Error]', err.message);
    return null;
  }
};

/**
 * Dispatch message through all chosen channels respecting user preferences
 */
const dispatchMultiChannel = async ({
  user,
  eventType,
  title,
  textMessage,
  emailHtml = '',
  channels = null, // if null, auto-determined by user preferences
  isEmergency = false,
  relatedAdventure = null,
  relatedBooking = null,
  relatedIncident = null,
  actionUrl = '',
}) => {
  const results = {
    inApp: null,
    email: null,
    sms: null,
    whatsapp: null,
  };

  const userId = user?._id || user?.id || null;
  const userEmail = user?.email || '';
  const fallbackPhone = user?.emergencyContact?.phone || user?.phone || '+91 98765 43210';
  const smsPhone = (user?.settings?.communication?.sms?.phone || user?.phone || fallbackPhone || '').trim();
  const whatsappPhone = (
    user?.settings?.communication?.whatsapp?.phone ||
    user?.settings?.communication?.sms?.phone ||
    user?.phone ||
    fallbackPhone ||
    ''
  ).trim();
  const prefs = user?.communicationPreferences || {};

  // Channel determination respecting user preferences and admin overrides
  const shouldSendInApp = isEmergency || (channels
    ? channels.includes('IN_APP')
    : prefs.inAppNotifications !== false);
  const shouldSendEmail = isEmergency || (channels
    ? channels.includes('EMAIL')
    : Boolean(userEmail) && prefs.emailNotifications !== false);
  const shouldSendSms = isEmergency || (channels
    ? channels.includes('SMS')
    : Boolean(smsPhone) && (prefs.smsNotifications !== false || user?.settings?.communication?.sms?.enabled !== false));
  const shouldSendWhatsapp = isEmergency || (channels
    ? channels.includes('WHATSAPP')
    : Boolean(whatsappPhone) && (
        prefs.whatsappNotifications !== false ||
        user?.settings?.communication?.whatsapp?.enabled !== false ||
        user?.communicationPreferences?.whatsapp === true
      ));

  // 1. In-App Notification
  if (shouldSendInApp && userId) {
    const inAppDoc = await createInAppNotification({
      userId,
      title,
      message: textMessage,
      type: eventType,
      relatedEntity: relatedAdventure ? 'Adventure' : relatedBooking ? 'Booking' : relatedIncident ? 'SosIncident' : 'System',
      relatedEntityId: String(relatedAdventure || relatedBooking || relatedIncident || ''),
      actionUrl,
    });
    results.inApp = {
      success: Boolean(inAppDoc),
      status: inAppDoc ? 'SENT' : 'FAILED',
      notificationId: inAppDoc?._id || '',
    };
  }

  // 2. Email Channel
  if (shouldSendEmail && userEmail) {
    const finalHtml = emailHtml || wrapEmailTemplate({ title, bodyHtml: `<p>${textMessage.replace(/\n/g, '<br/>')}</p>` });
    const emailRes = await sendRawEmail({
      to: userEmail,
      subject: title,
      text: textMessage,
      html: finalHtml,
    });

    await logCommunication({
      userId,
      channel: 'EMAIL',
      eventType,
      recipient: userEmail,
      subject: title,
      message: textMessage,
      status: emailRes.success ? 'SENT' : (emailRes.status || 'FAILED'),
      providerMessageId: emailRes.messageId || '',
      relatedAdventure,
      relatedBooking,
      relatedIncident,
      errorMessage: emailRes.error || (emailRes.note || ''),
      metadata: { directUrl: emailRes.directUrl || '', email: userEmail },
    });

    results.email = emailRes;
  } else if (shouldSendEmail) {
    results.email = {
      success: false,
      status: 'SKIPPED',
      error: 'Recipient email address is missing',
      directUrl: '',
    };
  }

  // 3. SMS Channel
  if (shouldSendSms && smsPhone) {
    const smsRes = await sendRawSms({
      to: smsPhone,
      message: `[SmartFit Adventure] ${title}\n${textMessage}`,
    });

    await logCommunication({
      userId,
      channel: 'SMS',
      eventType,
      recipient: smsPhone,
      subject: title,
      message: textMessage,
      status: smsRes.success ? 'SENT' : (smsRes.status || 'FAILED'),
      providerMessageId: smsRes.messageId || '',
      relatedAdventure,
      relatedBooking,
      relatedIncident,
      errorMessage: smsRes.error || (smsRes.note || ''),
      metadata: { directUrl: smsRes.directUrl || '', phone: smsPhone },
    });

    results.sms = smsRes;
  } else if (shouldSendSms) {
    results.sms = {
      success: false,
      status: 'SKIPPED',
      error: 'Recipient SMS phone number is missing',
      directUrl: '',
    };
  }

  // 4. WhatsApp Channel
  if (shouldSendWhatsapp && whatsappPhone) {
    const waRes = await sendRawWhatsapp({
      to: whatsappPhone,
      message: `*${title}*\n\n${textMessage}\n\n_Adventure Management System_`,
    });

    await logCommunication({
      userId,
      channel: 'WHATSAPP',
      eventType,
      recipient: whatsappPhone,
      subject: title,
      message: textMessage,
      status: waRes.success ? 'SENT' : (waRes.status || 'FAILED'),
      providerMessageId: waRes.messageId || '',
      relatedAdventure,
      relatedBooking,
      relatedIncident,
      errorMessage: waRes.error || (waRes.note || ''),
      metadata: { directUrl: waRes.directUrl || '', phone: whatsappPhone },
    });

    results.whatsapp = waRes;
  } else if (shouldSendWhatsapp) {
    results.whatsapp = {
      success: false,
      status: 'SKIPPED',
      error: 'Recipient WhatsApp phone number is missing',
      directUrl: '',
    };
  }

  const activeChannels = [];
  if (results.inApp) activeChannels.push('IN_APP');
  if (results.email) activeChannels.push('EMAIL');
  if (results.sms) activeChannels.push('SMS');
  if (results.whatsapp) activeChannels.push('WHATSAPP');
  results.channels = activeChannels;

  return results;
};

// ── Specific Application Event Handlers ─────────────────────────────────────

/**
 * Event A: User Registration Welcome
 */
const sendWelcomeNotification = async (user) => {
  const title = 'Welcome to Adventure Management System! 🏔️';
  const textMessage = `Hi ${user.name},\n\nWelcome to SmartFit Adventure! Your account has been created successfully. Explore exciting wilderness expeditions, assess your fitness readiness, and embark on unforgettable journeys.\n\nHappy exploring!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to <strong>SmartFit Adventure Platform</strong>! We are thrilled to accompany you on your outdoor journeys.</p>
    <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; font-weight: 600; color: #10b981;">Your Adventure Journey Starts Now</p>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Complete your fitness assessment to discover expeditions you are immediately ready for.</p>
    </div>
    <p><a href="${process.env.APP_URL || ''}/fitness/assessment" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">Check Fitness Readiness</a></p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'SYSTEM',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    actionUrl: '/dashboard',
  });
};

/**
 * Event B: Adventure Registration Confirmed
 */
const sendBookingConfirmationNotification = async ({ user, booking, adventure, readinessStatus = 'READY' }) => {
  const advTitle = adventure?.title || booking.itemDetails?.title || 'Expedition';
  const advDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD';
  const advLocation = adventure?.location || booking.itemDetails?.location || 'Base Camp';
  const advDifficulty = adventure?.difficulty || 'Moderate';
  const bookingCode = booking.ticketCode || `ADV-${String(booking._id).slice(-4).toUpperCase()}`;

  const title = `✅ Adventure Registration Confirmed — ${bookingCode}`;
  const textMessage = `✅ Adventure Registration Confirmed\n\nParticipant: ${user.name}\nAdventure: ${advTitle}\nDate: ${advDate}\nLocation: ${advLocation}\nDifficulty: ${advDifficulty}\nBooking ID: ${bookingCode}\nReadiness Status: ${readinessStatus}\n\nImportant Preparation:\n• Bring hydration packs & trekking footwear\n• Check reporting time & route schedule\n• Stay conditioned with active training`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your registration for <strong>${advTitle}</strong> is confirmed!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #0f172a; border-radius: 8px; overflow: hidden;">
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Booking ID</td><td style="padding: 10px 16px; font-weight: 700; color: #38bdf8;">${bookingCode}</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Adventure</td><td style="padding: 10px 16px; font-weight: 600; color: #ffffff;">${advTitle}</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Date</td><td style="padding: 10px 16px; color: #f8fafc;">${advDate}</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Location</td><td style="padding: 10px 16px; color: #f8fafc;">${advLocation}</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Difficulty</td><td style="padding: 10px 16px; color: #f59e0b; font-weight: 600;">${advDifficulty}</td></tr>
      <tr><td style="padding: 10px 16px; color: #94a3b8;">Readiness Status</td><td style="padding: 10px 16px; color: #10b981; font-weight: 700;">${readinessStatus}</td></tr>
    </table>
    <p><strong>Important Preparation:</strong></p>
    <ul>
      <li>Carry at least 2L of water and electrolyte packs</li>
      <li>Wear rugged ankle-support hiking shoes</li>
      <li>Keep your QR Ticket ready on your phone for trailhead check-in</li>
    </ul>
    <p style="margin-top: 24px;">
      <a href="/bookings/${booking._id}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">View Ticket & QR Code</a>
    </p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'BOOKING',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    relatedBooking: booking._id,
    actionUrl: `/bookings/${booking._id}`,
  });
};

/**
 * Event C: READY Status Notification
 */
const sendReadyStatusNotification = async ({ user, adventure }) => {
  const advTitle = adventure?.title || 'Upcoming Adventure';
  const title = `✅ You are READY for ${advTitle}`;
  const textMessage = `Great news, ${user.name}! Your current fitness evaluation confirms you are READY for ${advTitle}. You meet all endurance, strength, and stamina thresholds. You can proceed with registration!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="color: #10b981; font-size: 18px; font-weight: 700;">✅ You are READY for ${advTitle}!</p>
    <p>Your fitness scores meet or exceed the required expedition thresholds. You have built the required endurance reserve and strength output to tackle this route safely.</p>
    <p style="margin-top: 20px;">
      <a href="/adventures/${adventure?._id}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">Continue to Registration</a>
    </p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'READINESS',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    actionUrl: `/adventures/${adventure?._id}/readiness`,
  });
};

/**
 * Event D: NOT READY Status Notification
 */
const sendNotReadyStatusNotification = async ({ user, adventure, weakAreas = [], recommendedTraining = [] }) => {
  const advTitle = adventure?.title || 'Target Adventure';
  const title = `❌ You are currently NOT READY for ${advTitle}`;
  const weakAreasStr = weakAreas.length > 0 ? weakAreas.join(', ') : 'Endurance, Strength';
  const trainingStr = recommendedTraining.length > 0 ? recommendedTraining.join('\n• ') : 'Hill Walking, Trail Running, Stair Training';

  const textMessage = `❌ You are currently NOT READY for this adventure.\n\nAdventure: ${advTitle}\n\nWeak Areas:\n${weakAreasStr}\n\nRecommended Training:\n• ${trainingStr}\n\nFollow your customized preparation plan to build the required readiness score before booking!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="color: #ef4444; font-size: 17px; font-weight: 700;">❌ You are currently NOT READY for ${advTitle}</p>
    <p>Safety is our highest priority. Based on your latest fitness assessment, you currently do not meet the minimum requirements for this expedition.</p>
    <div style="background: #0f172a; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
      <strong style="color: #f87171;">Weak Areas Identified:</strong>
      <p style="margin: 4px 0 0 0; color: #cbd5e1;">${weakAreasStr}</p>
    </div>
    <div style="background: #0f172a; border-left: 4px solid #0891b2; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
      <strong style="color: #38bdf8;">Recommended Training Plan:</strong>
      <ul style="margin: 6px 0 0 0; padding-left: 20px; color: #cbd5e1;">
        ${(recommendedTraining.length > 0 ? recommendedTraining : ['Hill Walking', 'Trail Running', 'Stair Training']).map((t) => `<li>${t}</li>`).join('')}
      </ul>
    </div>
    <p style="margin-top: 24px;">
      <a href="/fitness" style="background: #0891b2; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; margin-right: 12px;">Start Training Plan</a>
      <a href="/fitness/assessment" style="background: #334155; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700;">Retake Assessment</a>
    </p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'READINESS',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    actionUrl: `/adventures/${adventure?._id}/readiness`,
  });
};

/**
 * Event E: Adventure Reminder (7 days, 3 days, 1 day, Event day)
 */
const sendAdventureReminderNotification = async ({ user, booking, adventure, reminderDays }) => {
  const advTitle = adventure?.title || booking.itemDetails?.title || 'Adventure Expedition';
  const label = reminderDays === 0 ? 'TODAY is Event Day! 🚩' : `${reminderDays} Day${reminderDays > 1 ? 's' : ''} until your Adventure! ⏳`;
  const title = `Trip Reminder: ${label} — ${advTitle}`;

  const textMessage = `Reminder: ${label}\n\nHi ${user.name},\nYour expedition "${advTitle}" is coming up ${reminderDays === 0 ? 'today' : `in ${reminderDays} days`}.\n\n• Location: ${adventure?.location || booking.itemDetails?.location || 'Trailhead'}\n• Schedule: ${adventure?.schedule || 'Please report at scheduled time'}\n• Ticket: ${booking.ticketCode || 'View in My Bookings'}\n\nBe prepared and stay hydrated!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <h3 style="color: #38bdf8; margin: 0 0 10px 0;">${label}</h3>
    <p>Your expedition <strong>${advTitle}</strong> is scheduled ${reminderDays === 0 ? 'for today' : `in ${reminderDays} days`}.</p>
    <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin: 18px 0; border: 1px solid #334155;">
      <p style="margin: 0 0 6px 0;"><strong>Trailhead:</strong> ${adventure?.location || 'Basecamp'}</p>
      <p style="margin: 0 0 6px 0;"><strong>Reporting:</strong> ${adventure?.schedule || '06:00 AM'}</p>
      <p style="margin: 0;"><strong>Ticket Code:</strong> <span style="color: #10b981; font-weight: 700;">${booking.ticketCode}</span></p>
    </div>
    <p><a href="/bookings/${booking._id}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">View Ticket & QR Code</a></p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'REMINDER',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    relatedBooking: booking._id,
    actionUrl: `/bookings/${booking._id}`,
  });
};

/**
 * Event F: Event Schedule Change
 */
const sendScheduleChangeNotification = async ({ user, participants, adventure, changes, changesSummary }) => {
  const advTitle = adventure?.title || 'Adventure Event';
  let formattedChanges = changesSummary;
  if (!formattedChanges && changes && typeof changes === 'object') {
    formattedChanges = Object.entries(changes).map(([k, v]) => `• ${k}: ${v}`).join('\n');
  } else if (!formattedChanges) {
    formattedChanges = 'Schedule or reporting details have been updated by the organizer.';
  }

  const recipientList = participants && Array.isArray(participants) ? participants : (user ? [user] : []);
  const title = `⚠️ Schedule Update for ${advTitle}`;
  const dispatchedResults = [];

  for (const recipient of recipientList) {
    if (!recipient) continue;
    const textMessage = `Attention ${recipient.name},\n\nThe schedule or details for "${advTitle}" have been updated by the organizer:\n\n${formattedChanges}\n\nPlease review your updated itinerary and adjust travel arrangements accordingly.`;

    const bodyHtml = `
      <p>Hi <strong>${recipient.name}</strong>,</p>
      <p style="color: #f59e0b; font-size: 16px; font-weight: 700;">⚠️ Event Schedule / Route Update</p>
      <p>The organizer has updated the event schedule for <strong>${advTitle}</strong>.</p>
      <div style="background: #0f172a; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
        <strong style="color: #fbbf24;">Summary of Changes:</strong>
        <p style="margin: 6px 0 0 0; color: #cbd5e1; white-space: pre-line;">${formattedChanges}</p>
      </div>
      <p><a href="/event-schedule" style="background: #f59e0b; color: #000; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700;">View Updated Schedule</a></p>
    `;

    const res = await dispatchMultiChannel({
      user: recipient,
      eventType: 'EVENT_UPDATE',
      title,
      textMessage,
      emailHtml: wrapEmailTemplate({ title, bodyHtml }),
      relatedAdventure: adventure?._id,
      actionUrl: `/event-schedule`,
    });
    dispatchedResults.push(res);
  }

  return {
    dispatched: dispatchedResults.length,
    results: dispatchedResults,
  };
};

/**
 * Event G: Event Cancellation
 */
const sendCancellationNotification = async ({ user, adventure, reason = 'Adverse conditions or logistical adjustment' }) => {
  const advTitle = adventure?.title || 'Adventure Expedition';
  const title = `🚨 Adventure Cancelled: ${advTitle}`;
  const textMessage = `Important Notice for ${user.name},\n\nThe expedition "${advTitle}" has been CANCELLED by the organizer.\n\nReason: ${reason}\n\nAny reservation fees will be processed for immediate refund or credit to your account. We apologize for any inconvenience.`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="color: #ef4444; font-size: 17px; font-weight: 700;">🚨 Adventure Event Cancelled</p>
    <p>We regret to inform you that <strong>${advTitle}</strong> has been cancelled by the expedition organizers.</p>
    <div style="background: #0f172a; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
      <strong style="color: #f87171;">Reason for Cancellation:</strong>
      <p style="margin: 6px 0 0 0; color: #cbd5e1;">${reason}</p>
    </div>
    <p>Our operations team will contact you regarding rescheduling options or full refunds.</p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'CANCELLATION',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    actionUrl: `/booking`,
  });
};

/**
 * Event H: QR Trailhead Check-in
 */
const sendCheckInConfirmationNotification = async ({ user, booking, checkpointName = 'Trailhead Start' }) => {
  const advTitle = booking.itemDetails?.title || 'Adventure';
  const title = `🎯 Check-in Confirmed: ${checkpointName}`;
  const textMessage = `Check-in successful! Welcome ${user.name}. You have cleared QR verification at ${checkpointName} for ${advTitle}. Have a safe and thrilling expedition!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="color: #10b981; font-size: 16px; font-weight: 700;">🎯 Trailhead Check-in Confirmed</p>
    <p>Your QR ticket has been verified at <strong>${checkpointName}</strong> for <strong>${advTitle}</strong>.</p>
    <p>Your team guide is tracking active participants. Stay on marked trails and keep emergency numbers handy.</p>
    <p><a href="/events/${booking._id}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">Open Live Event GPS</a></p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'CHECKIN',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedBooking: booking._id,
    actionUrl: `/events/${booking._id}`,
  });
};

/**
 * Event I: SOS Emergency Alert (High Priority)
 */
const sendSosEmergencyNotification = async ({
  incident,
  triggeredByUser,
  adventureTitle = 'Active Adventure',
  incidentType = 'Medical / Distress Emergency',
  locationCoordinates = 'GPS Active',
  sosMessage = 'Assistance requested immediately',
}) => {
  const participantName = triggeredByUser?.name || triggeredByUser?.email || 'Participant';
  const timeStr = new Date().toLocaleTimeString();

  const title = `🚨 EMERGENCY ALERT: ${participantName} on ${adventureTitle}`;
  const textMessage = `🚨 EMERGENCY ALERT\n\nParticipant: ${participantName}\nAdventure: ${adventureTitle}\nIncident: ${incidentType}\nTime: ${timeStr}\nLocation: ${locationCoordinates}\nMessage: ${sosMessage}\n\nImmediate response required!`;

  const bodyHtml = `
    <div style="background: #450a0a; border: 2px solid #ef4444; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <h2 style="color: #f87171; margin: 0 0 10px 0; font-size: 20px;">🚨 CRITICAL EMERGENCY ALERT</h2>
      <p style="margin: 0; color: #fca5a5; font-weight: 600;">Immediate response team dispatch required.</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 8px 0; color: #94a3b8;">Participant</td><td style="font-weight: 700; color: #ffffff;">${participantName}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Adventure</td><td style="font-weight: 600; color: #ffffff;">${adventureTitle}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Incident Type</td><td style="color: #ef4444; font-weight: 700;">${incidentType}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Trigger Time</td><td style="color: #ffffff;">${timeStr}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">GPS Coordinates</td><td style="color: #38bdf8; font-weight: 700;">${locationCoordinates}</td></tr>
      <tr><td style="padding: 8px 0; color: #94a3b8;">Message</td><td style="color: #ffffff;">${sosMessage}</td></tr>
    </table>
    <p><a href="/safety" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 800; display: inline-block;">Open Incident Safety Console</a></p>
  `;

  // Find guides, organizers, admins to notify
  const responders = await User.find({
    role: { $in: ['admin', 'organizer', 'guide'] },
  }).select('name email phone communicationPreferences role');

  const dispatchPromises = responders.map((responder) =>
    dispatchMultiChannel({
      user: responder,
      eventType: 'SOS',
      title,
      textMessage,
      emailHtml: wrapEmailTemplate({ title, bodyHtml, badgeText: 'EMERGENCY DISPATCH' }),
      isEmergency: true,
      relatedIncident: incident?._id || incident?.incidentId,
      actionUrl: `/safety`,
    })
  );

  // If user has an emergency contact phone configured, alert them as well
  if (triggeredByUser?.emergencyContact?.phone) {
    dispatchPromises.push(
      sendRawSms({
        to: triggeredByUser.emergencyContact.phone,
        message: `EMERGENCY ALERT: Your contact ${participantName} triggered SOS on ${adventureTitle} at ${timeStr}. Field guides have been dispatched.`,
      }).then((smsRes) =>
        logCommunication({
          userId: triggeredByUser._id,
          channel: 'SMS',
          eventType: 'SOS',
          recipient: triggeredByUser.emergencyContact.phone,
          subject: 'Emergency Contact Alert',
          message: textMessage,
          status: smsRes.success ? 'SENT' : 'FAILED',
          relatedIncident: incident?._id || incident?.incidentId,
          errorMessage: smsRes.error || '',
        })
      )
    );
  }

  return await Promise.all(dispatchPromises);
};

/**
 * Event J: Adventure Completion & Rewards
 */
const sendAdventureCompletionNotification = async ({
  user,
  booking,
  adventure,
  duration = '1 Day',
  checkpointsCompleted = 5,
  xpEarned = 250,
  badge = 'Trail Conqueror',
}) => {
  const advTitle = adventure?.title || booking.itemDetails?.title || 'Adventure Expedition';
  const title = `Adventure Completed ✅ — ${advTitle}`;
  const textMessage = `Adventure Completed ✅\n\nCongratulations ${user.name}!\nYou have conquered ${advTitle}.\n\n• Duration: ${duration}\n• Checkpoints: ${checkpointsCompleted} Cleared\n• XP Earned: +${xpEarned} XP\n• Badge Awarded: ${badge}\n\nReview your achievement badge in your profile!`;

  const bodyHtml = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <div style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2)); border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <h2 style="color: #10b981; margin: 0 0 6px 0;">Adventure Completed ✅</h2>
      <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">${advTitle}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #0f172a; border-radius: 8px;">
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Duration</td><td style="padding: 10px 16px; color: #ffffff;">${duration}</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">Checkpoints</td><td style="padding: 10px 16px; color: #ffffff;">${checkpointsCompleted} Completed</td></tr>
      <tr style="border-bottom: 1px solid #334155;"><td style="padding: 10px 16px; color: #94a3b8;">XP Earned</td><td style="padding: 10px 16px; color: #f59e0b; font-weight: 700;">+${xpEarned} XP</td></tr>
      <tr><td style="padding: 10px 16px; color: #94a3b8;">Badge Earned</td><td style="padding: 10px 16px; color: #38bdf8; font-weight: 700;">🎖️ ${badge}</td></tr>
    </table>
    <p><a href="/engagement" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 700;">View XP & Leaderboard</a></p>
  `;

  return await dispatchMultiChannel({
    user,
    eventType: 'COMPLETION',
    title,
    textMessage,
    emailHtml: wrapEmailTemplate({ title, bodyHtml }),
    relatedAdventure: adventure?._id,
    relatedBooking: booking._id,
    actionUrl: `/engagement`,
  });
};

/**
 * Event K: Admin Announcement Dispatcher
 */
const sendAdminAnnouncement = async ({
  title,
  message,
  targetAudience = 'ALL', // 'ALL' | 'ADVENTURE' | 'ROLE' | 'SPECIFIC'
  targetAdventureId = null,
  targetRole = null,
  targetUserId = null,
  channels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
}) => {
  let recipients = [];

  if (targetAudience === 'ADVENTURE' && targetAdventureId) {
    const advObjId = mongoose.Types.ObjectId.isValid(targetAdventureId)
      ? new mongoose.Types.ObjectId(targetAdventureId)
      : null;
    const refValues = [String(targetAdventureId)];
    if (advObjId) refValues.push(advObjId);

    const advDoc = advObjId ? await Adventure.findById(advObjId) : null;
    const bookingQuery = {
      $or: [
        { itemRef: { $in: refValues } },
        ...(advDoc ? [{ 'itemDetails.title': advDoc.title }] : []),
      ],
      status: { $in: ['Confirmed', 'Pending'] },
    };

    const bookings = await Booking.find(bookingQuery).populate('user');
    recipients = bookings.map((b) => b.user).filter(Boolean);
  } else if (targetAudience === 'ROLE' && targetRole) {
    recipients = await User.find({ role: targetRole });
  } else if (targetAudience === 'SPECIFIC' && targetUserId) {
    const specificUser = await User.findById(targetUserId);
    if (specificUser) recipients = [specificUser];
  } else if (targetAudience === 'ALL') {
    // Default: All registered users
    recipients = await User.find({});
  }

  // Deduplicate users
  const uniqueUsers = Array.from(new Map(recipients.map((u) => [String(u._id), u])).values());

  const results = await Promise.all(
    uniqueUsers.map((user) =>
      dispatchMultiChannel({
        user,
        eventType: 'ANNOUNCEMENT',
        title: `📢 ${title}`,
        textMessage: message,
        emailHtml: wrapEmailTemplate({
          title: `Announcement: ${title}`,
          bodyHtml: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
          badgeText: 'OFFICIAL ANNOUNCEMENT',
        }),
        channels,
        actionUrl: '/dashboard',
      })
    )
  );

  const whatsappLinks = uniqueUsers
    .map((u, idx) => {
      const waResult = results[idx]?.whatsapp;
      const phone = u.phone || u.emergencyContact?.phone;
      if (!phone && !waResult?.directUrl) return null;
      return {
        userId: u._id,
        name: u.name,
        phone: phone || '',
        directUrl: waResult?.directUrl || '',
        status: waResult?.status || (waResult?.success ? 'SENT' : 'PENDING'),
      };
    })
    .filter(Boolean);

  const emailLinks = uniqueUsers
    .map((u, idx) => {
      const emResult = results[idx]?.email;
      if (!u.email && !emResult?.directUrl) return null;
      return {
        userId: u._id,
        name: u.name,
        email: u.email || '',
        directUrl: emResult?.directUrl || '',
        status: emResult?.status || (emResult?.success ? 'SENT' : 'PENDING'),
      };
    })
    .filter(Boolean);

  const smsLinks = uniqueUsers
    .map((u, idx) => {
      const smsResult = results[idx]?.sms;
      const phone = u.phone || u.emergencyContact?.phone;
      if (!phone && !smsResult?.directUrl) return null;
      return {
        userId: u._id,
        name: u.name,
        phone: phone || '',
        directUrl: smsResult?.directUrl || '',
        status: smsResult?.status || (smsResult?.success ? 'SENT' : 'PENDING'),
      };
    })
    .filter(Boolean);

  return {
    totalRecipients: uniqueUsers.length,
    results,
    whatsappLinks,
    emailLinks,
    smsLinks,
  };
};

module.exports = {
  createInAppNotification,
  logCommunication,
  dispatchMultiChannel,
  sendWelcomeNotification,
  sendBookingConfirmationNotification,
  sendReadyStatusNotification,
  sendNotReadyStatusNotification,
  sendAdventureReminderNotification,
  sendScheduleChangeNotification,
  sendCancellationNotification,
  sendCheckInConfirmationNotification,
  sendSosEmergencyNotification,
  sendAdventureCompletionNotification,
  sendAdminAnnouncement,
};
