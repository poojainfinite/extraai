"use client";

import { useEffect, useState } from "react";
import { monetization, isProUser } from "@/lib/monetization";

/**
 * Bottom banner ad — always visible (passive revenue).
 *
 * Strategy:
 *  • Small height (50px standard banner) — non-intrusive
 *  • Not dismissable (it's the main revenue driver)
 *  • Only hidden for Pro users
 *  • Mount point: <div id="extraai-banner-ad"> — AdMob SDK injects here
 *
 * To enable: set NEXT_PUBLIC_ADS_ENABLED=true in .env
 */
export function AdBanner() {
  const [pro, setPro] = useState(false);

  useEffect(() => {
    setPro(isProUser());
    // Re-check periodically in case Pro status changes
    const t = setInterval(() => setPro(isProUser()), 5000);
    return () => clearInterval(t);
  }, []);

  if (!monetization.ads.enabled || pro) return null;

  return (
    <div className="border-t border-pink-100 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
      <div className="max-w-3xl mx-auto px-4 py-1">
        <div
          id="extraai-banner-ad"
          className="flex items-center justify-center min-h-[50px] text-xs text-slate-500"
        >
          {monetization.ads.bannerId ? (
            <span className="opacity-60">Sponsored</span>
          ) : (
            <span className="opacity-50">
              <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded text-[10px] font-semibold mr-2">AD</span>
              Banner ad slot (configure AdMob to activate)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
