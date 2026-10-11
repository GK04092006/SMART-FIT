const User = require('../models/User');
const Booking = require('../models/Booking');
const WorkoutLog = require('../models/WorkoutLog');
const CommunicationLog = require('../models/CommunicationLog');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const whatsappService = require('../services/whatsappService');
const { getDBStatus } = require('../config/db');
const csv = require('../utils/csvManager');

// @desc Get current profile details
// @route GET /api/profile/me or GET /api/profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const [recentWorkouts, bookings] = await Promise.all([
      WorkoutLog.find({ user: userId }).sort({ completedAt: -1 }).limit(10),
      Booking.find({ user: userId }).sort({ bookingDate: -1 }),
    ]);

    const completedAdventures = bookings.filter(
      (b) => b.status === 'Completed' || (new Date(b.bookingDate) < new Date() && b.status === 'Confirmed')
    );

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone || '',
        age: user.age || 21,
        bio: user.bio || '',
        fitnessLevel: user.fitnessLevel || 'Intermediate',
        fitnessScore: user.fitnessScore || 0,
        fitnessAssessment: user.fitnessAssessment || {
          endurance: 0,
          strength: 0,
          stamina: 0,
          flexibility: 0,
          assessmentScore: 0,
        },
        totalWorkouts: user.totalWorkouts ?? recentWorkouts.length,
        totalAdventures: user.totalAdventures ?? completedAdventures.length,
        badges: user.badges || [],
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        streakDays: user.streakDays ?? 0,
        recentlyAccessed: user.recentlyAccessed || [],
        recentWorkouts,
        bookings,
        completedAdventures,
      },
    });
  } catch (error) {
    console.error('[Get Profile Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user profile
// @route PUT /api/profile/me or PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, bio, phone, fitnessLevel, avatar, age } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found' });

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (fitnessLevel !== undefined) user.fitnessLevel = fitnessLevel;
    if (avatar !== undefined) user.avatar = avatar;
    if (age !== undefined && age !== null && age !== '') user.age = Number(age);

    const updatedUser = await user.save();

    // Save profile update to CSV
    csv.saveProfileUpdate({
      userId: String(updatedUser._id),
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      fitnessLevel: updatedUser.fitnessLevel,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
    });

    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        fitnessLevel: updatedUser.fitnessLevel,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        age: updatedUser.age,
        fitnessScore: updatedUser.fitnessScore,
        fitnessAssessment: updatedUser.fitnessAssessment,
        xp: updatedUser.xp ?? 0,
        level: updatedUser.level ?? 1,
        streakDays: updatedUser.streakDays ?? 0,
        totalWorkouts: updatedUser.totalWorkouts ?? 0,
        totalAdventures: updatedUser.totalAdventures ?? 0,
        badges: updatedUser.badges || [],
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Upload profile image avatar
// @route POST /api/profile/upload-avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const fs = require('fs');
    let avatarUrl = `/uploads/profile-images/${req.file.filename}`;
    if (req.file.path && fs.existsSync(req.file.path)) {
      try {
        const buf = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        avatarUrl = `data:${mime};base64,${buf.toString('base64')}`;
      } catch (_) {}
    }

    const userId = req.user?._id || req.user?.id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    }

    return res.json({ success: true, avatarUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc Record recently accessed item
// @route POST /api/profile/recently-accessed
const recordRecentlyAccessed = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { itemType, itemId, title, category, imageUrl } = req.body;

    if (!itemType || !title) {
      return res.status(400).json({ message: 'itemType and title are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.recentlyAccessed = (user.recentlyAccessed || []).filter(
      (item) => String(item.itemId) !== String(itemId) && item.title !== title
    );

    user.recentlyAccessed.unshift({
      itemType,
      itemId: String(itemId || Date.now()),
      title,
      category: category || '',
      imageUrl: imageUrl || '',
      accessedAt: new Date(),
    });

    if (user.recentlyAccessed.length > 10) {
      user.recentlyAccessed = user.recentlyAccessed.slice(0, 10);
    }

    await user.save();
    return res.json({ success: true, recentlyAccessed: user.recentlyAccessed });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc Get user settings
// @route GET /api/profile/settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const user = await User.findById(userId).select('settings name email phone');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user settings
// @route PUT /api/profile/settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { theme, language, communication, linkedAccounts } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.settings = {
      ...(user.settings || {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(language !== undefined ? { language } : {}),
      ...(communication ? { communication: { ...((user.settings && user.settings.communication) || {}), ...communication } } : {}),
      ...(linkedAccounts ? { linkedAccounts: { ...((user.settings && user.settings.linkedAccounts) || {}), ...linkedAccounts } } : {}),
    };

    if (communication) {
      const preferredPhone = (communication.whatsapp?.phone || communication.sms?.phone || '').trim();
      if (preferredPhone) {
        user.phone = preferredPhone;
        if (communication.whatsapp) communication.whatsapp.phone = communication.whatsapp.phone || preferredPhone;
        if (communication.sms) communication.sms.phone = communication.sms.phone || preferredPhone;
      }
      user.settings = {
        ...(user.settings || {}),
        communication: {
          ...((user.settings && user.settings.communication) || {}),
          ...communication,
        },
      };
      const currentPreferences = user.communicationPreferences?.toObject
        ? user.communicationPreferences.toObject()
        : user.communicationPreferences || {};
      user.communicationPreferences = {
        ...currentPreferences,
        emailNotifications: communication.email?.enabled !== undefined
          ? Boolean(communication.email.enabled)
          : currentPreferences.emailNotifications !== false,
        smsNotifications: communication.sms?.enabled !== undefined
          ? Boolean(communication.sms.enabled)
          : currentPreferences.smsNotifications !== false,
        whatsappNotifications: communication.whatsapp?.enabled !== undefined
          ? Boolean(communication.whatsapp.enabled)
          : true,
        inAppNotifications: communication.inApp !== undefined
          ? Boolean(communication.inApp)
          : currentPreferences.inAppNotifications !== false,
        safetyAlerts: { emergencySos: true },
      };
      user.markModified('communicationPreferences');
    }

    user.markModified('settings');
    await user.save();
    return res.json({
      success: true,
      message: 'Settings saved successfully',
      settings: user.settings,
      communicationPreferences: user.communicationPreferences,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Send a test communication alert (WhatsApp, Email, or SMS)
// @route POST /api/profile/communication/test
const testCommunication = async (req, res) => {
  try {
    const { channel, target } = req.body; // channel: 'whatsapp' | 'email' | 'sms'
    const name = req.user?.name || 'Athlete';
    const userId = req.user?._id || req.user?.id;
    if (!['whatsapp', 'sms', 'email'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Choose a valid communication channel' });
    }
    const targetTrimmed = typeof target === 'string' ? target.trim() : '';
    const fallbackPhone = req.user?.phone || req.user?.settings?.communication?.whatsapp?.phone || req.user?.settings?.communication?.sms?.phone || '+91 98765 43210';
    const recipient = targetTrimmed || (
      channel === 'email'
        ? req.user?.settings?.communication?.email?.email || req.user?.email || 'athlete@example.com'
        : req.user?.settings?.communication?.[channel]?.phone || fallbackPhone
    );
    let previewMessage = '';
    let sendResult = { success: false };

    if (channel === 'whatsapp') {
      previewMessage = `Hello ${name}! Your SmartFit WhatsApp notification channel is active. You will receive live expedition alerts, team updates, and QR tickets here.`;
      sendResult = await whatsappService.sendWhatsApp({
        to: recipient,
        message: previewMessage,
        context: { eventType: 'TEST_COMMUNICATION', userId },
      });
    } else if (channel === 'sms') {
      previewMessage = `SMARTFIT ALERT: Urgent expedition dispatch channel active for ${name}. Emergency SOS & weather alerts verified.`;
      sendResult = await smsService.sendSMS({
        to: recipient,
        message: previewMessage,
        context: { eventType: 'TEST_COMMUNICATION', userId },
      });
    } else {
      previewMessage = `Welcome ${name}! Your SmartFit Email updates are active. Weekly digests, itineraries & badge alerts will arrive here.`;
      sendResult = await emailService.sendEmail({
        to: recipient,
        subject: 'SmartFit Communication Channel Test',
        text: previewMessage,
        html: `<p>${previewMessage}</p>`,
        context: { eventType: 'TEST_COMMUNICATION', userId },
      });
    }

    // Record in CommunicationLog
    try {
      await CommunicationLog.create({
        user: userId,
        channel: channel.toUpperCase(),
        eventType: 'TEST_COMMUNICATION',
        recipient: recipient || 'N/A',
        subject: `Test ${channel.toUpperCase()} dispatch`,
        message: previewMessage,
        status: sendResult.success ? 'SENT' : 'FAILED',
        providerMessageId: sendResult.messageId || null,
        sentAt: sendResult.success ? new Date() : null,
        errorMessage: sendResult.success ? null : (sendResult.error || 'Provider unconfigured or dispatch failed'),
      });
    } catch (logErr) {
      console.warn('[Test Communication Log Error]', logErr.message);
    }

    if (!sendResult.success) {
      return res.status(200).json({
        success: false,
        channel,
        message: `${channel.toUpperCase()} service error: ${sendResult.error || 'Provider not configured in environment'}`,
        preview: previewMessage,
        configured: false,
        error: sendResult.error,
        timestamp: new Date(),
      });
    }

    return res.json({
      success: true,
      channel,
      message: `Test ${channel.toUpperCase()} notification sent successfully!`,
      preview: previewMessage,
      configured: true,
      providerMessageId: sendResult.messageId,
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  recordRecentlyAccessed,
  getSettings,
  updateSettings,
  testCommunication,
};
