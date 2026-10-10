const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Adventure = require('../models/Adventure');
const User = require('../models/User');
const { getDBStatus } = require('../config/db');
const { sendBookingConfirmationEmail } = require('../utils/mailer');
const notificationService = require('../services/notificationService');
const { initialAdventures } = require('../utils/helper');

const isValidObjectId = (id) =>
  Boolean(id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id));

const resolveAdventure = async (itemRef, itemDetails) => {
  if (!itemRef && !itemDetails) return null;
  if (isValidObjectId(itemRef)) {
    const adv = await Adventure.findById(itemRef);
    if (adv) return adv;
  }
  const title = (itemDetails?.title || '').trim();
  if (title) {
    const adv = await Adventure.findOne({ title: new RegExp('^' + title + '$', 'i') });
    if (adv) return adv;
  }
  const mockAdv = initialAdventures.find(
    (a) => a._id === itemRef || a.id === itemRef || (title && a.title.toLowerCase() === title.toLowerCase())
  );
  if (mockAdv) {
    let existing = await Adventure.findOne({ title: mockAdv.title });
    if (existing) return existing;
    try {
      const created = await Adventure.create({
        title: mockAdv.title,
        category: mockAdv.category || 'Trekking',
        location: mockAdv.location || 'Interlaken',
        difficulty: mockAdv.difficulty || 'Moderate',
        durationDays: mockAdv.durationDays || 3,
        price: mockAdv.price || 650,
        maxParticipants: mockAdv.maxParticipants || 15,
        description: mockAdv.description || 'Outdoor adventure expedition.',
        includedGear: mockAdv.includedGear || ['Backpack', 'Water bottle'],
        itinerary: mockAdv.itinerary || [],
        imageUrl: mockAdv.imageUrl || itemDetails?.imageUrl,
        rating: mockAdv.rating || 4.9,
        reviewCount: mockAdv.reviewCount || 10,
      });
      return created;
    } catch (e) {
      console.warn('[resolveAdventure] Adventure create fallback:', e.message);
    }
  }
  return await Adventure.findOne();
};

