/**
 * ExtraAI — Multi-Provider AI Configuration
 * ==========================================
 *
 * Set ANY one (or many) of these env vars. App auto-detects and uses them.
 * Multiple keys can be active at once — best ones used for each task.
 *
 * Add in `.env` file (Termux) or Vercel Environment Variables:
 *
 *   GEMINI_API_KEY=AIzaSy...        ⭐ FREE, vision, fast — RECOMMENDED
 *   GROQ_API_KEY=gsk_...            ⭐ FREE, fastest text  — RECOMMENDED for speed
 *   OPENROUTER_API_KEY=sk-or-...    Optional, more models
 *   OPENAI_API_KEY=sk-...           Optional, paid
 *
 * Browser key (from Settings UI) is passed via x-extraai-gemini-key header
 * and takes priority over env keys.
 *
 * PRIORITY ORDER:
 *   - TEXT: Groq → Gemini → OpenRouter → OpenAI → Pollinations(free)
 *   - VISION: Gemini → OpenRouter → OpenAI → OCR-only(free)
 */

export type ProviderType = "gemini" | "openai-compat" | "pollinations";

export type Provider = {
  name: string;
  model: string;
  tier: "free" | "premium";
  vision: boolean;
  type: ProviderType;
  url: string;
  key: string | null;
};

/** Pick the best TEXT provider (prefers speed: Groq → Gemini → OR → OAI → Pollinations) */
export function getTextProvider(userGeminiKey?: string | null): Provider {
  const groq = process.env.GROQ_API_KEY;
  const gem = userGeminiKey || process.env.GEMINI_API_KEY;
  const or = process.env.OPENROUTER_API_KEY;
  const oa = process.env.OPENAI_API_KEY;

  // Groq first — it's the fastest free text option
  if (groq) {
    return {
      name: "Groq",
      model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
      tier: "premium", vision: false, type: "openai-compat",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groq,
    };
  }
  if (gem) {
    return {
      name: "Google Gemini",
      model: process.env.AI_MODEL || "gemini-2.5-flash",
      tier: "premium", vision: true, type: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta",
      key: gem,
    };
  }
  if (or) {
    return {
      name: "OpenRouter",
      model: process.env.AI_MODEL || "google/gemini-flash-1.5",
      tier: "premium", vision: true, type: "openai-compat",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: or,
    };
  }
  if (oa) {
    return {
      name: "OpenAI",
      model: process.env.AI_MODEL || "gpt-4o-mini",
      tier: "premium", vision: true, type: "openai-compat",
      url: "https://api.openai.com/v1/chat/completions",
      key: oa,
    };
  }
  return {
    name: "Pollinations (Free)",
    model: "GPT-OSS 20B",
    tier: "free", vision: false, type: "pollinations",
    url: "https://text.pollinations.ai/openai",
    key: null,
  };
}

/** Pick the best VISION provider (only vision-capable models) */
export function getVisionProvider(userGeminiKey?: string | null): Provider | null {
  const gem = userGeminiKey || process.env.GEMINI_API_KEY;
  const or = process.env.OPENROUTER_API_KEY;
  const oa = process.env.OPENAI_API_KEY;

  if (gem) {
    return {
      name: "Google Gemini Vision",
      model: process.env.VISION_MODEL || "gemini-2.5-flash",
      tier: "premium", vision: true, type: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta",
      key: gem,
    };
  }
  if (or) {
    return {
      name: "OpenRouter Vision",
      model: process.env.VISION_MODEL || "google/gemini-flash-1.5",
      tier: "premium", vision: true, type: "openai-compat",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: or,
    };
  }
  if (oa) {
    return {
      name: "OpenAI Vision",
      model: process.env.VISION_MODEL || "gpt-4o-mini",
      tier: "premium", vision: true, type: "openai-compat",
      url: "https://api.openai.com/v1/chat/completions",
      key: oa,
    };
  }
  return null; // No vision available → fallback to OCR-only
}

/** Status summary of all configured providers */
export function getProviderStatus(userGeminiKey?: string | null) {
  const text = getTextProvider(userGeminiKey);
  const vision = getVisionProvider(userGeminiKey);
  const configured: string[] = [];
  if (userGeminiKey) configured.push("Gemini (browser)");
  if (process.env.GEMINI_API_KEY) configured.push("Gemini (env)");
  if (process.env.GROQ_API_KEY) configured.push("Groq");
  if (process.env.OPENROUTER_API_KEY) configured.push("OpenRouter");
  if (process.env.OPENAI_API_KEY) configured.push("OpenAI");
  return {
    text,
    vision,
    configured,
    hasAnyKey: configured.length > 0,
  };
}

/** Legacy/back-compat: returns the primary provider (text-focused) */
export function getProvider(userGeminiKey?: string | null): Provider {
  return getTextProvider(userGeminiKey);
}

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

/* Convert OpenAI-format messages to Gemini contents format */
export function toGeminiContents(messages: ChatMsg[]): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: Array<{ role: string; parts: Array<Record<string, unknown>> }>;
} {
  let systemInstruction: { parts: Array<{ text: string }> } | undefined;
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

  for (const m of messages) {
    if (m.role === "system") {
      const text = typeof m.content === "string" ? m.content : m.content.map(c => c.text).filter(Boolean).join("\n");
      systemInstruction = { parts: [{ text }] };
      continue;
    }
    const role = m.role === "assistant" ? "model" : "user";
    const parts: Array<Record<string, unknown>> = [];

    if (typeof m.content === "string") {
      parts.push({ text: m.content });
    } else {
      for (const item of m.content) {
        if (item.type === "text" && item.text) {
          parts.push({ text: item.text });
        } else if (item.type === "image_url" && item.image_url?.url) {
          const url = item.image_url.url;
          if (url.startsWith("data:")) {
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
          } else {
            parts.push({ text: `[Image at ${url}]` });
          }
        }
      }
    }
    contents.push({ role, parts });
  }

  return { systemInstruction, contents };
}
