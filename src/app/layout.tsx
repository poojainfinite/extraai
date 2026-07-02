import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { SplashScreen } from "@/components/splash-screen";

export const metadata: Metadata = {
  title: "ExtraAI — Advanced AI Assistant",
  description:
    "ExtraAI: Ask anything, write emails, generate code & images, analyze PDFs & photos, voice input. Free advanced AI in Hindi, English & more.",
  applicationName: "ExtraAI",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ExtraAI", statusBarStyle: "default" },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased min-h-screen">
        <SplashScreen />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
