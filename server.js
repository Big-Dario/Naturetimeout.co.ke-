// ═══════════════════════════════════════════════════════
//  MOTHER NATURE SAFARIS — Server
//  A small Node/Express server that:
//    1. Serves the static site (HTML, CSS, JS, images) from /public
//    2. Provides a backend endpoint for the booking form, backed by
//       PostgreSQL (see db.js):
//         POST /api/bookings   → saves the enquiry to the "bookings" table
//         GET  /api/bookings   → lists saved enquiries (requires admin key)
//
//  SECURITY NOTES (read this before deploying anywhere public):
//    - Set ADMIN_API_KEY in a .env file (see .env.example) before deploying.
//      Without it, the /api/bookings list endpoint is locked to localhost only.
//    - Set DATABASE_URL in .env, pointing at your Postgres instance (local,
//      or a managed one from Render/Railway/etc). See db.js and README.md.
//    - Put this behind HTTPS in production — most hosts (Render, Railway,
//      Vercel, a VPS behind Caddy/Nginx) handle this for you automatically.
// ═══════════════════════════════════════════════════════
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || null;

// ── Security middleware ─────────────────────────────────
app.use(helmet({
  // Allow Google Fonts (used by styles.css) alongside the default strict policy
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
    },
  },
}));

// Limit request body size so no one can send a huge payload to exhaust memory/disk
app.use(express.json({ limit: '20kb' }));

// Rate-limit the booking endpoint: max 5 submissions per IP per 10 minutes.
// Stops both accidental double-submits and deliberate spam/DoS attempts.
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many booking requests from this device. Please try again later.' }
});

// Separate, looser limiter for the whole app so static assets aren't affected
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ────────────────────────────────────────────
function generateReference() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `MNS-${year}-${random}`;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email) && email.length <= 254;
}

function isValidPhone(phone) {
  return typeof phone === 'string' && /^[0-9+()\-.\s]{6,20}$/.test(phone);
}

// Cap every text field's length so no field can be used to bloat storage
// or smuggle in oversized/garbage data.
const FIELD_LIMITS = {
  firstName: 60, lastName: 60, email: 254, phone: 20, country: 60,
  travellers: 10, destination: 30, destinationLabel: 60, duration: 10,
  arrivalDate: 20, departureDate: 20, package: 40, accommodation: 20,
  notes: 1000, estimatedTotal: 60
};

function sanitizeString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

// Only allow requests to the admin bookings list from localhost, OR from
// anyone who supplies the correct X-Admin-Key header (set ADMIN_API_KEY
// in your .env to enable this off of localhost, e.g. for a hosted admin view).
function requireAdmin(req, res, next) {
  const key = req.get('X-Admin-Key');
  const isLocalhost = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip);

  if (ADMIN_API_KEY && key === ADMIN_API_KEY) return next();
  if (!ADMIN_API_KEY && isLocalhost) return next();

  return res.status(401).json({ error: 'Unauthorized. Set ADMIN_API_KEY and pass it via the X-Admin-Key header.' });
}

// ── API: create a booking enquiry ───────────────────────
app.post('/api/bookings', bookingLimiter, async (req, res, next) => {
  try {
    const b = req.body || {};

    if (!sanitizeString(b.firstName, 1) || !sanitizeString(b.lastName, 1)) {
      return res.status(400).json({ error: 'First and last name are required.' });
    }
    if (!isValidEmail(b.email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!isValidPhone(b.phone)) {
      return res.status(400).json({ error: 'A valid phone number is required.' });
    }
    if (!b.destination || !b.duration || !b.arrivalDate || !b.package) {
      return res.status(400).json({ error: 'Destination, duration, arrival date and package are required.' });
    }

    // Sanitize/clip every field before it ever touches the database
    const clean = {};
    Object.keys(FIELD_LIMITS).forEach((key) => {
      clean[key] = sanitizeString(b[key], FIELD_LIMITS[key]);
    });
    clean.newsletter = !!b.newsletter;
    clean.reference = generateReference();

    const saved = await db.insertBooking(clean);

    console.log(`New booking enquiry received: ${saved.reference}`);
    res.status(201).json({ success: true, reference: saved.reference });
  } catch (err) {
    next(err);
  }
});

// ── API: list bookings (admin-only) ─────────────────────
app.get('/api/bookings', requireAdmin, async (req, res, next) => {
  try {
    const bookings = await db.getAllBookings();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// ── Fallback: send index.html for any other route ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Generic error handler — never leak stack traces to clients ─
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ── Startup: make sure the DB schema exists, then listen ─
db.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Mother Nature Safaris server running at http://localhost:${PORT}`);
      if (!ADMIN_API_KEY) {
        console.log('ADMIN_API_KEY not set — /api/bookings is only reachable from localhost.');
      }
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database. Check DATABASE_URL in your .env file.');
    console.error(err.message);
    process.exit(1);
  });
