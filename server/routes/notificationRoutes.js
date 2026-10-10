const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const { getDBStatus } = require('../config/db');
const { addNotificationClient } = require('../services/notificationStream');

// @desc  Stream live notifications for the authenticated user
// @route GET /api/notifications/stream
router.get('/stream', protect, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  try {
    res.write('event: connected\ndata: {}\n\n');
  } catch (err) {
    return;
  }

  const removeClient = addNotificationClient(req.user._id, res);
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    removeClient();
  };

  const heartbeat = setInterval(() => {
    try {
      if (!res.writableEnded && !res.destroyed) {
        res.write(': keep-alive\n\n');
      } else {
        cleanup();
      }
    } catch (err) {
      cleanup();
    }
  }, 25000);

  req.on('close', cleanup);
  req.on('error', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
});

// @desc  Get user notifications & unread count
// @route GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, unreadOnly, limit = 50, page = 1 } = req.query;

    if (!getDBStatus()) {
      return res.json({
        notifications: [],
        unreadCount: 0,
        total: 0,
        demoMode: true,
      });
    }

    const query = { user: userId };
    if (type && type !== 'ALL') query.type = type;
    if (unreadOnly === 'true') query.read = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    console.error('[Notification Fetch Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Mark single notification as read
// @route PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.json({ success: true, notification, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Mark all user's notifications as read
// @route PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    return res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.json({ success: true, message: 'Notification removed', unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
