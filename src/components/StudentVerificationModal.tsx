import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Sparkles
} from 'lucide-react';
import { UsapLogo } from './UsapLogo';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
  email: string;
  studentName: string;
  studentClass: string;
  initialCode?: string;
  onVerified: (code: string) => void;
  onCancel: () => void;
}

export const StudentVerificationModal: React.FC<Props> = ({
  email,
  studentName,
  studentClass,
  initialCode = "782914",
  onVerified,
  onCancel,
}) => {
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInlineMessageCopy, setShowInlineMessageCopy] = useState(true);

  // Generate link to official copy of message sent by SBURA THE QUESTION MAN
  const generateMessageLink = async (codeToSend: string) => {
    setIsGeneratingLink(true);
    setErrorMsg(null);

    // 1. Generate via server endpoint (creates /sbura-message/:token, no external email used)
    try {
      const res = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: studentName,
          studentClass,
          code: codeToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.portalLink) {
          setPortalLink(data.portalLink);
        }
      } else {
        // Fallback local token
        const localToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        setPortalLink(`/sbura-message/${localToken}`);
      }
    } catch {
      const localToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      setPortalLink(`/sbura-message/${localToken}`);
    }

    // 2. Persist in Firestore
    try {
      const cleanEmailKey = email.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'verification_codes', cleanEmailKey), {
        email,
        code: codeToSend,
        studentName,
        studentClass,
        sender: "SBURA THE QUESTION MAN",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    } catch {
      // Ignored if offline
    } finally {
      setIsGeneratingLink(false);
    }
  };

  useEffect(() => {
    generateMessageLink(currentCode);
  }, []);

  const handleVerify = () => {
    if (inputCode.trim() !== currentCode) {
      setErrorMsg("Incorrect verification code. Please check the copy of the message from SBURA THE QUESTION MAN and enter the 6-digit code.");
      return;
    }
    setErrorMsg(null);
    onVerified(inputCode.trim());
  };

  const handleResend = () => {
    const newRandomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentCode(newRandomCode);
    generateMessageLink(newRandomCode);
  };

  // Full URL for the message link
  const fullMessageUrl = portalLink
    ? `${window.location.origin}${portalLink}`
    : `${window.location.origin}/sbura-message/direct`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullMessageUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopiedCode(true);
      setInputCode(currentCode);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-2 border-purple-200 animate-in fade-in zoom-in-95 my-4">
        {/* Header with School Logo */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
          <UsapLogo size="sm" />
          <span className="text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Authorized Message Link</span>
          </span>
        </div>

        {/* Sender Banner: SBURA THE QUESTION MAN */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md mb-4 text-left border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
              ✉️
            </div>
            <div>
              <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest">
                Official Verification Sender
              </div>
              <div className="text-base font-black text-white tracking-wide">
                SBURA THE QUESTION MAN
              </div>
              <div className="text-xs text-purple-200 mt-0.5">
                Verification Officer & Security Dispatcher • USAP Community School
              </div>
            </div>
          </div>
        </div>

        {/* Notice of Message Link (No external email / Education Matters) */}
        <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 mb-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-purple-950">
              {isGeneratingLink ? (
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>
                {isGeneratingLink
                  ? "Generating message link..."
                  : "Link to Copy of Message Ready"}
              </span>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200">
              Authorized Dispatch
            </span>
          </div>

          <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
            Instead of email servers, verification is issued directly through <strong>a secure link to a copy of the official message sent by SBURA THE QUESTION MAN</strong>.
          </p>

          {/* Primary Action: Open Link to Message Copy */}
          <div className="pt-1 space-y-2">
            <a
              href={fullMessageUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>Open Link to Copy of Message from SBURA THE QUESTION MAN</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 bg-white border border-purple-300 hover:bg-purple-50 text-purple-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Link to Message"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInlineMessageCopy(!showInlineMessageCopy)}
                className="py-2 px-3 bg-purple-100 border border-purple-300 hover:bg-purple-200 text-purple-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
              >
                {showInlineMessageCopy ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showInlineMessageCopy ? "Hide Message Copy" : "Preview Message Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* INLINE OFFICIAL MESSAGE COPY DISPLAY */}
        {showInlineMessageCopy && (
          <div className="bg-slate-50 border-2 border-purple-200 rounded-2xl p-4 mb-4 text-left space-y-2.5">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                <MessageSquareQuote className="w-4 h-4 text-purple-600" />
                <span>Transcript of Message Sent by SBURA THE QUESTION MAN</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Official Copy</span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 font-medium bg-white p-2.5 rounded-xl border border-slate-200">
              <div><strong>To:</strong> {studentName} ({email})</div>
              <div><strong>Class:</strong> {studentClass}</div>
              <div><strong>Sender:</strong> SBURA THE QUESTION MAN (USAP Security & Verification)</div>
            </div>

            <p className="text-xs text-slate-700 italic leading-relaxed">
              "Dear {studentName}, this is your authorized security message copy. Use the 6-digit access code below to verify and activate your student account on the USAP platform."
            </p>

            <div className="bg-white border-2 border-dashed border-purple-400 rounded-xl p-3 text-center space-y-1">
              <div className="text-[10px] font-black uppercase text-purple-700 tracking-wider">
                6-Digit Verification Code
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-[0.25em] text-purple-950 select-all">
                {currentCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-1 inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-[11px] font-bold border border-purple-200"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
                <span>{copiedCode ? "Code Copied & Filled!" : "Copy Code into Input"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Verification Code Input */}
        <div className="space-y-2 mb-4 text-left">
          <label className="block text-xs font-black text-slate-800">
            Enter 6-Digit Code from SBURA THE QUESTION MAN's Message:
          </label>
          <input
            type="text"
            maxLength={6}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            className="w-full py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.3em] bg-slate-50 border-2 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-600 focus:bg-white text-purple-900"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2 mb-4 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleVerify}
            disabled={inputCode.length !== 6}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm 6-Digit Code & Activate Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleResend}
              disabled={isGeneratingLink}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingLink ? 'animate-spin' : ''}`} />
              <span>Generate new link from SBURA THE QUESTION MAN</span>
            </button>

            <button
              onClick={onCancel}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
