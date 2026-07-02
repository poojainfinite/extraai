"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("extraai_splash")) {
      setShow(false);
      return;
    }
    const t1 = setTimeout(() => setFade(true), 1900);
    const t2 = setTimeout(() => {
      setShow(false);
      if (typeof window !== "undefined") sessionStorage.setItem("extraai_splash", "1");
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(circle at 50% 40%, #1a1024 0%, #0a0610 70%, #050308 100%)" }}
    >
      <div className="animate-splash-zoom flex flex-col items-center">
        {/* Actual 3D pink icon (same as app icon — consistent everywhere) */}
        <img
          src="/icon.png"
          alt="ExtraAI"
          className="w-36 h-36 rounded-[2rem] object-cover animate-pulse-glow"
        />

        <h1 className="mt-8 text-4xl font-bold text-white tracking-wide" style={{ textShadow: "0 2px 20px rgba(236,72,153,0.5)" }}>
          Extra<span className="bg-gradient-to-r from-pink-400 to-fuchsia-500 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mt-2 text-xs text-pink-300/70 tracking-[0.3em] uppercase">Advanced AI</p>

        <div className="mt-8 w-44 h-1 bg-pink-950 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
