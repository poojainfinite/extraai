# 🚀 ExtraAI — START HERE (Aap Ki Confusions Ka Final Jawab)

**Yeh sabse pehli file hai jo aap padhें.** Baaki guides baad mein.

---

# ✅ KYA PRE-CONFIGURED HAI (Aap Ne Kuch Nahi Karna)

Maine aap ki di gayi **REAL AdMob IDs** app mein daal di hain. Ab yeh live hain:

| Setting | Value |
|---|---|
| **AdMob App ID** | `ca-app-pub-4660632592314579~8800928675` |
| **Banner Ad Unit** | `ca-app-pub-4660632592314579/3077828705` |
| **Interstitial Ad Unit** | `ca-app-pub-4660632592314579/8274315062` |
| **Ads Enabled** | ✅ TRUE (publish hote hi chalu) |
| **Support Email** | `extraai.support@gmail.com` |
| **Package Name** | `com.extraai.app` |
| **App Name** | ExtraAI |

**Aap ko AdMob IDs kuch bhi replace nahi karni. Publish hote hi automatic ads chalu.**

---

# ⚠️ SECURITY ALERT (Padhें Zaroor)

Aap ne live chat mein **Groq aur Gemini API keys share ki thi** — yeh public log ho gayi hain. Iska matlab:
- Koi bhi un keys ko copy karke misuse kar sakta hai
- Aap ka daily quota koi aur khatam kar dega
- Aap ka Groq/Gemini account rate limit ho sakta hai

**Turant karें:**
1. **Groq key REVOKE:** https://console.groq.com/keys → old key delete → **NEW key create**
2. **Gemini key REVOKE:** https://aistudio.google.com/apikey → old key delete → **NEW key create**
3. Nayi keys **kabhi kisi ko na batayें** — sirf `.env` mein daalें
4. **AdMob IDs safe hain** (public hoti hain naturally)

---

# 📋 AAP KO SIRF 2 CHEEZEN KARNI HAIN

## Kaam 1: `.env` File Banao (2 Minute)

`.env` file **project mein hai nahi** by default (security ke liye). Aap ko banani hai.

### Steps:

**Termux mein (jab aap `extraai` folder mein ho):**

```bash
# .env.example file ko copy karke .env banao
cp .env.example .env

# Ab is file ko edit karें
nano .env
```

**Aap ko yeh dikhega:**
```env
GROQ_API_KEY=PASTE_YOUR_FRESH_GROQ_KEY_HERE
GEMINI_API_KEY=PASTE_YOUR_FRESH_GEMINI_KEY_HERE
```

**Steps:**
1. `PASTE_YOUR_FRESH_GROQ_KEY_HERE` ko delete karें
2. Waha apni **NEW Groq key** paste karें (jo aap ne revoke ke baad banayi)
3. Same karें `PASTE_YOUR_FRESH_GEMINI_KEY_HERE` ke saath
4. Save: `Ctrl+O` → Enter → `Ctrl+X`

**Final `.env` file kuch aisi dikhegi:**
```env
GROQ_API_KEY=gsk_YourNewFreshKey1234567890
GEMINI_API_KEY=AIzaSyYourNewFreshKey1234567890
```

**Bas! `.env` ready.**

## Kaam 2: Termux Build

`TERMUX_PROFESSIONAL_BUILD.md` follow karें. Ya automation script:
```bash
bash termux-setup-ubuntu.sh init
```

---

# 🎯 ADS KAB DIKHENGE (Complete Explanation)

## Aap Ka Sawaal:
> "User app kholegi to kab tak ads dikhenge?"

## 1. BANNER AD

**Kab:** App khulते hi bottom pe **immediately** dikhega
**Kaisa:** Small 50px height (chhota, non-intrusive)
**Kitni baar:** Hamesha visible (jab tak user Pro na khareede)

**Revenue:** Har user jo bhi time app mein spend karta hai, banner earning hoti rehti hai.

## 2. INTERSTITIAL AD (Full Screen)

**Trigger schedule (AGGRESSIVE — maximum revenue):**
1. ✅ **First ad:** 3rd message ke baad (turant)
2. ✅ **Then:** Har 5 messages baad
3. ✅ Minimum gap: 30 seconds (Play Store safe)
4. ✅ Skip button: 4 seconds ke baad
5. ✅ Pro users ko ads nahi

**Example flow:**
```
Message 1 sent  → Banner only
Message 2 sent  → Banner only
Message 3 sent  → Banner + INTERSTITIAL AD 🎯 (first ad — turant revenue)
Message 4 sent  → Banner only
Message 5 sent  → Banner only
Message 6 sent  → Banner only
Message 7 sent  → Banner only
Message 8 sent  → Banner + INTERSTITIAL AD 🎯 (2nd ad)
Message 9-12    → Banner only
Message 13 sent → Banner + INTERSTITIAL AD 🎯 (3rd ad)
Message 14-17   → Banner only
Message 18 sent → Banner + INTERSTITIAL AD 🎯 (4th ad)
... and so on (every 5 messages)
```

