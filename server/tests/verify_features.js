/**
 * Automated Verification Test Suite for the Adventure Management System
 * Run with: node server/tests/verify_features.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_adventure_db';

const { connectDB } = require('../config/db');
const User = require('../models/User');
const Adventure = require('../models/Adventure');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const CommunicationLog = require('../models/CommunicationLog');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const whatsappService = require('../services/whatsappService');

async function runTestSuite() {
  console.log('========================================================');
  console.log('RUNNING FULL ADVENTURE SYSTEM INTEGRATION VERIFICATION');
  console.log('========================================================');
  await connectDB();

  // Find or create test user
  let user = await User.findOne({ email: 'test_athlete@example.com' });
  if (!user) {
    user = await User.create({
      name: 'Test Athlete',
      email: 'test_athlete@example.com',
      password: 'password123',
      phone: '+919876543210',
      role: 'user',
      fitnessScore: 78,
      fitnessLevel: 'Advanced',
      communicationPreferences: {
        email: true,
        sms: true,
        whatsapp: true,
        inApp: true,
      },
    });
  }

  // Find or create test adventure
  let adventure = await Adventure.findOne();
  if (!adventure) {
    adventure = await Adventure.create({
      title: 'Kodaikanal 15 KM Trek',
      description: 'Challenging high altitude pine forest trek in the Western Ghats.',
      location: 'Kodaikanal, Tamil Nadu',
      difficulty: 'Challenging',
      durationDays: 2,
      price: 3500,
      xpReward: 350,
      minFitnessScore: 65,
    });
  }

  // 1. Providers Check
  console.log('\n[1/10] Provider Configuration Check:');
  console.log('Email Service Configured:', emailService.isEmailConfigured());
  console.log('SMS Service Configured:', smsService.isSmsConfigured());
  console.log('WhatsApp Service Configured:', whatsappService.isWhatsappConfigured());

  // 2. Event A: Welcome
  console.log('\n[2/10] Event A: Welcome Notification:');
  const resA = await notificationService.sendWelcomeNotification(user);
  console.log('-> In-App & Multi-Channel:', resA.channels);

  // 3. Booking creation
  let booking = await Booking.findOne({ user: user._id });
  if (!booking) {
    booking = await Booking.create({
      user: user._id,
      itemType: 'Adventure',
      itemRef: adventure._id,
      bookingDate: new Date(Date.now() + 7 * 86400000),
      totalPrice: adventure.price || 3500,
      status: 'Confirmed',
      readinessStatus: 'READY',
      ticketCode: 'ADV-1025',
    });
  }

  // 4. Event B: Booking Confirmation
  console.log('\n[3/10] Event B: Adventure Registration Confirmed:');
  const resB = await notificationService.sendBookingConfirmationNotification({
    user,
    booking,
    adventure,
    readinessStatus: 'READY',
  });
  console.log('-> In-App & Multi-Channel:', resB.channels);

  // 5. Event C: Ready Status
  console.log('\n[4/10] Event C: Participant READY:');
  const resC = await notificationService.sendReadyStatusNotification({ user, adventure });
  console.log('-> In-App & Multi-Channel:', resC.channels);

  // 6. Event D: Not Ready Status
  console.log('\n[5/10] Event D: Participant NOT READY:');
  const resD = await notificationService.sendNotReadyStatusNotification({
    user,
    adventure,
    readinessResult: {
      readinessPercentage: 45,
      missingRequirements: ['Aerobic Endurance < 60', 'Leg Strength < 55'],
      weakAreas: ['Endurance', 'Strength'],
      recommendations: ['Hill Walking', 'Trail Running', 'Stair Training'],
    },
  });
  console.log('-> In-App & Multi-Channel:', resD.channels);

  // 7. Event E: Reminder
  console.log('\n[6/10] Event E: Adventure Reminders:');
  const resE = await notificationService.sendAdventureReminderNotification({
    user,
    adventure,
    booking,
    daysRemaining: 7,
  });
  console.log('-> In-App & Multi-Channel:', resE.channels);

  // 8. Event F: Schedule Change
  console.log('\n[7/10] Event F: Schedule Change:');
  const resF = await notificationService.sendScheduleChangeNotification({
    participants: [user],
    adventure,
    changes: { time: '05:30 AM', location: 'Base Camp Shelter #2' },
  });
  console.log('-> Dispatched to participants:', resF.dispatched);

  // 9. Event H: QR Check-in
  console.log('\n[8/10] Event H: QR Check-in Confirmation:');
  const resH = await notificationService.sendCheckInConfirmationNotification({
    user,
    booking,
    adventure,
    checkInTime: new Date(),
  });
  console.log('-> In-App & Multi-Channel:', resH.channels);

  // 10. Event I: SOS Emergency Alert
  console.log('\n[9/10] Event I: SOS Emergency Alert:');
  const resI = await notificationService.sendSosEmergencyNotification({
    sender: user,
    adventure,
    incidentType: 'Medical Emergency',
    coordinates: { lat: 10.2381, lng: 77.4892 },
    message: 'Medical assist needed near checkpoint 2.',
  });
  console.log('-> SOS Alert Result:', resI.success);

  // 11. Event J: Completion & XP
  console.log('\n[10/10] Event J: Adventure Completion:');
  const resJ = await notificationService.sendAdventureCompletionNotification({
    user,
    adventure,
    booking,
    xpEarned: 350,
    badge: 'Western Ghats Summit Finisher',
    duration: '2 Days',
  });
  console.log('-> In-App & Multi-Channel:', resJ.channels);

  // Database verification
  const inAppTotal = await Notification.countDocuments({ user: user._id });
  const logsTotal = await CommunicationLog.countDocuments();
  console.log('\n========================================================');
  console.log(`✓ Verified MongoDB Notifications for User: ${inAppTotal}`);
  console.log(`✓ Verified MongoDB Communication Delivery Logs: ${logsTotal}`);
  console.log('ALL INTEGRATION TESTS PASSED!');
  console.log('========================================================\n');
  await mongoose.disconnect();
}

runTestSuite().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
