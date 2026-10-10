import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import RealtimeNotificationListener from './components/RealtimeNotificationListener';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Home            from './pages/Home';
import Login           from './pages/Login';
import AdminLogin      from './pages/AdminLogin';
import Register        from './pages/Register';
import Dashboard       from './pages/Dashboard';
import Settings        from './pages/Settings';
import Notifications   from './pages/Notifications';
import Fitness         from './pages/Fitness';
import FitnessAssessment from './pages/FitnessAssessment';
import FitnessGoals    from './pages/FitnessGoals';
import ChallengeHub    from './pages/ChallengeHub';
import AICoach         from './pages/AICoach';
import Adventure       from './pages/Adventure';
import AdventureDetails   from './pages/AdventureDetails';
import AdventureReadiness from './pages/AdventureReadiness';
import Booking         from './pages/Booking';
import BookingDetails     from './pages/BookingDetails';
import EventDetails       from './pages/EventDetails';
import IncidentDetails    from './pages/IncidentDetails';
import NotificationCenter from './pages/NotificationCenter';
import AdminCommunication from './pages/AdminCommunication';
import Profile         from './pages/Profile';
import DietPlans       from './pages/DietPlans';
import BMICalculator   from './pages/BMICalculator';
import EquipmentRental from './pages/EquipmentRental';
import EventSchedule   from './pages/EventSchedule';
import Contact         from './pages/Contact';
import Organizer       from './pages/Organizer';
import AdventurePlanner from './pages/AdventurePlanner';
import LiveEvent       from './pages/LiveEvent';
import Safety          from './pages/Safety';
import Engagement      from './pages/Engagement';
import Analytics       from './pages/Analytics';
import TrainerDashboard from './pages/TrainerDashboard';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/"             element={<Home />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/participant-login" element={<Login expectedRole="user" />} />
          <Route path="/organizer-login" element={<Login expectedRole="organizer" />} />
          <Route path="/admin-login"  element={<AdminLogin />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/contact"      element={<Contact />} />

          {/* ── Fitness (protected — any authenticated user) ─────── */}
          <Route path="/fitness" element={<ProtectedRoute><Fitness /></ProtectedRoute>} />
          <Route path="/fitness/goals" element={<ProtectedRoute><FitnessGoals /></ProtectedRoute>} />
          <Route path="/fitness/assessment" element={<ProtectedRoute><FitnessAssessment /></ProtectedRoute>} />
          <Route path="/diet-plans" element={<ProtectedRoute><DietPlans /></ProtectedRoute>} />
          <Route path="/bmi-calculator" element={<BMICalculator />} />
          <Route path="/challenge-hub" element={<ProtectedRoute><ChallengeHub /></ProtectedRoute>} />
          <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />

          {/* ── Adventure browse (public — no login needed to discover trips) ── */}
          <Route path="/adventure" element={<Adventure />} />
          <Route path="/adventure/:id" element={<AdventureDetails />} />
          <Route path="/adventures/:id" element={<AdventureDetails />} />
          <Route path="/adventure/:id/readiness" element={<ProtectedRoute><AdventureReadiness /></ProtectedRoute>} />
          <Route path="/adventures/:id/readiness" element={<ProtectedRoute><AdventureReadiness /></ProtectedRoute>} />

          {/* ── Adventure actions (protected) ────────────────────────────── */}
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/booking/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/incidents/:id" element={<RoleRoute allowedRoles={['admin', 'guide']}><IncidentDetails /></RoleRoute>} />
          <Route path="/equipment-rental" element={<ProtectedRoute><EquipmentRental /></ProtectedRoute>} />
          <Route path="/event-schedule" element={<ProtectedRoute><EventSchedule /></ProtectedRoute>} />

          {/* ── User workspace (protected) ───────────────────────── */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/engagement" element={<ProtectedRoute><Engagement /></ProtectedRoute>} />

          {/* ── Admin & Organizer Communication Center ──────────── */}
          <Route
            path="/admin/communication"
            element={
              <RoleRoute allowedRoles={['admin', 'organizer']}>
                <AdminCommunication />
              </RoleRoute>
            }
          />

          {/* ── Organizer workspace (organizer + admin) ─────────── */}
          <Route
            path="/organizer"
            element={
              <RoleRoute allowedRoles={['organizer', 'admin']}>
                <Organizer />
              </RoleRoute>
            }
          />
          <Route
            path="/adventure-planner"
            element={
              <RoleRoute allowedRoles={['organizer', 'admin']}>
                <AdventurePlanner />
              </RoleRoute>
            }
          />

          {/* ── Trainer workspace (trainer + admin) ─────────────── */}
          <Route
            path="/trainer-dashboard"
            element={
              <RoleRoute allowedRoles={['trainer', 'admin']}>
                <TrainerDashboard />
              </RoleRoute>
            }
          />

          {/* ── Guide workspace (guide + admin) ─────────────────── */}
          <Route
            path="/live-event"
            element={
              <RoleRoute allowedRoles={['guide', 'admin']}>
                <LiveEvent />
              </RoleRoute>
            }
          />
          <Route
            path="/live-event/:id"
            element={
              <RoleRoute allowedRoles={['guide', 'admin']}>
                <LiveEvent />
              </RoleRoute>
            }
          />

          {/* ── Admin workspace (admin only) ─────────────────────── */}
          <Route
            path="/safety"
            element={
              <RoleRoute allowedRoles={['admin', 'guide', 'organizer']}>
                <Safety />
              </RoleRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Analytics />
              </RoleRoute>
            }
          />

          {/* ── Catch-all: redirect unknown paths to home ─────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <RealtimeNotificationListener />
      <AIAssistant />
    </div>
  );
}

export default App;