// @desc Create a new booking / adventure registration
// @route POST /api/booking
const createBooking = async (req, res) => {
  try {
    const { itemType, itemRef, itemDetails, bookingDate, participants, totalPrice, notes, team } = req.body;

    if (!itemType || !itemRef || !bookingDate) {
      return res.status(400).json({ success: false, message: 'Missing required booking details' });
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let targetAdventure = null;
    let resolvedItemRef = itemRef;

    if (itemType === 'Adventure' && getDBStatus()) {
      targetAdventure = await resolveAdventure(itemRef, itemDetails);
      if (targetAdventure) {
        resolvedItemRef = targetAdventure._id;
      }
    }

    // ── Readiness gate for Adventure bookings ──────────────────────────────────
    // Only enforced when DB is connected (fallback / demo mode skips the check).
    if (itemType === 'Adventure' && getDBStatus() && targetAdventure) {
      const adventure = targetAdventure;
      const user = await User.findById(userId).select('age fitnessLevel fitnessAssessment fitnessScore');

      if (adventure) {
        const assessment = user?.fitnessAssessment || {};

        const requiredFitnessScore = adventure.requiredFitnessScore ?? 60;
        const requiredEndurance    = adventure.requiredEndurance    ?? 50;
        const requiredStrength     = adventure.requiredStrength     ?? 50;
        const requiredStamina      = adventure.requiredStamina      ?? 50;
        const requiredFlexibility  = adventure.requiredFlexibility  ?? 50;
        const minimumAge           = adventure.minimumAge           ?? 18;

        const userAge          = user?.age ?? null;
        const userFitnessScore = user?.fitnessScore ?? assessment?.assessmentScore ?? 0;

        const checks = {
          age:            userAge === null || userAge >= minimumAge,
          overallFitness: userFitnessScore >= requiredFitnessScore,
          endurance:      (assessment.endurance  ?? 0) >= requiredEndurance,
          strength:       (assessment.strength   ?? 0) >= requiredStrength,
          stamina:        (assessment.stamina    ?? 0) >= requiredStamina,
          flexibility:    (assessment.flexibility ?? 0) >= requiredFlexibility,
        };

        const weakAreas = Object.entries(checks)
          .filter(([, pass]) => !pass)
          .map(([area]) => area.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));

        if (weakAreas.length > 0) {
          const recommendedTraining = [];
          if (weakAreas.some(w => w.toLowerCase().includes('endurance'))) recommendedTraining.push('Hill Walking (45 min, 3x/week)', 'Tempo Running (5 KM)', 'Stair Climbing intervals');
          if (weakAreas.some(w => w.toLowerCase().includes('strength'))) recommendedTraining.push('Bodyweight Squats & Lunges (4x15)', 'Weighted Pack Carries (8-12 kg)', 'Planks & Core Stability');
          if (weakAreas.some(w => w.toLowerCase().includes('stamina'))) recommendedTraining.push('Long Zone-2 Hiking (2-3 hrs)', 'Interval Cycling (30 min)');
          if (weakAreas.some(w => w.toLowerCase().includes('flexibility'))) recommendedTraining.push('Dynamic Hip & Hamstring Stretches', 'Yoga for Hikers & Climbers');
          if (weakAreas.some(w => w.toLowerCase().includes('fitness'))) recommendedTraining.push('Pre-Expedition Conditioning Circuit', 'Active Recovery Walks');
          if (recommendedTraining.length === 0) recommendedTraining.push('Hill Walking', 'Trail Running', 'Stair Training');

          // Event D: Send NOT READY notification
          notificationService.sendNotReadyStatusNotification({
            user,
            adventure,
            weakAreas,
            recommendedTraining,
          }).catch(err => console.error('[NotReady Notif Error]', err.message));

          return res.status(403).json({
            success: false,
            message: 'You do not meet the fitness requirements for this adventure.',
            weakAreas,
            recommendedTraining,
            hint: 'Complete recommended workouts and retake your fitness assessment before booking.',
          });
        }
      }
    }
    // ── End readiness gate ─────────────────────────────────────────────────────

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticketCode = `TKT-${randomSuffix}`;
    const qrData = JSON.stringify({
      ticketCode,
      itemRef: resolvedItemRef,
      item: itemDetails?.title || targetAdventure?.title || 'Adventure Event',
      user: userId,
    });

    const booking = await Booking.create({
      user: userId,
      itemType: itemType || 'Adventure',
      itemRef: resolvedItemRef,
      itemDetails: itemDetails || (targetAdventure ? {
        title: targetAdventure.title,
        category: targetAdventure.category,
        location: targetAdventure.location,
        imageUrl: targetAdventure.imageUrl,
      } : {}),
      bookingDate: new Date(bookingDate),
      participants: Number(participants) || 1,
      totalPrice: Number(totalPrice) || 0,
      notes: notes || '',
      ticketCode,
      qrData,
      team: team || 'Team Alpha',
      status: 'Confirmed',
    });

    // Record interaction in user's recentlyAccessed
    await User.findByIdAndUpdate(userId, {
      $push: {
        recentlyAccessed: {
          $each: [
            {
              itemType: 'Booking',
              itemId: String(booking._id),
              title: itemDetails?.title || targetAdventure?.title || 'Adventure Registration',
              category: itemDetails?.category || targetAdventure?.category || itemType,
              imageUrl: itemDetails?.imageUrl || targetAdventure?.imageUrl || '',
              accessedAt: new Date(),
            },
          ],
          $slice: -10,
        },
      },
    });

    const bookingUser = await User.findById(userId);
    const bookedAdventure = targetAdventure || (itemType === 'Adventure' && isValidObjectId(resolvedItemRef) ? await Adventure.findById(resolvedItemRef) : null);

    if (bookingUser) {
      // Event B: Send multi-channel booking confirmation (Email, SMS, WhatsApp, In-App)
      notificationService.sendBookingConfirmationNotification({
        user: bookingUser,
        booking,
        adventure: bookedAdventure,
        readinessStatus: 'READY',
      }).catch(err => console.error('[Booking Notif Error]', err.message));
    }

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('[Create Booking Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// @desc Get logged-in user's bookings
// @route GET /api/booking/my
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all bookings (admin / organizer)
// @route GET /api/booking
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email role phone avatar fitnessScore fitnessLevel')
      .sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Check-in participant via QR ticketCode or Booking ID
// @route POST /api/booking/checkin
const checkInParticipant = async (req, res) => {
  try {
    const { ticketCode, bookingId } = req.body;
    if (!ticketCode && !bookingId) {
      return res.status(400).json({ success: false, message: 'ticketCode or bookingId required' });
    }

    const query = ticketCode ? { ticketCode: ticketCode.trim().toUpperCase() } : { _id: bookingId };
    const booking = await Booking.findOne(query)
      .populate('user', 'name email phone fitnessLevel fitnessScore avatar');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ticket not found or invalid' });
    }

    if (booking.checkedIn) {
      return res.status(200).json({
        success: true,
        alreadyCheckedIn: true,
        message: `Participant ${booking.user?.name || ''} was already checked in at ${new Date(booking.checkedInAt).toLocaleTimeString()}`,
        booking,
      });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    // Event H: Send QR Check-in confirmation notification
    if (booking.user) {
      notificationService.sendCheckInConfirmationNotification({
        user: booking.user,
        booking,
        checkpointName: 'Trailhead Start Gate',
      }).catch(err => console.error('[Checkin Notif Error]', err.message));
    }

    return res.status(200).json({
      success: true,
      message: `QR Check-in successful for ${booking.user?.name || 'Participant'}`,
      booking,
    });
  } catch (error) {
    console.error('[Check-in Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all registrations for a specific adventure
// @route GET /api/booking/adventure/:adventureId
const getAdventureBookings = async (req, res) => {
  try {
    const advObjId = mongoose.Types.ObjectId.isValid(adventureId) ? new mongoose.Types.ObjectId(adventureId) : null;
    const refValues = [String(adventureId)];
    if (advObjId) refValues.push(advObjId);
    const bookings = await Booking.find({ itemRef: { $in: refValues }, itemType: 'Adventure' })
      .populate('user', 'name email phone age fitnessLevel fitnessAssessment fitnessScore avatar')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Assign participant team
// @route PUT /api/booking/:id/team
const assignTeam = async (req, res) => {
  try {
    const { team } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { team },
      { new: true }
    ).populate('user', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  checkInParticipant,
  getAdventureBookings,
  assignTeam,
};