**Kyun yeh strategy?**
- ✅ Aggressive but Play Store compliant
- ✅ Real users 3-5 messages hi karte hain → **guaranteed 1 ad har user**
- ✅ Heavy users 20+ messages = 4-5 ads
- ✅ Maximum revenue per user
- ✅ Skip button rakhа hai → users comfortable

## 3. REAL-WORLD REVENUE EXPECTATIONS (India) — Updated with Aggressive Schedule

| Daily Users | Avg Msg/User | Interstitials/User/Day | Total Revenue/Day |
|---|---|---|---|
| 100 | 5 | ~1 | ₹200-400 |
| 1,000 | 5 | ~1 | ₹2,000-4,000 |
| 1,000 | 10 | ~2 | ₹3,500-7,000 |
| 10,000 | 5 | ~1 | ₹20,000-40,000 |
| 10,000 | 10 | ~2 | ₹35,000-70,000 |

*Estimates for Indian users. US/EU users pay 3-5x higher.*

## 4. Frequency Config File

**File:** `src/config/admob.ts`

```typescript
INTERSTITIAL_FIRST_AD_AFTER: 3,     // First ad after 3rd message
INTERSTITIAL_FREQUENCY: 5,          // Then every 5 messages
INTERSTITIAL_MIN_GAP_SECONDS: 30,   // 30 sec minimum gap
```

**Aap chahें to change kar sakti hain lekin recommendation: yehi rakho — perfect balance hai.**

---

# 📱 GOOGLE PLAY STORE 2026 REQUIREMENTS (Fully Compliant)

## Current Rules (July 2026):

| Requirement | Value | Aap Ki App Mein |
|---|---|---|
| **Target SDK (July 2026)** | 35 (Android 15) minimum | ✅ Set karें 35 ya 36 |
| **Target SDK (Aug 31, 2026+)** | 36 (Android 16) required | ✅ **Recommend: 36 abhi hi** |
| **Min SDK** | 24 (Android 7) or higher | ✅ Set 24 |
| **Signing** | Play App Signing | ✅ Bubblewrap auto |
| **App Bundle** | AAB (not APK) | ✅ Bubblewrap outputs both |
| **64-bit** | Required | ✅ Bubblewrap auto |
| **Data Safety Form** | Zaroori | ⚠️ Play Console mein bharें |
| **Privacy Policy** | Public URL | ✅ `/privacy` auto-hosted |
| **20-Tester Rule** | New apps ke liye | ⚠️ 14-day closed testing |

## 🎯 SDK Update Steps (Termux mein — Zaroori):

**Bubblewrap init karne ke baad**, `twa-manifest.json` file mein yeh 3 changes karें:

```json
"minSdkVersion": 24,       // (default 21 se badhao 24 par)
"targetSdkVersion": 36,    // 36 recommended (future-proof)
"compileSdkVersion": 36,   // 36 recommended
```

Phir yeh 2 commands:
```bash
sdkmanager "platforms;android-36" "build-tools;36.0.0"
bubblewrap update
```

**Aur `bubblewrap build`** — done. Google 2026 fully compliant.

**Detailed steps** `TERMUX_PROFESSIONAL_BUILD.md` mein Phase 7.5 mein hain.

---

# 📦 FILES CHART — Kya Le Jaana Termux Mein

**Ek line answer: POORA `extraai` folder le jaao. Kuch alag nahi karna.**

## Detailed Chart:

```
📁 extraai/                          ← YEH POORA FOLDER LE JAAO TERMUX MEIN
│
├── 📝 FILES YOU EDIT (Only 1):
│   └── .env                        ← BANANI HAI (cp .env.example .env)
│                                      → 2 keys paste karें (Groq + Gemini)
│
├── ✅ ALREADY CONFIGURED (Kuch Nahi Karna):
│   ├── src/config/admob.ts         ← AdMob IDs already set + enabled
│   ├── src/app/privacy/page.tsx    ← Your email already set
│   └── public/manifest.webmanifest ← App name, colors set
│
├── 📖 GUIDES (Reference Only):
│   ├── START_HERE.md               ← YEH FILE
│   ├── MASTER_GUIDE.md
│   ├── TERMUX_PROFESSIONAL_BUILD.md ← Termux build steps
│   ├── PRIVACY_POLICY.md
│   ├── ZIP_INVENTORY.md
│   └── README.md
│
├── ⚙️ AUTO CONFIG (Kuch nahi karna):
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   └── drizzle.config.json
│
├── 🎬 BUILD SCRIPT:
│   └── termux-setup-ubuntu.sh      ← Yeh chalao
│
├── 🖼️ PUBLIC ASSETS (Auto):
│   ├── icon.png (App icon)
│   ├── splash.png
│   ├── logo.png
│   ├── manifest.webmanifest
│   └── .well-known/assetlinks.json
│
└── 💻 SOURCE CODE (Chedना Nahi):
    ├── src/app/ (pages + API routes)
    ├── src/components/
    ├── src/lib/
    └── src/config/admob.ts (already configured)
```

