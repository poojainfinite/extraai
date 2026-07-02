import { NextRequest } from "next/server";

export const maxDuration = 60;

/* Detect requested size from prompt */
function detectSize(raw: string): { width: number; height: number } {
  const l = raw.toLowerCase();
  if (l.includes("landscape") || l.includes("wide") || l.includes("16:9") || l.includes("banner")) return { width: 1280, height: 720 };
  if (l.includes("portrait") || l.includes("9:16") || l.includes("story") || l.includes("phone wallpaper")) return { width: 768, height: 1344 };
  if (l.includes("square") || l.includes("1:1")) return { width: 1024, height: 1024 };
  if (l.includes("small") || l.includes("thumbnail") || l.includes("icon")) return { width: 512, height: 512 };
  return { width: 1024, height: 1024 }; // default HD square
}

function cleanPrompt(raw: string): string {
  let p = raw
    .replace(/^(generate|create|make|draw|paint|design|render|produce|show\s+me|give\s+me|i\s+want|i\s+need)\s+(an?\s+|me\s+(an?\s+)?|the\s+|some\s+)?(image|picture|photo|illustration|art|artwork|painting|drawing|wallpaper|poster|logo|banner|thumbnail|icon|portrait|sketch)?\s*(of|about|showing|with|for)?\s*/i, "")
    .replace(/(image|photo|picture|tasveer|chitra)\s+(bana(o|ye|yen|iye)?|bnao)/i, "")
    .replace(/\b(landscape|portrait|square|wide|hd|4k|full size|high res|small|thumbnail|16:9|9:16|1:1)\b/gi, "")
    .trim();
  if (!p) p = "a beautiful artistic scene";
  return p;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt: raw, width: w, height: h } = body;

    if (!raw || typeof raw !== "string") {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    const prompt = cleanPrompt(raw);
    const size = (w && h) ? { width: w, height: h } : detectSize(raw);
    const enhanced = `${prompt}, highly detailed, masterpiece, best quality, ultra HD, sharp focus, professional, vivid colors, beautiful lighting`;
    const seed = Math.floor(Math.random() * 999999);

    // Build BOTH:
    //  - directUrl: original Pollinations URL (fast, but may fail in some browsers)
    //  - proxyUrl: through our /api/img-proxy (reliable, always works)
    const params = new URLSearchParams({
      prompt: enhanced,
      w: String(size.width),
      h: String(size.height),
      seed: String(seed),
    });
    const proxyUrl = `/api/img-proxy?${params.toString()}`;
    const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=${size.width}&height=${size.height}&model=flux&nologo=true&enhance=true&seed=${seed}&referrer=extraai`;

    return Response.json({
      imageUrl: proxyUrl,        // primary — used for display & download (reliable)
      directUrl,                 // fallback / "open original"
      prompt,
      width: size.width,
      height: size.height,
    });
  } catch (error) {
    return Response.json({ error: "Failed: " + (error as Error).message }, { status: 500 });
  }
}
