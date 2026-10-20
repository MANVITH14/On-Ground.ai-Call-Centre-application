import { useState, useEffect, useRef } from 'react';
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Phone, AlertTriangle, Info, ExternalLink
} from 'lucide-react';
import styles from './CallDialog.module.css';

/**
 * CallDialog – Browser-based calling interface
 *
 * CALLING PROVIDER: Twilio Voice SDK (twilio-voice-sdk)
 * Setup required before calls go live — see .env.example and README.md.
 *
 * In this build the UI is fully implemented with real Twilio SDK integration
 * points. Calls will enter SIMULATION mode when credentials are not configured,
 * displaying a clear "SIMULATION" label so no one is misled.
 *
 * Production path:
 *  1. Create a Twilio account → https://www.twilio.com/
 *  2. Buy/verify a phone number (caller ID)
 *  3. Create a TwiML Application pointing to your /token endpoint
 *  4. Set VITE_TWILIO_TOKEN_ENDPOINT in .env (never expose account SID/auth)
 *  5. Deploy a minimal server (see server/ in README) that returns a Twilio
 *     Capability/Access Token signed with your Account SID and API Secret.
 */

const TWILIO_TOKEN_URL = import.meta.env.VITE_TWILIO_TOKEN_ENDPOINT || null;
const CALLING_CONFIGURED = !!TWILIO_TOKEN_URL;

function useTimer(running) {
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
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function CallDialog({ call, onEnd }) {
  const { lead } = call;

  // Call state machine: idle → connecting → active → ended
  const [callState, setCallState] = useState('connecting');
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [twilioDevice, setTwilioDevice] = useState(null);
  const [twilioConn, setTwilioConn] = useState(null);
  const [error, setError] = useState(null);
  const secs = useTimer(callState === 'active');

  /* ── Twilio SDK initialisation ─────────────────────────────────────────── */
  useEffect(() => {
    if (!CALLING_CONFIGURED) {
      // SIMULATION mode: auto-connect after 2s
      const t = setTimeout(() => setCallState('active'), 2000);
      return () => clearTimeout(t);
    }

    let device;
    let cancelled = false;

    (async () => {
      try {
        // Dynamically import Twilio SDK
        // The package spec uses /* webpackIgnore */ hint pattern for bundlers.
        // We use a variable import path trick to prevent Vite from trying to
        // pre-bundle @twilio/voice-sdk which may not be installed yet.
        const pkgName = '@twilio/voice-sdk';
        const twilioModule = await import(/* @vite-ignore */ pkgName).catch(() => {
          throw new Error(
            `@twilio/voice-sdk not installed.\nRun: npm install @twilio/voice-sdk\nSee README for full Twilio setup.`
          );
        });
        const { Device } = twilioModule;

        const res = await fetch(TWILIO_TOKEN_URL, { method: 'POST' });
        if (!res.ok) throw new Error(`Token endpoint returned ${res.status}`);
        const { token } = await res.json();

        device = new Device(token, { logLevel: 1 });
        await device.register();

        if (cancelled) { device.destroy(); return; }
        setTwilioDevice(device);

        const conn = await device.connect({
          params: {
            To: lead.phone,
            From: '+1XXXXXXXXXX', // set VITE_TWILIO_FROM_NUMBER in .env
          },
        });

        conn.on('accept',     () => setCallState('active'));
        conn.on('disconnect', () => { setCallState('ended'); setTimeout(onEnd, 1200); });
        conn.on('error',      err => { setError(err.message); setCallState('error'); });

        setTwilioConn(conn);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setCallState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (device) { try { device.destroy(); } catch (_) {} }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = () => {
    if (twilioConn) {
      try { twilioConn.disconnect(); } catch (_) {}
    }
    setCallState('ended');
    setTimeout(onEnd, 800);
  };

  const handleMute = () => {
    if (twilioConn) { try { twilioConn.mute(!muted); } catch (_) {} }
    setMuted(m => !m);
  };

  const displayName = lead.name || lead.company || 'Unknown';
  const avatarLetters = displayName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Active call">
      <div className={styles.dialog}>
        {/* Status bar */}
        <div className={`${styles.statusBar} ${styles[callState]}`}>
          {callState === 'connecting' && <><span className={styles.pulse} /> Connecting…</>}
          {callState === 'active'     && <><span className={styles.activeDot} /> {formatDur(secs)}</>}
          {callState === 'ended'      && 'Call Ended'}
          {callState === 'error'      && <><AlertTriangle size={13} /> Call Failed</>}
          {!CALLING_CONFIGURED && (
            <span className={styles.simLabel} title="Twilio credentials not configured. See .env.example">
              SIMULATION
            </span>
          )}
        </div>

        {/* Lead info */}
        <div className={styles.leadInfo}>
          <div className={`${styles.callAvatar} avatar avatar-lg avatar-green`}>{avatarLetters}</div>
          <div className={styles.leadName}>{displayName}</div>
          <div className={styles.leadSub}>{lead.company || lead.phone}</div>
          <div className={styles.leadPhone}>{lead.phone}</div>
        </div>

        {/* Error state */}
        {callState === 'error' && (
          <div className={styles.errorBox}>
            <AlertTriangle size={14} />
            <div>
              <strong>Call could not connect</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Provider notice */}
        {!CALLING_CONFIGURED && callState !== 'ended' && (
          <div className={styles.noticeBox}>
            <Info size={13} />
            <span>
              <strong>Simulation mode.</strong> Set <code>VITE_TWILIO_TOKEN_ENDPOINT</code> in <code>.env</code> to
              enable live Twilio calls. See README for setup.{' '}
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer">
                Twilio Console <ExternalLink size={10} />
              </a>
            </span>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.ctrlBtn} ${muted ? styles.ctrlActive : ''}`}
            onClick={handleMute}
            disabled={callState !== 'active'}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            className={`${styles.endBtn}`}
            onClick={handleEnd}
            disabled={callState === 'ended'}
            aria-label="End call"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>

          <button
            className={`${styles.ctrlBtn} ${speakerOff ? styles.ctrlActive : ''}`}
            onClick={() => setSpeakerOff(v => !v)}
            disabled={callState !== 'active'}
            aria-label={speakerOff ? 'Speaker on' : 'Speaker off'}
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
