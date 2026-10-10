const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect, adminOnly, organizerOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Adventure = require('../models/Adventure');
const Notification = require('../models/Notification');
const CommunicationLog = require('../models/CommunicationLog');
const { getDBStatus } = require('../config/db');

const {
  dispatchMultiChannel,
  sendAdminAnnouncement,
  sendAdventureReminderNotification,
} = require('../services/notificationService');
const { generateWhatsAppLink, normalizePhoneNumber } = require('../services/whatsappService');
const { generateMailtoLink } = require('../services/emailService');
const { generateSmsLink } = require('../services/smsService');

const allowedChannels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'];
const allowedAnnouncementRoles = ['user', 'guide', 'trainer', 'organizer'];

// @desc  Get message recipients (Admin & Organizer)
// @route GET /api/communication/recipients
router.get('/recipients', protect, async (req, res) => {
  try {
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to message users' });
    }

    const recipients = await User.find({ role: { $in: ['user', 'guide', 'trainer', 'organizer'] } })
      .select('name email role phone emergencyContact')
      .sort({ name: 1, email: 1 });

    return res.json({ success: true, recipients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get participants of a specific adventure for direct WhatsApp group / individual dispatch
// @route GET /api/communication/adventure-participants/:id
router.get('/adventure-participants/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'organizer', 'guide'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const adventureId = req.params.id;
    const advDoc = mongoose.isValidObjectId(adventureId) ? await Adventure.findById(adventureId) : null;
    const refValues = [String(adventureId)];
    if (mongoose.isValidObjectId(adventureId)) refValues.push(new mongoose.Types.ObjectId(adventureId));

    const bookings = await Booking.find({
      $or: [
        { itemRef: { $in: refValues } },
        ...(advDoc ? [{ 'itemDetails.title': advDoc.title }] : []),
      ],
      status: { $in: ['Confirmed', 'Pending'] },
    }).populate('user', 'name email phone role emergencyContact');

    const participants = bookings
      .map((b) => {
        if (!b.user) return null;
        const phone = b.user.phone || b.user.emergencyContact?.phone || '';
        return {
          userId: b.user._id,
          name: b.user.name,
          email: b.user.email,
          phone,
          cleanPhone: normalizePhoneNumber(phone),
          ticketCode: b.ticketCode || `ADV-${String(b._id).slice(-4).toUpperCase()}`,
          bookingStatus: b.status,
          bookingDate: b.bookingDate,
        };
      })
      .filter(Boolean);

    // Deduplicate participants
    const uniqueParticipants = Array.from(new Map(participants.map((p) => [String(p.userId), p])).values());

    return res.json({
      success: true,
      adventure: advDoc ? { _id: advDoc._id, title: advDoc.title, location: advDoc.location } : null,
      totalParticipants: uniqueParticipants.length,
      participants: uniqueParticipants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Generate direct WhatsApp link
// @route POST /api/communication/whatsapp-link
router.post('/whatsapp-link', protect, (req, res) => {
  const { phone, message } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  const url = generateWhatsAppLink({ phone, message });
  return res.json({ success: true, url, cleanPhone: normalizePhoneNumber(phone) });
});

// @desc  Generate direct Mailto link
// @route POST /api/communication/email-link
router.post('/email-link', protect, (req, res) => {
  const { to, subject, body } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }
  const url = generateMailtoLink({ to, subject, body });
  return res.json({ success: true, url });
});

// @desc  Generate direct SMS link
// @route POST /api/communication/sms-link
router.post('/sms-link', protect, (req, res) => {
  const { phone, message } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  const url = generateSmsLink({ phone, message });
  return res.json({ success: true, url, cleanPhone: normalizePhoneNumber(phone) });
});

// @desc  Get current user's communication preferences
// @route GET /api/communication/preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('communicationPreferences email phone');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const defaultPrefs = {
      emailNotifications: true,
      smsNotifications: true,
      whatsappNotifications: false,
      inAppNotifications: true,
      adventureUpdates: {
        bookingConfirmations: true,
        eventReminders: true,
        scheduleChanges: true,
        adventureCancellation: true,
      },
      fitnessUpdates: {
        readinessResult: true,
        trainingRecommendations: true,
        workoutReminders: true,
      },
      safetyAlerts: {
        emergencySos: true,
      },
    };

    const preferences = {
      ...defaultPrefs,
      ...(user.communicationPreferences || {}),
      // Safety alerts cannot be disabled
      safetyAlerts: { emergencySos: true },
    };

    return res.json({
      success: true,
      preferences,
      email: user.email,
      phone: user.phone || '',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Update user's communication preferences
// @route PUT /api/communication/preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const incoming = req.body || {};

    user.communicationPreferences = {
      emailNotifications: incoming.emailNotifications !== undefined ? Boolean(incoming.emailNotifications) : true,
      smsNotifications: incoming.smsNotifications !== undefined ? Boolean(incoming.smsNotifications) : true,
      whatsappNotifications: incoming.whatsappNotifications !== undefined ? Boolean(incoming.whatsappNotifications) : false,
      inAppNotifications: incoming.inAppNotifications !== undefined ? Boolean(incoming.inAppNotifications) : true,
      adventureUpdates: {
        bookingConfirmations: incoming.adventureUpdates?.bookingConfirmations !== undefined ? Boolean(incoming.adventureUpdates.bookingConfirmations) : true,
        eventReminders: incoming.adventureUpdates?.eventReminders !== undefined ? Boolean(incoming.adventureUpdates.eventReminders) : true,
        scheduleChanges: incoming.adventureUpdates?.scheduleChanges !== undefined ? Boolean(incoming.adventureUpdates.scheduleChanges) : true,
        adventureCancellation: incoming.adventureUpdates?.adventureCancellation !== undefined ? Boolean(incoming.adventureUpdates.adventureCancellation) : true,
      },
      fitnessUpdates: {
        readinessResult: incoming.fitnessUpdates?.readinessResult !== undefined ? Boolean(incoming.fitnessUpdates.readinessResult) : true,
        trainingRecommendations: incoming.fitnessUpdates?.trainingRecommendations !== undefined ? Boolean(incoming.fitnessUpdates.trainingRecommendations) : true,
        workoutReminders: incoming.fitnessUpdates?.workoutReminders !== undefined ? Boolean(incoming.fitnessUpdates.workoutReminders) : true,
      },
      safetyAlerts: {
        emergencySos: true, // Emergency notifications must not be disabled for safety-critical events
      },
    };

    // If phone number updated
    if (incoming.phone !== undefined) {
      user.phone = incoming.phone;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Communication preferences updated successfully',
      preferences: user.communicationPreferences,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get communication logs with filters (Admin & Organizer)
// @route GET /api/communication/logs
router.get('/logs', protect, async (req, res) => {
  try {
    // Only Admin or Organizer can view communication history
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view communication logs' });
    }

    const { channel, status, eventType, dateFrom, dateTo, search, limit = 50, page = 1 } = req.query;

    const query = {};
    if (channel && channel !== 'ALL') query.channel = channel.toUpperCase();
    if (status && status !== 'ALL') query.status = status.toUpperCase();
    if (eventType && eventType !== 'ALL') query.eventType = eventType;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      CommunicationLog.find(query)
        .populate('user', 'name email role phone')
        .populate('relatedAdventure', 'title category location')
        .populate('relatedBooking', 'ticketCode status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CommunicationLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get communication center statistics (Admin & Organizer)
// @route GET /api/communication/stats
router.get('/stats', protect, async (req, res) => {
  try {
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view communication stats' });
    }

    const [
      totalLogs,
      emailsSent,
      smsSent,
      whatsappSent,
      inAppSent,
      failedMessages,
      unreadNotifications,
    ] = await Promise.all([
      CommunicationLog.countDocuments(),
      CommunicationLog.countDocuments({ channel: 'EMAIL', status: 'SENT' }),
      CommunicationLog.countDocuments({ channel: 'SMS', status: 'SENT' }),
      CommunicationLog.countDocuments({ channel: 'WHATSAPP', status: 'SENT' }),
      CommunicationLog.countDocuments({ channel: 'IN_APP' }),
      CommunicationLog.countDocuments({ status: 'FAILED' }),
      Notification.countDocuments({ read: false }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalLogs,
        emailsSent,
        smsSent,
        whatsappSent,
        inAppSent,
        failedMessages,
        unreadNotifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Send test / direct message through communication service
// @route POST /api/communication/send
router.post('/send', protect, async (req, res) => {
  try {
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Admins and Organizers can send messages' });
    }

    const { targetUserId, title, message, channels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'] } = req.body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!Array.isArray(channels) || channels.length === 0 || channels.some((channel) => !allowedChannels.includes(channel))) {
      return res.status(400).json({ success: false, message: 'Choose at least one valid communication channel' });
    }
    if (targetUserId && !mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient user ID' });
    }

    const user = targetUserId ? await User.findById(targetUserId) : req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    const results = await dispatchMultiChannel({
      user,
      eventType: 'SYSTEM',
      title: typeof title === 'string' && title.trim() ? title.trim() : 'Communication Test Message',
      textMessage: message.trim(),
      channels,
      actionUrl: '/dashboard',
    });

    return res.json({
      success: true,
      message: 'Communication dispatch processed',
      results,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Send official announcement to users (Admin & Organizer)
// @route POST /api/communication/announcement
router.post('/announcement', protect, async (req, res) => {
  try {
    if (!['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Admins and Organizers can send announcements' });
    }

    const {
      title,
      message,
      targetAudience = 'ALL',
      targetAdventureId = null,
      targetRole = null,
      targetUserId = null,
      channels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
    } = req.body;

    if (typeof title !== 'string' || !title.trim() || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required for announcements' });
    }
    if (!['ALL', 'ADVENTURE', 'ROLE', 'SPECIFIC'].includes(targetAudience)) {
      return res.status(400).json({ success: false, message: 'Invalid target audience' });
    }
    if (!Array.isArray(channels) || channels.length === 0 || channels.some((channel) => !allowedChannels.includes(channel))) {
      return res.status(400).json({ success: false, message: 'Choose at least one valid communication channel' });
    }
    if (targetAudience === 'ADVENTURE' && !mongoose.isValidObjectId(targetAdventureId)) {
      return res.status(400).json({ success: false, message: 'Choose a valid adventure' });
    }
    if (targetAudience === 'ROLE' && !allowedAnnouncementRoles.includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Choose a valid user role' });
    }
    if (targetAudience === 'SPECIFIC' && !mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Choose a valid recipient' });
    }

    const summary = await sendAdminAnnouncement({
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      targetAdventureId,
      targetRole,
      targetUserId,
      channels,
    });
    if (summary.totalRecipients === 0) {
      return res.status(404).json({ success: false, message: 'No recipients were found for the selected audience' });
    }

    const resultKeys = {
      IN_APP: 'inApp',
      EMAIL: 'email',
      SMS: 'sms',
      WHATSAPP: 'whatsapp',
    };
    const deliverySummary = Object.fromEntries(channels.map((channel) => {
      const counts = { sent: 0, failed: 0, skipped: 0 };
      const issues = new Set();
      for (const result of summary.results) {
        const delivery = result?.[resultKeys[channel]];
        if (delivery?.success || delivery?.status === 'SENT' || delivery?._id) counts.sent++;
        else {
          if (delivery?.status === 'SKIPPED') counts.skipped++;
          else counts.failed++;
          if (delivery?.error) issues.add(delivery.error);
        }
      }
      return [channel, { ...counts, issues: [...issues].slice(0, 3) }];
    }));

    return res.json({
      success: true,
      message: `Announcement dispatched to ${summary.totalRecipients} recipients`,
      totalRecipients: summary.totalRecipients,
      deliverySummary,
      whatsappLinks: summary.whatsappLinks || [],
      emailLinks: summary.emailLinks || [],
      smsLinks: summary.smsLinks || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Trigger adventure reminders check (Cron / manual admin trigger)
// @route POST /api/communication/trigger-reminders
router.post('/trigger-reminders', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look for confirmed bookings in the next 8 days
    const upcomingBookings = await Booking.find({
      status: 'Confirmed',
      bookingDate: { $gte: today },
    }).populate('user').populate('itemRef');

    let remindersSent = 0;

    for (const b of upcomingBookings) {
      if (!b.user || !b.bookingDate) continue;

      const eventDate = new Date(b.bookingDate);
      eventDate.setHours(0, 0, 0, 0);

      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Reminders: 7 days, 3 days, 1 day, 0 days (event day)
      if ([7, 3, 1, 0].includes(diffDays)) {
        // Prevent duplicate reminder for the same booking and reminder day
        const existingLog = await CommunicationLog.findOne({
          relatedBooking: b._id,
          eventType: 'REMINDER',
          'metadata.reminderDays': diffDays,
        });

        if (!existingLog) {
          const adventure = b.itemType === 'Adventure' && b.itemRef ? b.itemRef : null;
          await sendAdventureReminderNotification({
            user: b.user,
            booking: b,
            adventure,
            reminderDays: diffDays,
          });

          // Tag the reminder with metadata
          await CommunicationLog.findOneAndUpdate(
            { relatedBooking: b._id, eventType: 'REMINDER' },
            { $set: { 'metadata.reminderDays': diffDays } },
            { sort: { createdAt: -1 } }
          );

          remindersSent++;
        }
      }
    }

    return res.json({
      success: true,
      message: `Reminders check completed. ${remindersSent} new reminder(s) dispatched.`,
      remindersSent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
