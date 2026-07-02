"use client";

import Link from "next/link";

export function NavBar() {
  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Real app icon (same as splash) */}
            <img src="/icon.png" alt="ExtraAI" className="w-9 h-9 rounded-xl object-cover brand-glow" />
            <span className="font-bold text-lg text-slate-900">
              Extra<span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
