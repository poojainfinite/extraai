import { NextRequest } from "next/server";
import { getVisionProvider } from "@/lib/ai-providers";

export const maxDuration = 60;

const VISION_PROMPT = `You are ExtraAI's vision expert. Analyze the image carefully and provide a Pro-level, detailed description in the same language as the user's question. Identify:
- Main subject/objects
- Setting/context (game, app, photo, document, etc.)
- Text content (read & translate if needed)
- Notable details
- Answer the user's specific question accurately.
Be specific and accurate — never guess.`;

/* ── Free OCR via OCR.space (no key needed) ── */
async function ocrText(dataUrl: string): Promise<string> {
  try {
    const form = new URLSearchParams();
    form.set("apikey", process.env.OCR_SPACE_KEY || "helloworld");
    form.set("OCREngine", "2");
    form.set("scale", "true");

    if (dataUrl.startsWith("http")) {
      form.set("url", dataUrl);
    } else {
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      const mime = dataUrl.match(/data:(image\/\w+)/)?.[1] || "image/png";
      const ext = (mime.split("/")[1] || "png").toUpperCase();
      form.set("base64Image", `data:${mime};base64,${base64}`);
      form.set("filetype", ext);
    }

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.ParsedResults?.[0]?.ParsedText?.trim();
      if (text) return text;
    }
  } catch { /* ignore */ }
  return "";
}

/* ── Real vision using Gemini API ── */
async function geminiVision(apiKey: string, model: string, dataUrl: string, question: string): Promise<string> {
  try {
    let mimeType = "image/png";
    let base64 = "";
    if (dataUrl.startsWith("data:")) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) { mimeType = match[1]; base64 = match[2]; }
    } else if (dataUrl.startsWith("http")) {
      // Fetch the image and convert to base64
      const imgRes = await fetch(dataUrl, { signal: AbortSignal.timeout(15000) });
      if (!imgRes.ok) return "";
      mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await imgRes.arrayBuffer());
      base64 = buf.toString("base64");
    } else {
      return "";
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: VISION_PROMPT }] },
          contents: [{
            role: "user",
            parts: [
              { text: question || "Describe this image in detail. What do you see?" },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
        }),
        signal: AbortSignal.timeout(55000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join("").trim();
      if (text) return text;
    } else {
      const errText = await res.text().catch(() => "");
      console.error("Gemini vision error:", res.status, errText.slice(0, 200));
    }
  } catch (e) {
    console.error("Gemini vision exception:", (e as Error).message);
  }
  return "";
}

/* ── Real vision via OpenAI-compatible (OpenRouter, OpenAI) ── */
async function openaiVision(url: string, key: string, model: string, dataUrl: string, question: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: VISION_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: question || "Describe this image in detail. What do you see?" },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(55000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    }
  } catch { /* ignore */ }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, question } = body;
    if (!imageBase64) {
      return Response.json({ content: "❌ Image nahi mili. Dobara upload karein." });
    }

    const userGeminiKey = request.headers.get("x-extraai-gemini-key");
    const provider = getVisionProvider(userGeminiKey);
    let aiResult = "";

    // Try real vision if a vision-capable provider is configured
    if (provider && provider.key) {
      if (provider.type === "gemini") {
        aiResult = await geminiVision(provider.key, provider.model, imageBase64, question || "");
      } else if (provider.type === "openai-compat") {
        aiResult = await openaiVision(provider.url, provider.key, provider.model, imageBase64, question || "");
      }
    }

    // Always run OCR in parallel for any text content
    const ocrTextResult = await ocrText(imageBase64);

    if (aiResult) {
      let out = aiResult;
      if (ocrTextResult && !aiResult.includes(ocrTextResult.slice(0, 40))) {
        out += `\n\n---\n📄 **Image mein detected text:**\n${ocrTextResult}`;
      }
      return Response.json({ content: out });
    }

    // No vision key — use OCR text + interpret with text LLM
    if (ocrTextResult) {
      try {
        const interpret = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai",
            referrer: "extraai",
            messages: [{
              role: "user",
              content: `Yeh text ek image/screenshot se extract hua hai:\n\n"${ocrTextResult}"\n\nUser ka sawaal: ${question || "Is image ke baare mein batao"}\n\nIs text ke aadhar par user ko helpful jawab do (same language mein).`,
            }],
          }),
          signal: AbortSignal.timeout(40000),
        });
        if (interpret.ok) {
          const d = await interpret.json();
          const ans = d.choices?.[0]?.message?.content?.trim();
          if (ans) return Response.json({ content: `${ans}\n\n---\n📄 **Extracted text:**\n${ocrTextResult}` });
        }
      } catch { /* ignore */ }
      return Response.json({ content: `📄 **Image se text mila:**\n\n${ocrTextResult}` });
    }

    // Nothing worked — guide user to add a free key
    return Response.json({
      content:
        "📷 Image mil gayi, par ismein koi readable text bhi nahi mila. Iska matlab yeh ek photo/game/object image hai.\n\n**Photos, games, screenshots, drawings — sab pehchanne ke liye ExtraAI ko ek FREE Gemini key chahiye** (5 minute mein ban jaati hai, koi credit card nahi):\n\n1. https://aistudio.google.com/apikey par jaayein\n2. \"Create API Key\" dabayein\n3. Key ko app mein add karein (Settings ya `.env` mein `GEMINI_API_KEY=...`)\n\nUske baad ExtraAI **har image, game, photo, screenshot** accurately pehchanega — Pro level pe!",
    });
  } catch (error) {
    return Response.json({ content: "❌ Image analyze nahi ho payi: " + (error as Error).message });
  }
}