---

# 🎯 EXACT SEQUENCE (Copy-Paste-Follow)

## Step-by-Step Kya Karें:

```bash
# ══════════════════════════════════════════
#  STEP 1: Termux mein ZIP extract karें
# ══════════════════════════════════════════
pkg install nodejs git unzip nano openjdk-17 -y
cd ~/storage/downloads
unzip ExtraAI-source.zip -d extraai
cd extraai

# ══════════════════════════════════════════
#  STEP 2: .env file banao (2 min)
# ══════════════════════════════════════════
cp .env.example .env
nano .env
# Groq aur Gemini NEW keys paste karें
# Save: Ctrl+O, Enter, Ctrl+X

# ══════════════════════════════════════════
#  STEP 3: Ubuntu install (script chalao)
# ══════════════════════════════════════════
bash termux-setup-ubuntu.sh init

# ══════════════════════════════════════════
#  STEP 4: Ubuntu enter karें
# ══════════════════════════════════════════
proot-distro login ubuntu
# Ab aap Ubuntu ke andar ho

# ══════════════════════════════════════════
#  STEP 5: SDK + Bubblewrap install
# ══════════════════════════════════════════
bash /data/data/com.termux/files/home/storage/downloads/extraai/termux-setup-ubuntu.sh sdk

# ══════════════════════════════════════════
#  STEP 6: Vercel par deploy karें (browser mein)
# ══════════════════════════════════════════
# Ubuntu mein:
cd ~/storage/downloads/extraai   # ya jo aap ka path ho
git init && git add . && git commit -m "ExtraAI"
git remote add origin https://github.com/YOU/extraai.git
git push -u origin main

# Phone browser: vercel.com → Import project
# Environment Variables mein add karें:
#   GROQ_API_KEY = your key
#   GEMINI_API_KEY = your key
# Deploy dabao → URL milega

# ══════════════════════════════════════════
#  STEP 7: AAB build karें
# ══════════════════════════════════════════
bash /path/to/termux-setup-ubuntu.sh build https://YOUR-APP.vercel.app

# ══════════════════════════════════════════
#  STEP 8: AAB Downloads folder mein aa jayega
# ══════════════════════════════════════════
# File: ExtraAI.aab
# Play Console par upload karें

# ══════════════════════════════════════════
#  STEP 9: 14-din closed testing → LIVE!
# ══════════════════════════════════════════
```

---

# 🔑 API KEYS LIMITS — Realistic Answer

## Aap Ka Sawaal:
> "Groq 1000, Gemini 1500 — kya sirf itne? Users unlimited hone chahiye."

## Sach:

**Aap ki 1 key = poora app ka daily quota.** Sab users ki messages aap ki key se jaate hain.

### Math:

| Daily Active Users | Msg/User | Total Requests/Day |
|---|---|---|
| 200 | 5 | 1,000 ✅ (Groq limit hit) |
| 500 | 3 | 1,500 ⚠️ (Gemini limit hit) |
| 1,000 | 5 | 5,000 ❌ (both cross) |

### Kya Hoga Limit Cross Hone Par?

**App band NAHI hoga.** Multi-provider fallback hai:
1. Groq fail → **Gemini try karega**
2. Gemini fail → **Pollinations FREE unlimited use karega**
3. User ko answer milega, bas quality thoda kam

### Real Advice:

**Pehle 200 users tak — FREE keys perfectly kaam karengi.**

**500+ users pe:**
- Ads se ₹1,000/day earning shuru
- Groq paid plan ($10/month = ₹800) le lें
- Unlimited quota, high quality

**1,000+ users:**
- Ads se ₹3,000+/day earning
- Groq paid ($10-30/month) + Gemini paid tiers
- Profitable app

**Aap ko abhi paisa nahi kharch karna — free se start karें.**

---

# ✅ FINAL CHECKLIST

Aap ka setup complete karne ke liye:

- [ ] Groq key REVOKE karें (jo chat mein share ki thi) — nayi banao
- [ ] Gemini key REVOKE karें — nayi banao
- [ ] ZIP download karें (5.5 MB)
- [ ] Termux mein extract karें
- [ ] `.env` banao aur 2 NEW keys paste karें
- [ ] `bash termux-setup-ubuntu.sh init`
- [ ] Ubuntu install
- [ ] SDK + Bubblewrap install
- [ ] Vercel par deploy
- [ ] AAB build
- [ ] Play Console par upload
- [ ] Bubblewrap SHA-256 fingerprint lें → `assetlinks.json` mein daalें → GitHub push
- [ ] 14-day closed testing
- [ ] Publish → Ads chalu → Revenue start! 💰

---

# 📞 SUPPORT

**Support email:** `extraai.support@gmail.com` (privacy policy mein)

Agar kisi step par confusion ho:
1. Exact command jo aap ne chalayi
2. Exact error message
3. Screenshot

Share karें, main turant help karunga. **Sirf jo aap kahenge wahi karunga.** 🚀
