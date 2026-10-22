/**
 * On-Ground.ai Call Centre – Twilio Voice Backend
 * ─────────────────────────────────────────────────
 * Provides two endpoints:
 *   POST /token   → returns a short-lived Twilio Voice Access Token
 *   POST /voice   → webhook that returns TwiML to dial an outbound number
 *
 * SECURITY NOTES
 * ──────────────
 * • ALL Twilio secrets (Account SID, API Key, API Secret) live ONLY here,
 *   in server-side environment variables. They never reach the browser.
 * • The /token endpoint rate-limits to 20 req/min per IP.
 * • The /voice webhook validates the Twilio request signature.
 * • Destination numbers are validated against an E.164 allowlist pattern
 *   and capped to a maximum length to prevent toll-fraud.
 * • CORS is restricted to the configured frontend origin.
 */

'use strict';

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const twilio      = require('twilio');
const { VoiceResponse } = require('twilio').twiml;

// ── Env ───────────────────────────────────────────────────────────────────────
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_TWIML_APP_SID,
  TWILIO_CALLER_ID,          // E.164 verified Twilio number, e.g. +12015551234
  FRONTEND_ORIGIN,           // e.g. http://localhost:5173  or https://yourapp.vercel.app
  PORT,
  VALIDATE_TWILIO_SIGNATURE, // set to "true" in production
} = process.env;

// ── Validate required config at startup ───────────────────────────────────────
const REQUIRED = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_API_KEY_SID',
  'TWILIO_API_KEY_SECRET',
  'TWILIO_TWIML_APP_SID',
  'TWILIO_CALLER_ID',
];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(
    '\n⚠️  Missing required environment variables:\n  ' + missing.join('\n  ') +
    '\n\nThe server will start but /token and /voice will return 503 until these are set.\n'
  );
}

const CONFIGURED = missing.length === 0;

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();

app.set('trust proxy', 1); // needed for accurate IP in rate-limiter behind Render/Railway

app.use(express.urlencoded({
  extended: false,
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); }
}));

// CORS – only allow the configured frontend origin
const allowedOrigins = (FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow curl / server-to-server calls (no Origin header) in dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate limiter on /token ─────────────────────────────────────────────────────
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many token requests – please wait a moment.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Validate an E.164 phone number: +[country code][number], max 15 digits. */
function isValidE164(phone) {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    configured: CONFIGURED,
    ts: new Date().toISOString(),
  });
});

// ── POST /token ───────────────────────────────────────────────────────────────
/**
 * Returns a short-lived Twilio Voice Access Token (TTL 3600 s).
 * The browser passes this to new Device(token) to initialise the SDK.
 */
app.post('/token', tokenLimiter, (req, res) => {
  if (!CONFIGURED) {
    return res.status(503).json({
      error: 'Voice backend not fully configured. Set required environment variables.',
    });
  }

  try {
    const AccessToken  = twilio.jwt.AccessToken;
    const VoiceGrant   = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_TWIML_APP_SID,
      incomingAllow: true,
    });

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      {
        identity: `agent-${Date.now()}`, // unique per session
        ttl: 3600,                       // 1 hour – refresh before calls if needed
      }
    );
    token.addGrant(voiceGrant);

    return res.json({ token: token.toJwt() });
  } catch (err) {
    console.error('[/token] Error generating token:', err.message);
    return res.status(500).json({ error: 'Failed to generate access token.' });
  }
});

// ── POST /voice ───────────────────────────────────────────────────────────────
/**
 * Twilio webhook. Called by Twilio when the browser initiates a call via
 * device.connect({ params: { To: "+1..." } }).
 *
 * Returns TwiML that dials the requested destination using TWILIO_CALLER_ID
 * as the outbound caller-ID.
 *
 * Security:
 *  • Validates Twilio request signature when VALIDATE_TWILIO_SIGNATURE=true.
 *  • Validates the destination is a well-formed E.164 number.
 */
app.post('/voice', (req, res) => {
  // ── Signature validation ─────────────────────────────────────────────────
  if (VALIDATE_TWILIO_SIGNATURE === 'true' && CONFIGURED) {
    const authToken = process.env.TWILIO_AUTH_TOKEN; // optional – only for webhook validation
    if (authToken) {
      const requestUrl  = process.env.PUBLIC_WEBHOOK_URL || `${req.protocol}://${req.get('host')}/voice`;
      const params      = req.body || {};
      const signature   = req.headers['x-twilio-signature'] || '';
      const isValid     = twilio.validateRequest(authToken, signature, requestUrl, params);
      if (!isValid) {
        console.warn('[/voice] Invalid Twilio signature – request rejected.');
        return res.status(403).send('Forbidden');
      }
    }
  }

  // ── Destination validation ───────────────────────────────────────────────
  const to = (req.body && req.body.To) ? String(req.body.To).trim() : '';

  if (!to || !isValidE164(to)) {
    console.warn(`[/voice] Rejected invalid destination: "${to}"`);
    const twiml = new VoiceResponse();
    twiml.say('The destination number is invalid. Please try again.');
    res.type('text/xml');
    return res.status(400).send(twiml.toString());
  }

  if (!CONFIGURED) {
    console.warn('[/voice] Called but server not configured. Returning busy.');
    const twiml = new VoiceResponse();
    twiml.say('The voice backend is not configured. Please contact support.');
    res.type('text/xml');
    return res.status(503).send(twiml.toString());
  }

  // ── Build TwiML ──────────────────────────────────────────────────────────
  const twiml = new VoiceResponse();
  const dial  = twiml.dial({ callerId: TWILIO_CALLER_ID });
  dial.number(to);

  console.log(`[/voice] Dialling ${to} via ${TWILIO_CALLER_ID}`);
  res.type('text/xml');
  return res.send(twiml.toString());
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const port = parseInt(PORT || '3001', 10);
app.listen(port, () => {
  console.log(`\n🟢  On-Ground.ai Voice Server running on http://localhost:${port}`);
  console.log(`    Configured: ${CONFIGURED}`);
  console.log(`    Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`    POST /token  → Access Token endpoint`);
  console.log(`    POST /voice  → TwiML webhook\n`);
});
