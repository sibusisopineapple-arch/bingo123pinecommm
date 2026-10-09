import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Volume2, VolumeX, CheckCircle2, ChevronRight, Binary } from 'lucide-react';

interface SburaIntroAnimationProps {
  userName?: string;
  userRole?: string;
  onComplete: () => void;
}

const TOTAL_DURATION_MS = 10000; // 10 seconds

export const SburaIntroAnimation: React.FC<SburaIntroAnimationProps> = ({
  userName = 'USAP Member',
  userRole = 'STUDENT',
  onComplete
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const speechRef = useRef<boolean>(false);

  // Play polite voice greeting saying "Welcome to USAP Community School"
  const speakWelcome = (targetName: string) => {
    if (speechRef.current || soundMuted) return;
    speechRef.current = true;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `Welcome to USAP Community School, ${targetName || 'Member'}.`
        );
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis prevented by browser:', e);
      }
    }

    // Play sweet ambient audio chime via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const notes = [659.25, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0.001, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 1.25);
        });
      }
    } catch {}
  };

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const current = Date.now() - startTime;
      if (current >= TOTAL_DURATION_MS) {
        setElapsedMs(TOTAL_DURATION_MS);
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 300);
      } else {
        setElapsedMs(current);
      }
    }, 50);

    // Trigger voice "Welcome" at 1.5 seconds into the sequence
    const voiceTimer = setTimeout(() => {
      speakWelcome(userName);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(voiceTimer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, [userName, onComplete]);

  const progressPercent = Math.min(100, Math.floor((elapsedMs / TOTAL_DURATION_MS) * 100));
  const remainingSeconds = Math.max(0, Math.ceil((TOTAL_DURATION_MS - elapsedMs) / 1000));

  // Dynamic hacker loading phase text during the 10-second sequence
  const getLoadingStatus = () => {
    if (elapsedMs < 2500) {
      return {
        stage: '01 / 04',
        text: '> [DECRYPT] Establishing root terminal to USAP academic security grid...',
        badge: 'INITIALIZING PROTOCOL'
      };
    }
    if (elapsedMs < 5000) {
      return {
        stage: '02 / 04',
        text: '> [SBURA_AUTH] New individual detected. Injecting encrypted clearance...',
        badge: 'NEW INDIVIDUAL VERIFIED'
      };
    }
    if (elapsedMs < 7500) {
      return {
        stage: '03 / 04',
        text: '> [SYNC] Decrypting timetables, test rooms, office hours & alarms...',
        badge: 'DATA STREAM COMPILED'
      };
    }
    return {
      stage: '04 / 04',
      text: `> [ACCESS_GRANTED] Welcome to USAP Community School, ${userName}!`,
      badge: 'SECURITY CLEARANCE ACCEPTED'
    };
  };

  const status = getLoadingStatus();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-[#030712] text-white select-none overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, #052e16 0%, #03150d 35%, #020617 75%, #010409 100%)'
      }}
    >
      {/* Background Matrix Rain / Cyber Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(34, 197, 94, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(34, 197, 94, 0.15) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-400 shadow-lg shadow-emerald-950/60">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider">SBURA_ROOT_TERMINAL // NEW_LOGIN</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundMuted((prev) => !prev)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 transition"
            title={soundMuted ? 'Unmute welcome voice' : 'Mute voice'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onComplete}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-xs font-bold font-mono text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 active:scale-95"
          >
            <span>Skip ({remainingSeconds}s)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Animation Stage */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center max-w-2xl w-full px-2">
        {/* Title: SBURA THE QUESTION MAN? */}
        <div className="mb-3 space-y-1 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono uppercase tracking-widest font-black">
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
            <span>USAP Security Master Protocol</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_25px_rgba(34,197,94,0.7)]">
            SBURA THE QUESTION MAN?
          </h1>
        </div>

        {/* Center Graphic: Black Shadow of a Man Behind a Laptop, like a Hacker */}
        <div className="relative flex items-center justify-center my-1 sm:my-2">
          {/* Ambient Hacker Screen Green Light Halo */}
          <div className="absolute w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full bg-gradient-to-b from-emerald-500/25 via-cyan-500/15 to-transparent blur-3xl pointer-events-none -top-12" />

          {/* Floating Neon Question Mark that FADES IN AND OUT */}
          <div
            className="absolute -top-6 -right-2 sm:-right-8 z-30 select-none pointer-events-none"
            style={{
              animation: 'sburaFadeInOut 2.2s ease-in-out infinite'
            }}
          >
            <span className="font-mono font-black text-6xl sm:text-8xl text-emerald-300 drop-shadow-[0_0_25px_rgba(34,197,94,1)] drop-shadow-[0_0_50px_rgba(6,182,212,0.85)]">
              ?
            </span>
          </div>

          {/* SVG: Black shadow of a hacker hunched behind a glowing laptop */}
          <div className="relative z-20 w-72 sm:w-96 md:w-[420px] h-60 sm:h-72 flex items-center justify-center">
            <svg
              viewBox="0 0 460 340"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
            >
              <defs>
                {/* Glowing hacker green beam casting upwards from laptop screen */}
                <linearGradient id="hackerScreenBeam" x1="230" y1="260" x2="230" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#10b981" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>

                {/* Pitch black hacker body shadow */}
                <linearGradient id="hackerShadow" x1="230" y1="30" x2="230" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#131c19" />
                  <stop offset="40%" stopColor="#080d0b" />
                  <stop offset="100%" stopColor="#010302" />
                </linearGradient>

                {/* Matrix green screen reflection on hacker's hoodie rim & face */}
                <linearGradient id="hackerGlowRim" x1="230" y1="120" x2="230" y2="230" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>

                <filter id="matrixTerminalBlur" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Intense Glowing Screen Light Cone shining upward onto hacker */}
              <polygon
                points="140,250 320,250 410,50 50,50"
                fill="url(#hackerScreenBeam)"
                className="opacity-80 animate-pulse"
                style={{ animationDuration: '2.5s' }}
              />

              {/* HACKER: Hunched silhouette with hood (Black shadow of man behind laptop) */}
              {/* Broad shoulders / torso in shadows */}
              <path
                d="M70 330 C70 240, 110 200, 160 190 L175 180 C170 160, 165 145, 160 120 C155 70, 190 35, 230 35 C270 35, 305 70, 300 120 C295 145, 290 160, 285 180 L300 190 C350 200, 390 240, 390 330 Z"
                fill="url(#hackerShadow)"
              />

              {/* Hacker Hoodie Outline / Shadow Rim */}
              <path
                d="M165 110 C165 60, 195 40, 230 40 C265 40, 295 60, 295 110 C295 140, 285 165, 275 180 C260 195, 245 200, 230 200 C215 200, 200 195, 185 180 C175 165, 165 140, 165 110 Z"
                fill="#030705"
              />

              {/* Shadow face with dark hacker shades reflecting green matrix code */}
              <ellipse cx="230" cy="125" rx="38" ry="46" fill="#020504" />
              {/* Hacker Glasses / Shades Frame */}
              <rect x="200" y="115" width="26" height="14" rx="4" fill="#000000" stroke="#22c55e" strokeWidth="1.5" />
              <rect x="234" y="115" width="26" height="14" rx="4" fill="#000000" stroke="#22c55e" strokeWidth="1.5" />
              <line x1="226" y1="120" x2="234" y2="120" stroke="#22c55e" strokeWidth="1.5" />
              {/* Matrix Green reflection on hacker's shades lenses */}
              <line x1="204" y1="122" x2="222" y2="122" stroke="#4ade80" strokeWidth="2" />
              <line x1="238" y1="122" x2="256" y2="122" stroke="#4ade80" strokeWidth="2" />

              {/* Shadow Chin reflection */}
              <path
                d="M210 150 C220 162, 240 162, 250 150 C242 165, 218 165, 210 150 Z"
                fill="url(#hackerGlowRim)"
              />

              {/* Hacker hands typing rapidly in the dark on the glowing keyboard */}
              <ellipse cx="165" cy="265" rx="24" ry="14" fill="#050a07" />
              <ellipse cx="295" cy="265" rx="24" ry="14" fill="#050a07" />

              {/* LAPTOP: Backlid, inner display, glowing matrix screen & keyboard */}
              {/* Laptop Screen Outer Case */}
              <polygon points="120,250 340,250 330,135 130,135" fill="#051009" stroke="#22c55e" strokeWidth="2.5" />
              {/* Laptop Screen Display Window */}
              <polygon points="126,245 334,245 325,142 135,142" fill="#02140a" className="opacity-95" />

              {/* Live Matrix Streams / Code text on Hacker's laptop display */}
              <g className="font-mono font-bold" fontSize="9" fill="#22c55e">
                <text x="142" y="158">&gt; SBURA_ROOT: clearance_check()</text>
                <text x="142" y="172" fill="#86efac">&gt; 01101001 01101110 01101001</text>
                <text x="142" y="186" fill="#67e8f9">&gt; AUTH: NEW_INDIVIDUAL [ACCEPTED]</text>
                <text x="142" y="200" fill="#22c55e">&gt; BYPASS_FIREWALL // 0x7FFD2B</text>
                <text x="142" y="214" fill="#4ade80">&gt; DECRYPT_USAP_RECORDS: OK</text>
                <text x="142" y="228" fill="#bbf7d0">&gt; WELCOME_TO_CAMPUS...</text>
              </g>

              {/* Center hacker question mark symbol on the laptop */}
              <text x="222" y="240" fill="#22c55e" fontSize="24" fontWeight="900" fontFamily="monospace">
                ?
              </text>

              {/* Laptop Base & Illuminated Keyboard */}
              <polygon points="90,285 370,285 340,250 120,250" fill="#07130a" stroke="#14532d" strokeWidth="2" />
              {/* Keyboard backlight lines */}
              <line x1="140" y1="258" x2="320" y2="258" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="6 3" />
              <line x1="130" y1="268" x2="330" y2="268" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="8 4" />
              <line x1="120" y1="278" x2="340" y2="278" stroke="#4ade80" strokeWidth="2.5" strokeDasharray="10 4" />

              {/* Laptop Trackpad */}
              <rect x="205" y="272" width="50" height="9" rx="2" fill="#0f2918" stroke="#22c55e" strokeWidth="1" />

              {/* Desk surface shadow */}
              <ellipse cx="230" cy="295" rx="190" ry="16" fill="#000000" className="opacity-90" />
            </svg>
          </div>
        </div>

        {/* Text directly under the shadow / laptop: SBURA */}
        <div className="mt-1 mb-4 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl sm:text-5xl font-black font-mono tracking-[0.4em] sm:tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_20px_rgba(34,197,94,0.9)]">
              SBURA
            </span>
          </div>
          <div className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 font-extrabold uppercase mt-1">
            THE QUESTION MAN // CAMPUS MAINFRAME GUARDIAN
          </div>
        </div>

        {/* Loading text and loading animation under the black figure */}
        <div className="w-full max-w-lg space-y-3 bg-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 backdrop-blur-md shadow-2xl">
          {/* Progress Bar & Percentage */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{status.badge}</span>
            </span>
            <span className="text-cyan-400 font-black tracking-wider">
              {progressPercent}% • {remainingSeconds}s
            </span>
          </div>

          {/* Loading Animation: Hacker Matrix Progress Bar (10 Seconds) */}
          <div className="relative w-full h-3 bg-black rounded-full overflow-hidden border border-emerald-500/40 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-300 transition-all duration-75 relative shadow-[0_0_15px_rgba(34,197,94,0.9)]"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Traveling neon scanline */}
              <div
                className="absolute inset-0 bg-white/40 animate-pulse"
                style={{ animationDuration: '1s' }}
              />
            </div>
          </div>

          {/* Loading Text under the black figure */}
          <div className="min-h-[44px] flex items-center justify-center">
            <p className="text-xs sm:text-sm font-mono text-emerald-200 font-medium tracking-wide animate-in fade-in duration-300">
              {status.text}
            </p>
          </div>

          {/* Say Welcome While The App Starts */}
          <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Welcome to USAP Community School, {userName}!</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-mono">Role: {userRole}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="relative z-10 w-full max-w-4xl text-center text-[10px] font-mono text-emerald-500/60 pb-1">
        USAP COMMUNITY SCHOOL • HACKER SECURITY GATEWAY • SBURA THE QUESTION MAN
      </div>

      {/* Embedded Keyframe CSS for Question Mark Fade In and Out */}
      <style>{`
        @keyframes sburaFadeInOut {
          0%, 100% {
            opacity: 0.12;
            transform: scale(0.92) translateY(6px);
            filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.4));
          }
          50% {
            opacity: 1;
            transform: scale(1.14) translateY(-6px);
            filter: drop-shadow(0 0 35px rgba(34, 197, 94, 1)) drop-shadow(0 0 60px rgba(6, 182, 212, 0.9));
          }
        }
      `}</style>
    </div>
  );
};
