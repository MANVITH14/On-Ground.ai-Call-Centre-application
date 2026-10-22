# On-Ground.ai – Call Centre Application

A production-grade AI Call Centre and Lead Intelligence Web Application with **real outbound browser-to-phone calling** via the official Twilio Voice JavaScript SDK.

![Status](https://img.shields.io/badge/Status-Complete-emerald?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![Twilio](https://img.shields.io/badge/Twilio-Voice%20SDK-F22F46?style=flat-square&logo=twilio)

---

## Architecture Overview

```
Browser (React + @twilio/voice-sdk)
       │
       │  POST /token  ──►  server/index.js (Express)
       │                         │
       │  ◄── { token: JWT }     │  signs with API Key Secret (never exposed)
       │                         │
       │  SDK registers ──────────────────────────► Twilio Edge
       │                                                │
       │  device.connect({ To }) ──► Twilio webhook ──► POST /voice
       │                                                │
       │                              server returns TwiML <Dial>
       │
       │  ◄── call audio stream ──────────────────────── Twilio
       │                                                │
       │                                          Calls destination phone
```

**Security principle**: Account SID, API Key, and Auth Token live **only on the backend server** in environment variables. The browser only receives a short-lived JWT that grants permission to make one outbound call.

---

## Key Features

- **Real outbound browser-to-phone calls** via Twilio Voice SDK
- **Full call lifecycle** – registering → ringing → connected → ended
- **Microphone permission handling** with clear error messages
- **Simulation fallback** – when backend is not configured the UI runs in clearly-labelled simulation mode
- **Rate limiting, CORS, E.164 validation** on the backend
- **Optional Twilio signature validation** in production
- All existing screens (Dashboard, Plan, Pulse, Calendar) fully preserved

---

## Prerequisites

- **Node.js 18+** (Node 20 recommended)  
- **Twilio account** – free trial works for verified numbers: https://www.twilio.com/try-twilio  
- **ngrok** (or any HTTPS tunnel) for local webhook development

---

## Step 1 – Twilio Console Setup

### 1.1 Create a Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Verify your email and phone number
3. Your **Account SID** is shown on the Console Dashboard (starts with `AC…`)

### 1.2 Get a Phone Number (Caller ID)
1. Console → **Phone Numbers → Manage → Buy a number**
2. On a free trial: you can only call **verified** numbers
3. Go to **Phone Numbers → Verified Caller IDs** and add your real phone number to test
4. Note the Twilio number in E.164 format (e.g. `+12015551234`) – this is `TWILIO_CALLER_ID`

### 1.3 Create an API Key
1. Console → **Account → API keys & tokens → Create API key**
2. Choose **Standard** key type, give it a name (e.g. `on-ground-voice`)
3. **Copy the SID** (starts with `SK…`) → `TWILIO_API_KEY_SID`
4. **Copy the Secret** (shown only once!) → `TWILIO_API_KEY_SECRET`

### 1.4 Create a TwiML Application
1. Console → **Voice → TwiML Apps → Create new TwiML App**
2. Name: `On-Ground.ai Call Centre`
3. **Voice Request URL**: Leave blank for now (you'll fill this in Step 4 after starting a tunnel)
4. Method: **POST**
5. Click **Create**
6. Note the **App SID** (starts with `AP…`) → `TWILIO_TWIML_APP_SID`

### 1.5 Get your Auth Token (for production signature validation)
1. Console Dashboard → **Account → Auth Token**
2. Click the eye icon to reveal it
3. Copy it → `TWILIO_AUTH_TOKEN`

---

## Step 2 – Configure Environment Variables

### Frontend (`/.env`)
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_TOKEN_ENDPOINT=http://localhost:3001/token
```

> During development, this points to the local backend.  
> In production, change it to your deployed backend URL.

### Backend (`/server/.env`)
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret_here
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CALLER_ID=+12015551234
TWILIO_AUTH_TOKEN=your_auth_token_here

PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
VALIDATE_TWILIO_SIGNATURE=false
```

> ⚠️ **Never commit `.env` files. They are in `.gitignore`.**

---

## Step 3 – Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

---

## Step 4 – Set Up a Public HTTPS Tunnel (Local Development)

Twilio **must** be able to reach your `/voice` webhook over public HTTPS.

### Using ngrok (recommended for development)

```bash
# Install ngrok: https://ngrok.com/download
# Then start a tunnel on the same port as your backend:
ngrok http 3001
```

ngrok will print something like:
```
Forwarding  https://abc123.ngrok-free.app → http://localhost:3001
```

**Your webhook URL is:**  
`https://abc123.ngrok-free.app/voice`

### Configure the TwiML App
1. Go back to your TwiML App in the Twilio Console
2. Set **Voice Request URL** to: `https://abc123.ngrok-free.app/voice`
3. Method: **POST**
4. Save

> **Every time you restart ngrok, you get a new URL** and must update the TwiML App.  
> For production, use a stable deployed URL (see Step 7).

---

## Step 5 – Run Both Services

Open **two terminal windows**:

**Terminal 1 – Backend:**
```bash
cd server
npm start
# OR for auto-restart on changes:
npm run dev
```

Expected output:
```
🟢  On-Ground.ai Voice Server running on http://localhost:3001
    Configured: true
    Allowed origins: http://localhost:5173
    POST /token  → Access Token endpoint
    POST /voice  → TwiML webhook
```

**Terminal 2 – Frontend:**
```bash
npm run dev
```

Open: http://localhost:5173

---

## Step 6 – Test Call Procedure

### 6.1 Verify backend health
```bash
curl http://localhost:3001/health
# Expected: {"ok":true,"configured":true,"ts":"..."}
```

### 6.2 Verify token generation
```bash
curl -X POST http://localhost:3001/token
# Expected: {"token":"eyJ..."}
```

### 6.3 Make a test call
1. Open http://localhost:5173 in **Chrome or Edge** (Firefox may have WebRTC issues)
2. Navigate to **Plan → Calls to Make** or the **Dashboard**
3. Click the **Call** button next to any lead with a verified phone number
4. **Allow microphone access** when the browser prompts
5. Watch the call dialog: `Registering → Ready → Dialling → Ringing → Connected`
6. Your **real phone** will ring
7. Answer it – you will hear audio both ways
8. Click **End call** to disconnect

> ⚠️ **Free Twilio trial**: You can only call numbers you have verified in the Twilio Console.  
> During testing, change the lead's phone number to your verified number.

### 6.4 Call states to verify
| State shown in UI | What it means |
|---|---|
| `Registering device…` | Fetching token + initialising SDK |
| `Dialling…` | SDK connected, waiting for Twilio to call |
| `Ringing…` | Twilio is ringing the destination phone |
| `00:00` (green timer) | Call connected, billing starts |
| `Call Ended` | Either party hung up |
| `Call Failed` | See error message – usually credential or network issue |

---

## Step 7 – Backend Deployment

Vercel (frontend hosting) cannot run a persistent Node.js server needed for voice tokens and webhooks.

### Option A – Render (recommended, free tier)
1. Push the `server/` directory to a GitHub repository (or subdir)
2. Create a new **Web Service** on https://render.com
3. Build command: `npm install`
4. Start command: `npm start`
5. Set all `server/.env` variables in Render's **Environment** tab
6. Set `FRONTEND_ORIGIN` to your Vercel URL (e.g. `https://yourapp.vercel.app`)
7. Set `VALIDATE_TWILIO_SIGNATURE=true`
8. Set `PUBLIC_WEBHOOK_URL=https://your-app.onrender.com/voice`
9. Your backend URL will be: `https://your-app.onrender.com`

### Option B – Railway
Similar to Render. Deploy `server/` as a service, set env vars.

### Option C – Fly.io, Heroku, VPS
Any platform that runs a Node.js process on a public HTTPS URL.

### After deploying the backend:
1. Update your TwiML App Voice Request URL to: `https://your-backend.onrender.com/voice`
2. Update your Vercel frontend env var: `VITE_TOKEN_ENDPOINT=https://your-backend.onrender.com/token`
3. Update `FRONTEND_ORIGIN` in the backend env to your Vercel URL

---

## Step 8 – Production Checklist

- [ ] `VALIDATE_TWILIO_SIGNATURE=true` in backend env
- [ ] `TWILIO_AUTH_TOKEN` set in backend env
- [ ] `PUBLIC_WEBHOOK_URL` set to exact `https://…/voice` URL
- [ ] `FRONTEND_ORIGIN` restricted to your production frontend URL only
- [ ] TwiML App webhook URL updated to production backend
- [ ] No secrets in `VITE_` env vars or browser console
- [ ] Verified callerID configured in Twilio

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── calling/
│   │   │   ├── CallDialog.jsx        ← Real Twilio SDK integration
│   │   │   └── CallDialog.module.css
│   │   ├── layout/                   ← Sidebar, TopBar (unchanged)
│   │   └── leads/                    ← LeadsModal (unchanged)
│   ├── pages/                        ← All pages (unchanged)
│   ├── data/sampleData.js
│   ├── App.jsx
│   ├── App.css
│   └── index.css
│
├── server/                           ← Secure Express backend (NEW)
│   ├── index.js                      ← Token + TwiML webhook server
│   ├── package.json
│   ├── .env.example                  ← Backend env template
│   └── .gitignore
│
├── .env.example                      ← Frontend env template
├── vite.config.js                    ← Updated with /api proxy
└── README.md
```

---

## Troubleshooting

### "Cannot reach token endpoint"
- Is `npm start` running in the `server/` directory?
- Does `server/.env` have all required variables?
- Check: `curl http://localhost:3001/health`

### "Device registration failed"
- Check browser console for errors
- Ensure TwiML App SID is correct

### "Microphone permission denied"
- Click the lock icon in the browser address bar → Allow microphone
- Or open browser settings → Privacy → Microphone → Allow for localhost

### "Token endpoint returned HTTP 503"
- Backend is running but credentials are missing
- Check all 5 required variables are set in `server/.env`

### "Invalid Twilio signature" (production only)
- Ensure `PUBLIC_WEBHOOK_URL` exactly matches the URL Twilio posts to
- Ensure `TWILIO_AUTH_TOKEN` is correct

### Phone rings but no audio
- Check browser microphone permission
- Try in Chrome (best WebRTC support)
- Check firewall is not blocking WebRTC ports (UDP 10000-60000)

### "31002 – Auth token invalid"
- Your token has expired (1-hour TTL). Refresh the page to get a new one.

---

## Recording a Real Call Demo

To record an honest demo showing the actual phone ringing:

1. Start screen recording software (e.g. OBS, Windows Game Bar `Win+G`)
2. Open http://localhost:5173 in the browser
3. Place your real phone next to the computer
4. Click a **Call** button with your verified number
5. Show the UI transitioning through states
6. When your phone rings, show both the ringing phone and the "Ringing…" UI state
7. Answer the call – show the green timer
8. Speak a test phrase and show the audio is live (you can hear yourself)
9. Click **End call** – show "Call Ended"
10. Stop recording

> **Honest note**: A phone call was not completed during automated testing because real Twilio credentials were not available in the CI environment. The code, server, SDK integration, build, and all feasible non-call states were tested and verified. A real call requires your own Twilio credentials, a verified number, and an active network connection.

---

## Environment Variable Reference

### Frontend (`/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_TOKEN_ENDPOINT` | Yes (for live calls) | Full URL of backend `/token` endpoint |
| `VITE_APP_NAME` | No | Optional title override |

### Backend (`/server/.env`)
| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | Account SID from Twilio Console (`AC…`) |
| `TWILIO_API_KEY_SID` | Yes | API Key SID (`SK…`) |
| `TWILIO_API_KEY_SECRET` | Yes | API Key Secret (shown once at creation) |
| `TWILIO_TWIML_APP_SID` | Yes | TwiML App SID (`AP…`) |
| `TWILIO_CALLER_ID` | Yes | Verified Twilio phone number (E.164) |
| `TWILIO_AUTH_TOKEN` | Production | Auth token for webhook signature validation |
| `VALIDATE_TWILIO_SIGNATURE` | No | Set `true` in production |
| `PUBLIC_WEBHOOK_URL` | Production | Full public URL of `/voice` endpoint |
| `PORT` | No | Default: `3001` |
| `FRONTEND_ORIGIN` | Yes | Comma-separated allowed frontend origins |

---

## License
Created as an engineering evaluation assignment for On-Ground.ai.
