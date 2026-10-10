# 🏔️ Fitness & Adventure System

A full-stack web application designed for active lifestyle enthusiasts to discover fitness workouts, plan thrilling outdoor adventure expeditions, track personal fitness milestones, and manage bookings seamlessly.

---

## 🏗️ Architecture & Folder Structure

```
Fitness-Adventure-System/
│
├── client/                     # React Frontend (Vite)
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   ├── components/        # Navbar, Footer, Sidebar, WorkoutCard, AdventureCard, Loader
│   │   ├── pages/             # Home, Login, Register, Dashboard, Fitness, Adventure, Booking, Profile, Contact
│   │   ├── services/          # API Client
│   │   ├── hooks/             # Custom Hooks (useAuth, useWorkout)
│   │   ├── context/           # AuthContext
│   │   ├── styles/            # App.css (Dark Glassmorphism UI)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Auth, Fitness, Adventure, Booking, Profile
│   ├── models/                # User, Fitness, Adventure, Booking
│   ├── routes/                # REST API Routes
│   ├── middleware/            # JWT Auth & Error Handling
│   ├── uploads/               # Profile Images & Assets
│   ├── utils/                 # Helpers & Seed data
│   ├── server.js              # Server entry point
│   ├── package.json
│   └── .env
│
├── README.md
├── .gitignore
└── package.json
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Ensure `server/.env` contains:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fitness_adventure_db
JWT_SECRET=super_secret_fitness_key_2026
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

For Google sign-in, create a Google OAuth 2.0 Web application client ID and allow the frontend origin in its Authorized JavaScript origins (for example, `http://localhost:5173`). Set the same client ID in `client/.env` as `VITE_GOOGLE_CLIENT_ID` (see `client/.env.example`) and in `server/.env` as `GOOGLE_CLIENT_ID`. Restart both development servers after updating the environment files.

### 3. Launch Development Servers
- **Backend Server**: `cd server && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend Client**: `cd client && npm run dev` (Runs on `http://localhost:5173`)

---

## 🌟 Key Features
- **Modern Dark Glassmorphism UI**: High aesthetic visual design with responsive layouts and smooth micro-interactions.
- **User Authentication**: Secure JWT register and login flow with local fallback state support.
- **Workout Catalog**: Filterable workouts by category (HIIT, Strength, Yoga, Cardio) and intensity level.
- **Adventure Catalog**: Outdoor expedition listings with location filtering, difficulty badges, and pricing.
- **Interactive Booking Flow**: Seamless reservation system for fitness classes and wilderness trips.
- **User Dashboard**: Real-time stats display, streak counter, upcoming activities, and account management.
