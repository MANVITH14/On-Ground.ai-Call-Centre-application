# On-Ground.ai – Call Centre Application

A modern, production-grade AI Call Centre and Lead Intelligence Web Application built for high-velocity sales and operations teams. Designed according to the On-Ground.ai Call Centre specifications.

![Status](https://img.shields.io/badge/Status-Complete-emerald?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![Design](https://img.shields.io/badge/Design-Dark%20%2F%20Glassmorphism-purple?style=flat-square)

---

## 🌟 Key Features

### 1. Unified Dashboard
- **Performance KPIs**: Real-time metrics for total calls, connect rate, conversions, and target achievements.
- **Queue & Waiting Users**: Live visibility into contacts ready for outreach.
- **Task Management**: Prioritized daily calling agendas and reminders.
- **Interactive Analytics**: 7-day call volume, duration trends, and outcome breakdown using Chart.js.

### 2. Lead Intelligence & Plan Module
- **Calls to Make**: Structured queue with filter by status, priority sorting, and tag filtering.
- **Rich Lead Profile Modal**:
  - **ICP Fit & Intent Gauge**: Visual gauge displays with algorithmic scoring.
  - **Collapsible Buying Signals**: Recent activity triggers, website visits, and intent events.
  - **Comprehensive Call History**: Previous interactions, dispositions, and agent notes.
  - **Tabbed Lead Workspace**: Overview, qualification questions, activity logs, and previous transcripts.
  - **Quick Navigation**: Previous / Next lead cycling directly within the modal.

### 3. Integrated Browser Calling (Twilio Voice SDK)
- **Production Twilio Voice Integration**: Dynamic integration hook connecting to Twilio's Browser Voice SDK (`@twilio/voice-sdk`).
- **Interactive Simulation Fallback**: Automatically activates when no Twilio credentials are provided, allowing full end-to-end evaluation with:
  - Clear **SIMULATION** badge to eliminate any confusion.
  - Live call duration timer and animated audio waveform.
  - Mute/unmute microphone and speaker output toggles.
  - Call termination with post-call disposition and notes logging.
- **Security by Design**: Never exposes sensitive Twilio account secrets on the frontend; follows best practices using server-generated access tokens.

### 4. Team Pulse & Collaboration Channels
- **Live Channels**: Team communication channel for instant field updates.
- **Pinned Announcements**: Key objections, script updates, and campaign alerts.
- **"Needs Your Input" Interactive Cards**: Quick voting and acknowledgement for team members.
- **Rich Messaging**: Reactions, thread replies, and structured message feeds.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, JavaScript (ESNext)
- **Build Tool**: Vite 8
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React
- **Visualizations**: Chart.js & `react-chartjs-2`
- **Telephony**: Twilio Voice Client SDK (`@twilio/voice-sdk`) with automated simulation fallback
- **Styling**: Modular Vanilla CSS with Design Tokens, modern dark theme, glassmorphism, and responsive layouts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MANVITH14/On-Ground.ai-Call-Centre-application.git
   cd On-Ground.ai-Call-Centre-application
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional for Live Twilio Calls)**:
   ```bash
   cp .env.example .env
   ```
   *Note: If no Twilio credentials or token endpoints are specified, the application seamlessly runs in **Simulation Mode**.*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
├── public/                 # Static assets and icons
├── src/
│   ├── assets/             # Brand logos and styles
│   ├── components/         # Reusable UI components
│   │   ├── calling/        # Twilio call dialog & audio controls
│   │   ├── layout/         # Header, Sidebar, and AppShell
│   │   ├── leads/          # Leads modal, score gauges, buying signals
│   │   └── ui/             # Badges, buttons, cards, progress rings
│   ├── data/               # Realistic mock data & sample call queues
│   ├── pages/              # Primary route views
│   │   ├── Dashboard.jsx   # Executive overview & KPIs
│   │   ├── PlanCalls.jsx   # Call queue & lead management
│   │   ├── Pulse.jsx       # Channel directory
│   │   └── PulseChannel.jsx# Live team communication & polls
│   ├── App.jsx             # Route definitions & state providers
│   ├── index.css           # Global design system & theme variables
│   └── main.jsx            # React root entry point
├── .env.example            # Twilio configuration template
├── package.json
└── vite.config.js
```

---

## 🔒 Security Best Practices

- No secrets or credentials are hardcoded or checked into source control.
- All `.env` files are ignored in `.gitignore`.
- Telephony follows the token-exchange architecture standard for Twilio Voice SDK.

---

## 📄 License
This project was created as an engineering evaluation assignment for On-Ground.ai.
