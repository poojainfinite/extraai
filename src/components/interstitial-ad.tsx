"use client";

import { useState, useImperativeHandle, forwardRef, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { monetization, isProUser } from "@/lib/monetization";

export interface InterstitialHandle {
  maybeShow: () => void;
}

/**
 * User-friendly interstitial ad strategy:
 *  • Never shows on the first few messages (let user enjoy the app first)
 *  • Shows occasionally (every N messages — configurable, default 8)
 *  • Auto-skip becomes available after 4 seconds (clear progress)
 *  • Minimum 90 seconds gap between two interstitials (anti-fatigue)
 *  • Pro users never see ads
 *
 * Why this works for revenue + UX:
 *  • Banner = passive constant income (always visible)
 *  • Interstitial = ~1 per 8 prompts = high eCPM with low irritation
 *  • Skip-after-delay = compliant with Play Store ad policies
 */
export const InterstitialAd = forwardRef<InterstitialHandle>((_props, ref) => {
  const [show, setShow] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [skipIn, setSkipIn] = useState(0);
  const countRef = useRef(0);
  const lastShownRef = useRef(0);

  useImperativeHandle(ref, () => ({
    maybeShow() {
      if (!monetization.ads.enabled || isProUser()) return;

      countRef.current += 1;
      const firstAdAfter = monetization.ads.firstAdAfter || 3;
      const freq = monetization.ads.frequency || 5;
      const minGap = (monetization.ads.minGapSeconds || 30) * 1000;
      const skipAfter = monetization.ads.skipAfterSeconds || 4;

      // Aggressive but user-friendly schedule:
      //   First ad:  after `firstAdAfter` messages (e.g., 3)
      //   Then:      every `freq` messages after that (e.g., 5)
      //   Example (firstAdAfter=3, freq=5):
      //     msg 1,2,3 → AD ✓
      //     msg 4,5,6,7,8 → AD ✓
      //     msg 9,10,11,12,13 → AD ✓
      const c = countRef.current;
      let shouldShow = false;
      if (c === firstAdAfter) {
        shouldShow = true;
      } else if (c > firstAdAfter && ((c - firstAdAfter) % freq === 0)) {
        shouldShow = true;
      }
      if (!shouldShow) return;

      // Anti-fatigue: minimum gap between two interstitials
      const now = Date.now();
      if (now - lastShownRef.current < minGap) return;

      // Show!
      lastShownRef.current = now;
      setShow(true);
      setCanSkip(false);
      setSkipIn(skipAfter);

      // Countdown
      const timer = setInterval(() => {
        setSkipIn(s => {
          if (s <= 1) {
            clearInterval(timer);
            setCanSkip(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    },
  }));

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 flex items-center justify-center p-4 animate-float-up">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 text-center text-white relative">
          {canSkip && (
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close ad"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Sparkles className="w-10 h-10 mx-auto mb-2" />
          <p className="text-base font-bold">A short message from our sponsors</p>
          <p className="text-xs text-white/80 mt-1">Helps keep ExtraAI free for everyone ❤️</p>
        </div>
        <div className="p-5">
          {/* AdMob interstitial slot mounts inside this div */}
          <div
            id="extraai-interstitial-ad"
            className="bg-slate-50 border border-slate-200 rounded-xl py-10 text-center mb-4"
          >
            <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded text-xs font-semibold">ADVERTISEMENT</span>
            <p className="text-sm text-slate-500 mt-3">Sponsored content appears here</p>
          </div>
          <button
            onClick={() => setShow(false)}
            disabled={!canSkip}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {canSkip ? "Continue to ExtraAI →" : `Continue in ${skipIn}s`}
          </button>
        </div>
      </div>
    </div>
  );
});

InterstitialAd.displayName = "InterstitialAd";
