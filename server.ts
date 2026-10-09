import express from 'express';
import type { Request, Response } from 'express';
import nodemailer, { type Transporter } from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory verification token storage with 10-minute expiry
interface VerificationRecord {
  code: string;
  email: string;
  name: string;
  studentClass: string;
  createdAt: number;
}
const verificationTokens = new Map<string, VerificationRecord>();

// Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of verificationTokens.entries()) {
    if (now - data.createdAt > 15 * 60 * 1000) {
      verificationTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Transporter configuration: uses SMTP if provided in environment, or fallback test transport
let cachedTransporter: Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback test account (Ethereal)
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      cachedTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return cachedTransporter;
}

// Dedicated portal link for student to view a copy of the official message sent by SBURA THE QUESTION MAN
app.get(['/sbura-message/:token', '/verify-code-portal/:token'], (req: Request, res: Response) => {
  const { token } = req.params;
  const record = verificationTokens.get(token);

  if (!record || Date.now() - record.createdAt > 30 * 60 * 1000) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>USAP Verification Message Expired</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div class="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl font-black">!</div>
          <h2 class="text-xl font-black text-slate-900 mb-2">Message Copy Expired</h2>
          <p class="text-xs text-slate-600 mb-6">This security message copy has expired. Please generate a fresh verification link from the USAP platform.</p>
          <a href="/" class="inline-block px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md">Return to Login</a>
        </div>
      </body>
      </html>
    `);
    return;
  }

  const timestampStr = new Date(record.createdAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Copy of Message Sent by SBURA THE QUESTION MAN — USAP</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-center p-4">
      <div class="max-w-lg w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-purple-200">
        <!-- School Banner Header -->
        <div class="flex items-center justify-between border-b border-purple-100 pb-4 mb-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-base shadow-md">
              U
            </div>
            <div class="text-left">
              <div class="font-black text-sm text-slate-900 leading-tight">USAP Community School</div>
              <div class="text-[10px] text-purple-700 font-extrabold uppercase">Official Verification Dispatch</div>
            </div>
          </div>
          <span class="text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            Authorized Copy
          </span>
        </div>

        <!-- Sender Banner: SBURA THE QUESTION MAN -->
        <div class="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md mb-5 text-left border border-purple-400/20">
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
              ✉️
            </div>
            <div>
              <div class="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest">
                Official Message Sent By
              </div>
              <div class="text-lg font-black text-white tracking-wide">
                SBURA THE QUESTION MAN
              </div>
              <div class="text-xs text-purple-200 mt-0.5">
                Verification Officer & Security Dispatcher • USAP Community School
              </div>
            </div>
          </div>
        </div>

        <!-- Official Message Metadata -->
        <div class="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 mb-5 text-left text-xs space-y-2 font-medium text-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Addressed To:</span>
            <strong class="text-slate-900">${record.name}</strong>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Student Class:</span>
            <span class="font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">${record.studentClass}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Student Email Account:</span>
            <span class="font-mono font-bold text-purple-950">${record.email}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Time Dispatched:</span>
            <span class="font-mono text-slate-600">${timestampStr}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Security Clearance:</span>
            <span class="text-emerald-700 font-bold">✓ Official School Link Copy</span>
          </div>
        </div>

        <!-- The Message Body & 6-Digit Code -->
        <div class="bg-slate-50 border-2 border-dashed border-purple-300 rounded-2xl p-5 mb-5 text-left">
          <div class="text-[11px] font-extrabold uppercase text-purple-800 tracking-wider mb-2">
            Transcript of Message Sent by SBURA THE QUESTION MAN:
          </div>
          <p class="text-xs text-slate-700 leading-relaxed mb-4 italic">
            "Hello <strong>${record.name}</strong>, this is the official authorized security message for your USAP Community School platform access. Your 6-digit verification code is presented below. Please enter this code in the login verification dialog to complete your student account activation."
          </p>

          <div class="bg-white border-2 border-purple-500 rounded-2xl p-4 text-center shadow-inner">
            <div class="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">
              Your 6-Digit Verification Code
            </div>
            <div class="text-4xl sm:text-5xl font-black font-mono tracking-[0.25em] text-purple-950 select-all my-2" id="codeDisplay">
              ${record.code}
            </div>
            <div class="text-[11px] text-slate-500 font-semibold">
              Copy this code and return to the main USAP window to enter it.
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2.5">
          <button onclick="copyCode()" id="btnCopy" class="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2">
            <span>Copy Verification Code (${record.code})</span>
          </button>
          <a href="/" class="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center">
            Return to USAP Platform Tab
          </a>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium space-y-1 text-center">
          <div class="text-[10px] font-black text-purple-900 uppercase tracking-wider">
            USAP Core Values: Integrity • Curiosity • Equality • Service • Community
          </div>
          <div class="text-slate-400 text-[10px]">
            sburathequestionman.co.za in partnership with pineapplemieh🍍.co.zw
          </div>
        </div>
      </div>

      <script>
        function copyCode() {
          navigator.clipboard.writeText('${record.code}').then(() => {
            const b = document.getElementById('btnCopy');
            b.innerText = 'Copied to Clipboard!';
            b.classList.remove('bg-purple-600');
            b.classList.add('bg-emerald-600');
            setTimeout(() => {
              b.innerText = 'Copy Verification Code (${record.code})';
              b.classList.remove('bg-emerald-600');
              b.classList.add('bg-purple-600');
            }, 2500);
          });
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint to generate verification link to the copy of message sent by SBURA THE QUESTION MAN (no external email used)
app.post('/api/send-verification-code', (req: Request, res: Response) => {
  const { email, name, studentClass, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: 'Email and verification code are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail.endsWith('@usapschool.org')) {
    res.status(400).json({ error: 'Only @usapschool.org school emails are permitted.' });
    return;
  }

  // Generate secure token for the dedicated link
  const secureToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  verificationTokens.set(secureToken, {
    code,
    email,
    name: name || 'Student',
    studentClass: studentClass || 'LOWER 6X',
    createdAt: Date.now()
  });

  const portalLink = `/sbura-message/${secureToken}`;

  // Return link to the message copy sent by SBURA THE QUESTION MAN (NO external email or Education Matters)
  res.json({
    success: true,
    sender: "SBURA THE QUESTION MAN",
    portalLink: portalLink,
    messageCopyUrl: portalLink,
    recipient: email,
    studentName: name || 'Student',
    studentClass: studentClass || 'LOWER 6X',
    messageNotice: "Official message link generated by SBURA THE QUESTION MAN"
  });
});

// Setup Vite in middleware mode for dev and static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback GET handler for SPA
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      try {
        const url = req.originalUrl;
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`USAP Community School Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
