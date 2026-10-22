import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  AlertTriangle, Info, ExternalLink, Loader2,
} from 'lucide-react';
import { Device } from '@twilio/voice-sdk';
import styles from './CallDialog.module.css';

/**
 * CallDialog – Real outbound browser-to-phone calling via Twilio Voice SDK
 *
 * State machine:
 *   idle → registering → ready → dialling → ringing → connected → ended
 *                                                              ↘ error
 *
 * CREDENTIALS REQUIRED (server/.env):
 *   TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET,
 *   TWILIO_TWIML_APP_SID, TWILIO_CALLER_ID
 *
 * BROWSER ENV (frontend .env):
 *   VITE_TOKEN_ENDPOINT=http://localhost:3001/token   (dev)
 *   VITE_TOKEN_ENDPOINT=https://your-backend/token    (prod)
 *
 * All Twilio secrets stay on the server – never in VITE_ variables.
 */

// The only frontend env var: URL of the /token endpoint on the backend server.
// This is NOT a secret – it's a public URL, not a credential.
const TOKEN_ENDPOINT = import.meta.env.VITE_TOKEN_ENDPOINT || null;
const CALLING_CONFIGURED = !!TOKEN_ENDPOINT;

// ── Timer hook ─────────────────────────────────────────────────────────────────
function useCallTimer(running) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
      setSecs(0);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  return secs;
}

