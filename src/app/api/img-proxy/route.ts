import { NextRequest } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Image proxy — fetches Pollinations images on our server and streams them
 * back to the client. This makes images reliably available even when the
 * client (mobile WebView, in-app browser) can't reach Pollinations directly.
 *
 * Usage: /api/img-proxy?prompt=...&w=1024&h=1024&seed=12345
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");
    const w = parseInt(searchParams.get("w") || "1024", 10);
    const h = parseInt(searchParams.get("h") || "1024", 10);
    const seed = parseInt(searchParams.get("seed") || String(Math.floor(Math.random() * 999999)), 10);

    if (!prompt) {
      return new Response("Missing prompt", { status: 400 });
    }

    const safeW = Math.min(Math.max(w, 256), 2048);
    const safeH = Math.min(Math.max(h, 256), 2048);

    const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${safeW}&height=${safeH}&model=flux&nologo=true&enhance=true&seed=${seed}&referrer=extraai`;

    // Retry up to 2 times for reliability
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(upstream, {
          signal: AbortSignal.timeout(55000),
          headers: { "User-Agent": "ExtraAI/1.0" },
        });
        if (res.ok && res.body) {
          // Stream the image back to the client
          return new Response(res.body, {
            status: 200,
            headers: {
              "Content-Type": res.headers.get("content-type") || "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Disposition": `inline; filename="ExtraAI_${seed}.jpg"`,
            },
          });
        }
        lastError = `HTTP ${res.status}`;
      } catch (e) {
        lastError = (e as Error).message;
      }
      // Brief wait before retry
      await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(`Image fetch failed: ${lastError}`, { status: 502 });
  } catch (error) {
    return new Response("Server error: " + (error as Error).message, { status: 500 });
  }
}
