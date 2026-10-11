/**
 * ============================================================
 * csvManager.js  —  CSV / Excel-Compatible Data Store
 * ============================================================
 * Manages three CSV files inside  server/database/
 *
 *   users_registrations.csv   – one row per registered user
 *   users_login_log.csv       – one row per login attempt
 *   users_profile_updates.csv – one row per profile edit
 *
 * All files use comma-separated values with a UTF-8 BOM so
 * that Excel opens them correctly without an import wizard.
 * ============================================================
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── paths ────────────────────────────────────────────────────
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL
);
const DB_DIR = isServerless
  ? path.join(os.tmpdir(), 'fitness-database')
  : path.join(__dirname, '../database');

const FILES = {
  registrations: path.join(DB_DIR, 'users_registrations.csv'),
  loginLog: path.join(DB_DIR, 'users_login_log.csv'),
  profileUpdates: path.join(DB_DIR, 'users_profile_updates.csv'),
};

// ── CSV headers ───────────────────────────────────────────────
const HEADERS = {
  registrations: [
    'User ID',
    'Full Name',
    'Email',
    'Phone',
    'Role',
    'Fitness Level',
    'Bio',
    'Avatar URL',
    'Registered At',
    'Source',
  ],

  loginLog: [
    'Log ID',
    'User ID',
    'Email',
    'Full Name',
    'Login Status',
    'Login At',
    'IP Address',
    'Note',
  ],

  profileUpdates: [
    'Update ID',
    'User ID',
    'Email',
    'Full Name',
    'Phone',
    'Fitness Level',
    'Bio',
    'Avatar URL',
    'Updated At',
  ],
};

// ── UTF-8 BOM (makes Excel open CSV without garbled text) ─────
const BOM = '\uFEFF';

// ── helpers ───────────────────────────────────────────────────

/** Escape a cell value so commas and quotes don't break CSV */
function cell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** Format a JS Date to a human-readable local string */
function ts(date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Generate a short unique ID for log rows */
function uid() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

/** Ensure the database directory and the CSV file (with headers) exist */
function ensureFile(filePath, headers) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      const headerRow = headers.map(cell).join(',');
      fs.writeFileSync(filePath, BOM + headerRow + '\r\n', 'utf8');
    }
  } catch (err) {
    console.warn('[CSV Store] File init skipped:', err.message);
  }
}

/** Append one data row to a CSV file */
function appendRow(filePath, headers, rowData) {
  ensureFile(filePath, headers);
  const line = rowData.map(cell).join(',');
  fs.appendFileSync(filePath, line + '\r\n', 'utf8');
}

/**
 * Read all rows from a CSV and return as array of objects.
 * The first row (headers) is used as keys.
 */
function readAll(filePath, headers) {
  ensureFile(filePath, headers);
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];              // only header or empty

  const keys = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const obj = {};
    keys.forEach((k, i) => {
      obj[k.trim()] = (values[i] || '').replace(/^"|"$/g, '').trim();
    });
    return obj;
  });
}

/**
 * Rewrite all rows for a specific User ID
 * Used when updating a user's registration record after a profile change.
 */
function upsertRegistration(userId, updatedFields) {
  ensureFile(FILES.registrations, HEADERS.registrations);
  const content = fs.readFileSync(FILES.registrations, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return;

  const headerLine = lines[0];
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);

  const updated = dataLines.map((line) => {
    const cols = line.split(',');
    const rowId = (cols[0] || '').replace(/^"|"$/g, '').trim();
    if (rowId !== String(userId)) return line;

    // Apply updates to known column positions
    const col = (i, val) => { cols[i] = cell(val); };
    if (updatedFields.name !== undefined) col(1, updatedFields.name);
    if (updatedFields.phone !== undefined) col(3, updatedFields.phone);
    if (updatedFields.fitnessLevel !== undefined) col(5, updatedFields.fitnessLevel);
    if (updatedFields.bio !== undefined) col(6, updatedFields.bio);
    if (updatedFields.avatar !== undefined) col(7, updatedFields.avatar);
    return cols.join(',');
  });

  const newContent = BOM + headerLine + '\r\n' + updated.join('\r\n') + '\r\n';
  fs.writeFileSync(FILES.registrations, newContent, 'utf8');
}

// ── Public API ────────────────────────────────────────────────

/**
 * Called when a user successfully registers.
 * Adds a new row to users_registrations.csv
 */
function saveRegistration({ userId, name, email, phone, role, fitnessLevel, bio, avatar, source }) {
  try {
    appendRow(FILES.registrations, HEADERS.registrations, [
      userId || '',
      name || '',
      email || '',
      phone || '',
      role || 'user',
      fitnessLevel || 'Intermediate',
      bio || '',
      avatar || '',
      ts(),
      source || 'web-registration',
    ]);
    console.log('[CSV] Registration saved for:', email);
  } catch (err) {
    console.error('[CSV] Failed to save registration:', err.message);
  }
}

/**
 * Called after every login attempt (success or failure).
 * Adds a new row to users_login_log.csv
 */
function saveLoginLog({ userId, email, name, status, ip, note }) {
  try {
    appendRow(FILES.loginLog, HEADERS.loginLog, [
      uid(),
      userId || '',
      email || '',
      name || '',
      status || 'SUCCESS',
      ts(),
      ip || '',
      note || '',
    ]);
    console.log('[CSV] Login log saved for:', email, '|', status);
  } catch (err) {
    console.error('[CSV] Failed to save login log:', err.message);
  }
}

/**
 * Called when a user updates their profile.
 * - Appends a row to users_profile_updates.csv
 * - Also updates the matching row in users_registrations.csv
 */
function saveProfileUpdate({ userId, email, name, phone, fitnessLevel, bio, avatar }) {
  try {
    appendRow(FILES.profileUpdates, HEADERS.profileUpdates, [
      uid(),
      userId || '',
      email || '',
      name || '',
      phone || '',
      fitnessLevel || '',
      bio || '',
      avatar || '',
      ts(),
    ]);

    // Also keep registrations.csv in sync
    upsertRegistration(userId, { name, phone, fitnessLevel, bio, avatar });
    console.log('[CSV] Profile update saved for:', email);
  } catch (err) {
    console.error('[CSV] Failed to save profile update:', err.message);
  }
}

/**
 * Returns all rows from users_registrations.csv as JS objects.
 * Useful for admin exports or debugging.
 */
function getAllRegistrations() {
  return readAll(FILES.registrations, HEADERS.registrations);
}

/**
 * Returns all rows from users_login_log.csv as JS objects.
 */
function getAllLoginLogs() {
  return readAll(FILES.loginLog, HEADERS.loginLog);
}

/**
 * Initialise all three CSV files (creates them with headers if missing).
 * Call once on server startup.
 */
function initCSVStore() {
  ensureFile(FILES.registrations, HEADERS.registrations);
  ensureFile(FILES.loginLog, HEADERS.loginLog);
  ensureFile(FILES.profileUpdates, HEADERS.profileUpdates);
  console.log('[CSV Store] Initialised — database folder:', DB_DIR);
}

module.exports = {
  initCSVStore,
  saveRegistration,
  saveLoginLog,
  saveProfileUpdate,
  getAllRegistrations,
  getAllLoginLogs,
  FILES,
};
