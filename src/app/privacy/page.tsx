import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ExtraAI",
  description: "Privacy policy for the ExtraAI app.",
};

/**
 * Privacy policy page — publicly accessible at /privacy
 * URL: https://your-app.vercel.app/privacy
 * Yeh URL Play Console mein "Privacy Policy URL" field mein use hoga.
 *
 * ⚠️ Neeche `SUPPORT_EMAIL` ko apni actual Gmail se replace karें.
 */

const SUPPORT_EMAIL = "extraai.support@gmail.com"; // ✅ Your support email

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy — ExtraAI</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: 2026</p>

      <section className="space-y-6 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Introduction</h2>
          <p>ExtraAI (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is an AI assistant application. This policy explains how we handle your data.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Chat messages:</strong> Text and prompts you send are processed to generate AI responses and stored in our database so you can revisit your history.</li>
            <li><strong>Uploaded files:</strong> Images and PDFs are processed temporarily to answer your questions. PDFs are parsed in your browser.</li>
            <li><strong>No personal account required:</strong> ExtraAI does not require you to sign up or provide personal identification.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To generate AI responses to your queries.</li>
            <li>To save your conversation history for your convenience.</li>
            <li>To improve service quality and reliability.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Third-Party AI Services</h2>
          <p>ExtraAI sends your prompts to third-party AI providers (Pollinations, Groq, Google Gemini) to generate responses. Please review their privacy policies. We do not sell your data.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Advertising</h2>
          <p>ExtraAI displays ads through Google AdMob to keep the app free. AdMob may collect device information (device ID, IP address, ad interactions) as per Google&apos;s privacy policy. You can review it at{" "}
            <a href="https://policies.google.com/privacy" className="text-pink-600 hover:underline">policies.google.com/privacy</a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Storage & Security</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Conversations are stored in a secure PostgreSQL database.</li>
            <li>You can delete any conversation anytime from within the app.</li>
            <li>Communication uses HTTPS encryption.</li>
            <li>API keys and secrets are stored server-side, never exposed to the browser.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Children&apos;s Privacy</h2>
          <p>ExtraAI is intended for general audiences (13+). We do not knowingly collect data from children under 13.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Voice Input</h2>
          <p>Voice input uses your device&apos;s built-in speech recognition. Audio is processed by your browser, not stored by us.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Delete conversations anytime.</li>
            <li>Stop using the app to stop all data processing.</li>
            <li>Request data deletion by emailing us (see Contact below).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Changes to This Policy</h2>
          <p>We may update this policy. Changes will be posted at this URL.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Contact</h2>
          <p>
            For questions or data requests, contact us at:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-pink-600 hover:underline font-medium">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
