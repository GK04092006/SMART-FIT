const mongoose = require('mongoose');
const Adventure = require('../models/Adventure');
const Booking = require('../models/Booking');
const notificationService = require('../services/notificationService');
const { getDBStatus } = require('../config/db');
const { initialAdventures } = require('../utils/helper');

const isValidObjectId = (id) =>
  Boolean(id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id));

let memoryAdventures = [...initialAdventures];

// @desc Get all adventures
// @route GET /api/adventure
const getAdventures = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;

    if (getDBStatus()) {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (difficulty && difficulty !== 'All') {
        query.difficulty = difficulty;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ];
      }

      const adventures = await Adventure.find(query);
      return res.json(adventures);
    } else {
      let filtered = [...memoryAdventures];
      if (category && category !== 'All') {
        filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
      }
      if (difficulty && difficulty !== 'All') {
        filtered = filtered.filter((a) => a.difficulty.toLowerCase() === difficulty.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.location.toLowerCase().includes(search.toLowerCase())
        );
      }
      return res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get adventure by ID
// @route GET /api/adventure/:id
const getAdventureById = async (req, res) => {
  try {
    const { id } = req.params;
    let adventure = null;

    if (getDBStatus()) {
      if (isValidObjectId(id)) {
        adventure = await Adventure.findById(id);
      }
      if (!adventure) {
        adventure = await Adventure.findOne({
          $or: [
            { id: id },
            { title: new RegExp('^' + String(id).replace(/[-_]/g, ' ') + '$', 'i') },
          ],
        });
      }
    }

    if (!adventure) {
      adventure = memoryAdventures.find(
        (a) => a._id === id || a.id === id || a.title?.toLowerCase() === String(id).replace(/[-_]/g, ' ').toLowerCase()
      );
    }

    if (!adventure) return res.status(404).json({ message: 'Adventure not found' });
    return res.json(adventure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new adventure
// @route POST /api/adventure
const createAdventure = async (req, res) => {
  try {
    if (getDBStatus()) {
      const adventure = await Adventure.create(req.body);
      return res.status(201).json(adventure);
    } else {
      const newId = `a_${Date.now()}`;
      const newAdventure = {
        _id: newId,
        id: newId,
        rating: 5.0,
        reviewCount: 1,
        ...req.body,
      };
      memoryAdventures.push(newAdventure);
      return res.status(201).json(newAdventure);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update adventure
// @route PUT /api/adventure/:id
const updateAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const existing = await Adventure.findById(id);
      if (!existing) return res.status(404).json({ message: 'Adventure not found' });

      // Detect schedule or cancellation changes
      const isCancellation = req.body.status === 'Cancelled' && existing.status !== 'Cancelled';
      const changes = [];

      if (req.body.date && req.body.date !== existing.date) {
        changes.push(`Date rescheduled to ${req.body.date}`);
      }
      if (req.body.startTime && req.body.startTime !== existing.startTime) {
        changes.push(`Start time updated to ${req.body.startTime}`);
      }
      if (req.body.location && req.body.location !== existing.location) {
        changes.push(`Location moved to ${req.body.location}`);
      }
      if (req.body.schedule && req.body.schedule !== existing.schedule) {
        changes.push(`Schedule: ${req.body.schedule}`);
      }
      if (req.body.status && req.body.status !== existing.status && !isCancellation) {
        changes.push(`Event status changed to ${req.body.status}`);
      }

      const adventure = await Adventure.findByIdAndUpdate(id, req.body, { new: true });

      // Notify registered participants
      const advObjId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      const refValues = [String(id)];
      if (advObjId) refValues.push(advObjId);
      const bookings = await Booking.find({
        itemRef: { $in: refValues },
        itemType: 'Adventure',
        status: { $in: ['Confirmed', 'Pending'] },
      }).populate('user');

      if (isCancellation) {
        // Event G: Cancellation Notification
        for (const b of bookings) {
          if (b.user) {
            notificationService.sendCancellationNotification({
              user: b.user,
              adventure,
              reason: req.body.cancellationReason || 'Logistical updates or weather advisory',
            }).catch(err => console.error('[Cancellation Notif Error]', err.message));
          }
        }
      } else if (changes.length > 0) {
        // Event F: Schedule Change Notification
        for (const b of bookings) {
          if (b.user) {
            notificationService.sendScheduleChangeNotification({
              user: b.user,
              adventure,
              changesSummary: changes.join('\n'),
            }).catch(err => console.error('[Schedule Change Notif Error]', err.message));
          }
        }
      }

      return res.json(adventure);
    } else {
      const index = memoryAdventures.findIndex((a) => a._id === id || a.id === id);
      if (index === -1) return res.status(404).json({ message: 'Adventure not found' });
      memoryAdventures[index] = { ...memoryAdventures[index], ...req.body };
      return res.json(memoryAdventures[index]);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete adventure
// @route DELETE /api/adventure/:id
const deleteAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const adventure = await Adventure.findById(id);
      if (!adventure) return res.status(404).json({ message: 'Adventure not found' });

      // Event G: Notify participants of cancellation before deletion
      const delAdvObjId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      const delRefValues = [String(id)];
      if (delAdvObjId) delRefValues.push(delAdvObjId);
      const bookings = await Booking.find({
        itemRef: { $in: delRefValues },
        itemType: 'Adventure',
        status: { $in: ['Confirmed', 'Pending'] },
      }).populate('user');

      for (const b of bookings) {
        if (b.user) {
          notificationService.sendCancellationNotification({
            user: b.user,
            adventure,
            reason: 'Adventure has been removed from schedule',
          }).catch(err => console.error('[Delete Cancellation Notif Error]', err.message));
        }
      }

      await Adventure.findByIdAndDelete(id);
      return res.json({ message: 'Adventure deleted successfully' });
    } else {
      const index = memoryAdventures.findIndex((a) => a._id === id || a.id === id);
      if (index === -1) return res.status(404).json({ message: 'Adventure not found' });
      memoryAdventures.splice(index, 1);
      return res.json({ message: 'Adventure deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Toggle publish/unpublish adventure
// @route PUT /api/adventure/:id/publish
const togglePublishAdventure = async (req, res) => {
  try {
    const { id } = req.params;
    const adventure = await Adventure.findById(id);
    if (!adventure) return res.status(404).json({ success: false, message: 'Adventure not found' });

    adventure.status = adventure.status === 'Published' ? 'Draft' : 'Published';
    await adventure.save();
    return res.json({ success: true, message: `Adventure status changed to ${adventure.status}`, adventure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdventures,
  getAdventureById,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  togglePublishAdventure,
};
