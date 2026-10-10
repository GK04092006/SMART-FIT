# Database — CSV Data Store

This folder stores all user data in Excel-compatible CSV files.
These files are auto-updated every time a user registers, logs in, or updates their profile.

## Files

| File | Description |
|------|-------------|
| `users_registrations.csv` | Full registration details of every user |
| `users_login_log.csv` | Login activity log (timestamp, email, status) |
| `users_profile_updates.csv` | Profile changes (name, phone, avatar, etc.) |

## How to open in Excel
- Open Excel → File → Open → browse to this folder → select any `.csv` file
- Or double-click the `.csv` file directly (Windows will open it in Excel)

> ⚠️ Do NOT manually edit these files while the server is running.
