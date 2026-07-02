/**
 * ═══════════════════════════════════════════════════════════════════
 *  🎯 ExtraAI — AdMob Configuration
 * ═══════════════════════════════════════════════════════════════════
 *
 *  ✅ REAL AdMob IDs PRE-CONFIGURED (aap ki actual IDs).
 *  ✅ ADS ENABLED — app publish hote hi ads chalu ho jayenge.
 *  ✅ Koi manual change nahi karna — bas Termux mein build karें.
 *
 *  ─── Ad Strategy (revenue-optimized) ───
 *
 *   BANNER:       Hamesha bottom pe (small 50px, always earning)
 *   INTERSTITIAL: First ad after 3 messages, then every 5 messages
 *                 (max revenue, users still enjoy the app)
 *
 * ═══════════════════════════════════════════════════════════════════
 */

export const ADMOB_CONFIG = {
  // ═════ REAL ADMOB IDs (LIVE — pre-configured) ═════

  ADMOB_ENABLED: true,  // ✅ Ads activated

  APP_ID: "ca-app-pub-4660632592314579~8800928675",           // ExtraAI App ID
  BANNER_ID: "ca-app-pub-4660632592314579/3077828705",        // ExtraAI Banner
  INTERSTITIAL_ID: "ca-app-pub-4660632592314579/8274315062",  // ExtraAI Interstitial

  // ═════ AD SCHEDULE (aggressive but user-friendly) ═════

  INTERSTITIAL_FIRST_AD_AFTER: 3,     // First ad after 3rd message
  INTERSTITIAL_FREQUENCY: 5,          // Then every 5 messages
  INTERSTITIAL_MIN_GAP_SECONDS: 30,   // Minimum 30 sec gap between ads
  INTERSTITIAL_SKIP_AFTER_SECONDS: 4, // Skip button after 4 seconds

  // ═════ AD SHOWING LOGIC ═════
  //
  //   Message 1, 2, 3  → INTERSTITIAL AD 🎯 (first ad)
  //   Message 4, 5, 6, 7, 8  → INTERSTITIAL AD 🎯
  //   Message 9, 10, 11, 12, 13  → INTERSTITIAL AD 🎯
  //   Message 14, 15, 16, 17, 18 → INTERSTITIAL AD 🎯
  //   ... and so on
  //
  //   + Banner always visible at bottom
};

/* ─────────────────────────────────────────────────────────────
 *  DO NOT EDIT BELOW — Code that uses your IDs
 * ─────────────────────────────────────────────────────────── */

export const monetization = {
  ads: {
    enabled: ADMOB_CONFIG.ADMOB_ENABLED && !ADMOB_CONFIG.APP_ID.includes("XXXX"),
    admobAppId: ADMOB_CONFIG.APP_ID,
    bannerId: ADMOB_CONFIG.BANNER_ID,
    interstitialId: ADMOB_CONFIG.INTERSTITIAL_ID,
    firstAdAfter: ADMOB_CONFIG.INTERSTITIAL_FIRST_AD_AFTER,
    frequency: ADMOB_CONFIG.INTERSTITIAL_FREQUENCY,
    minGapSeconds: ADMOB_CONFIG.INTERSTITIAL_MIN_GAP_SECONDS,
    skipAfterSeconds: ADMOB_CONFIG.INTERSTITIAL_SKIP_AFTER_SECONDS,
  },
  iap: {
    enabled: false, // Future — abhi off
    proPrice: "₹199/month",
    proFeatures: ["No ads", "Priority speed", "Early features"],
  },
};

export function isProUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("extraai_pro") === "true";
}

export function setProUser(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("extraai_pro", value ? "true" : "false");
}