function formatDur(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── State labels ───────────────────────────────────────────────────────────────
const STATE_LABELS = {
  idle:        'Preparing…',
  registering: 'Registering device…',
  ready:       'Device ready',
  dialling:    'Dialling…',
  ringing:     'Ringing…',
  connected:   null,          // replaced by live timer
  ended:       'Call Ended',
  error:       'Call Failed',
  sim_active:  null,          // simulation connected
  sim_ended:   'Call Ended',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CallDialog({ call, onEnd }) {
  const lead = call?.lead || call || {};

  const [state, setState]         = useState('idle');
  const [error, setError]         = useState(null);
  const [muted, setMuted]         = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);

  // Refs so event-handlers don't close over stale values
  const deviceRef = useRef(null);
  const callRef   = useRef(null);

  const isConnected = state === 'connected' || state === 'sim_active';
  const isEnded     = state === 'ended' || state === 'sim_ended';
  const secs        = useCallTimer(isConnected);

  // ── Simulation mode (no backend configured) ─────────────────────────────────
  useEffect(() => {
    if (CALLING_CONFIGURED) return;

    // Clear banner after a moment, show connecting state
    setState('registering');
    const t1 = setTimeout(() => setState('ready'),      600);
    const t2 = setTimeout(() => setState('dialling'),  1200);
    const t3 = setTimeout(() => setState('ringing'),   2200);
    const t4 = setTimeout(() => setState('sim_active'), 3800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  // ── Real Twilio SDK lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!CALLING_CONFIGURED) return;

    let cancelled = false;
    let device    = null;

    const cleanup = () => {
      cancelled = true;
      if (callRef.current) {
        try { callRef.current.disconnect(); } catch (_) {}
        callRef.current = null;
      }
      if (deviceRef.current) {
        try { deviceRef.current.destroy(); } catch (_) {}
        deviceRef.current = null;
      }
    };

    (async () => {
      try {
        // 1. Fetch short-lived access token from backend
        setState('registering');
        let token;
        try {
          const res = await fetch(TOKEN_ENDPOINT, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Token endpoint returned HTTP ${res.status}`);
          }
          ({ token } = await res.json());
        } catch (fetchErr) {
          throw new Error(
            `Cannot reach token endpoint at ${TOKEN_ENDPOINT}.\n` +
            `Is the backend server running?\n\n` +
            `Detail: ${fetchErr.message}`
          );
        }

        if (cancelled) return;

        // 2. Create Twilio Device
        device = new Device(token, {
          logLevel:  1,         // 0=silent 1=error 2=warn 3=info 4=debug
          codecPreferences: ['opus', 'pcmu'],
        });
        deviceRef.current = device;

        // Device event handlers
        device.on('registered',   () => { if (!cancelled) setState('ready'); });
        device.on('unregistered', () => { if (!cancelled && state !== 'ended' && state !== 'error') setState('idle'); });
        device.on('error',        (err) => {
          if (cancelled) return;
          console.error('[Device error]', err);
          if (!callRef.current) {
            setError(`Device error: ${err?.message || err?.code || String(err)}`);
            setState('error');
          }
        });

        // 3. Ensure microphone permission before dialing
        try {
          if (navigator?.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
          }
        } catch (micErr) {
          throw new Error(
            'Microphone permission was denied.\n' +
            'Please allow microphone access in your browser settings and try again.'
          );
        }

        if (cancelled) { device.destroy(); return; }

        const destPhone = lead.phone || call.phone;
        if (!destPhone) {
          throw new Error('No phone number available for this contact.');
        }

        setState('dialling');

        // 4. Initiate outbound call directly
        // The 'To' param is sent to your /voice webhook as req.body.To
        const twilioCall = await device.connect({
          params: { To: destPhone },
        });
        callRef.current = twilioCall;

        if (cancelled) { twilioCall.disconnect(); return; }

        // 5. Wire up Call lifecycle events
        twilioCall.on('ringing',     ()    => { if (!cancelled) setState('ringing'); });
        twilioCall.on('accept',      ()    => { if (!cancelled) setState('connected'); });
        twilioCall.on('disconnect',  ()    => {
          if (cancelled) return;
          setState('ended');
          setTimeout(onEnd, 1200);
        });
        twilioCall.on('cancel',      ()    => {
          if (cancelled) return;
          setState('ended');
          setTimeout(onEnd, 800);
        });
        twilioCall.on('reject',      ()    => {
          if (cancelled) return;
          setError('Call was rejected by the remote party.');
          setState('error');
        });
        twilioCall.on('error',       (err) => {
          if (cancelled) return;
          console.error('[Call error]', err);
          setError(`Call error: ${err.message || err.code}`);
          setState('error');
        });

      } catch (err) {
        if (cancelled) return;
        console.error('[CallDialog]', err);
        setError(err?.message || String(err || 'Call failed to connect.'));
        setState('error');
      }
    })();

    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEnd = useCallback(() => {
    if (callRef.current) {
      try { callRef.current.disconnect(); } catch (_) {}
    }
    setState('ended');
    setTimeout(onEnd, 800);
  }, [onEnd]);

  const handleSimEnd = useCallback(() => {
    setState('sim_ended');
    setTimeout(onEnd, 800);
  }, [onEnd]);

  const handleMute = useCallback(() => {
    if (callRef.current) {
      try { callRef.current.mute(!muted); } catch (_) {}
    }
    setMuted(m => !m);
  }, [muted]);

  // ── Derived display ────────────────────────────────────────────────────────
  const displayName   = lead?.name || lead?.company || 'Unknown';
  const avatarLetters = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'OG';

  // Status bar label
  let statusLabel;
  if (state === 'connected' || state === 'sim_active') {
    statusLabel = <><span className={styles.activeDot} /> {formatDur(secs)}</>;
  } else {
    statusLabel = STATE_LABELS[state] || state;
  }

  // Controls disabled unless call is live
  const ctrlDisabled = !isConnected;
  const endDisabled  = isEnded;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Active call">
      <div className={styles.dialog}>

        {/* ── Status bar ───────────────────────────────────────────────── */}
        <div className={`${styles.statusBar} ${styles[state] || ''}`}>
          {['idle','registering','ready','dialling'].includes(state) && (
            <Loader2 size={12} className={styles.spinner} />
          )}
          {state === 'ringing' && <span className={styles.pulse} />}
          {(state === 'connected' || state === 'sim_active') && <span className={styles.activeDot} />}
          {(state === 'error') && <AlertTriangle size={12} />}

          <span>{statusLabel}</span>

          {!CALLING_CONFIGURED && (
            <span
              className={styles.simLabel}
              title="Simulation mode – set VITE_TOKEN_ENDPOINT in .env to enable live calls"
            >
              SIMULATION
            </span>
          )}
        </div>

        {/* ── Lead info ─────────────────────────────────────────────────── */}
        <div className={styles.leadInfo}>
          <div className={`${styles.callAvatar} avatar avatar-lg avatar-green`}>
            {avatarLetters}
          </div>
          <div className={styles.leadName}>{displayName}</div>
          <div className={styles.leadSub}>{lead.company || ''}</div>
          <div className={styles.leadPhone}>{lead.phone}</div>
        </div>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {state === 'error' && (
          <div className={styles.errorBox}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Call could not connect</strong>
              {error && (
                <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Simulation notice ─────────────────────────────────────────── */}
        {!CALLING_CONFIGURED && !isEnded && state !== 'sim_ended' && (
          <div className={styles.noticeBox}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Simulation mode.</strong>{' '}
              Set <code>VITE_TOKEN_ENDPOINT</code> in <code>.env</code> and start
              the backend server to enable live Twilio calls.{' '}
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                Twilio Console <ExternalLink size={10} />
              </a>
            </span>
          </div>
        )}

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className={styles.controls}>

          {/* Mute */}
          <button
            id="call-mute-btn"
            className={`${styles.ctrlBtn} ${muted ? styles.ctrlActive : ''}`}
            onClick={handleMute}
            disabled={ctrlDisabled}
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* End call */}
          <button
            id="call-end-btn"
            className={styles.endBtn}
            onClick={CALLING_CONFIGURED ? handleEnd : handleSimEnd}
            disabled={endDisabled}
            aria-label="End call"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>

          {/* Speaker (UI only – audio routing via OS/browser) */}
          <button
            id="call-speaker-btn"
            className={`${styles.ctrlBtn} ${speakerOff ? styles.ctrlActive : ''}`}
            onClick={() => setSpeakerOff(v => !v)}
            disabled={ctrlDisabled}
            aria-label={speakerOff ? 'Unmute speaker' : 'Mute speaker'}
            title={speakerOff ? 'Speaker on' : 'Speaker off'}
          >
            {speakerOff ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{speakerOff ? 'Speaker on' : 'Speaker'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
