# ✨ ExtraAI — Advanced AI Assistant

Premium multilingual AI app for Android. Chat, generate images, analyze photos/PDFs, voice input, code — all in one.

---

## 📚 Guides (Read In This Order)

1. **`MASTER_GUIDE.md`** ⭐ — Complete overview: accounts, AdMob, files, sequence
2. **`TERMUX_PROFESSIONAL_BUILD.md`** — Termux se AAB banane ka step-by-step
3. **`PRIVACY_POLICY.md`** — Play Store ke liye privacy policy

---

## ⚡ Quick Start

### Files You Need To Edit (Only 2):
1. **`.env`** — Copy from `.env.example`, add:
   - `DATABASE_URL` (Neon.tech)
   - `GROQ_API_KEY` (console.groq.com)
   - `GEMINI_API_KEY` (aistudio.google.com/apikey)

2. **`src/config/admob.ts`** — Replace AdMob IDs:
   - Set `ADMOB_ENABLED: true`
   - Add your 3 IDs (App, Banner, Interstitial)

### Local Test:
```bash
npm install
npx drizzle-kit push
npm run build
npm start
```

### Termux Build (Full Pipeline):
```bash
bash termux-setup-ubuntu.sh init      # Install Ubuntu
proot-distro login ubuntu             # Enter Ubuntu
bash termux-setup-ubuntu.sh sdk       # Install Android SDK
bash termux-setup-ubuntu.sh build https://YOUR-URL.vercel.app
```

---

## 🎯 Features

- ✅ AI Chat (Hindi/English/multilingual, streaming)
- ✅ HD Image Generation (Flux via Pollinations)
- ✅ Image Analysis (Gemini vision)
- ✅ PDF Upload & Q&A
- ✅ Voice Input + Text-to-Speech
- ✅ Auto conversation context (12 messages)
- ✅ Chat history sidebar
- ✅ PDF export
- ✅ AdMob ads (banner + interstitial)
- ✅ Premium pink UI, splash screen

---

## 🏗️ Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- PostgreSQL + Drizzle ORM
- Tailwind CSS
- Pollinations AI (free) + Groq + Gemini (multi-provider)

---

## 📱 Publish To Play Store

Complete guide in `MASTER_GUIDE.md` + `TERMUX_PROFESSIONAL_BUILD.md`.

Quick flow:
1. Set up accounts (Neon, Groq, Gemini, AdMob)
2. Fill `.env` + `src/config/admob.ts`
3. Termux + Ubuntu + Bubblewrap → AAB
4. Vercel deploy for hosting
5. Play Console upload → 14-day testing → LIVE
