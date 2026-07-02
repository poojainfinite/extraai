import { NextRequest } from "next/server";
import { getProviderStatus } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userGeminiKey = request.headers.get("x-extraai-gemini-key");
  const status = getProviderStatus(userGeminiKey);

  return Response.json({
    // Primary (text) provider — backward compatible fields
    provider: status.text.name,
    model: status.text.model,
    tier: status.text.tier,
    vision: status.vision !== null,
    // Detailed info for the UI
    textProvider: status.text.name,
    textModel: status.text.model,
    visionProvider: status.vision?.name || "OCR only (free)",
    visionModel: status.vision?.model || "OCR.space",
    configuredKeys: status.configured,
    hasAnyKey: status.hasAnyKey,
  });
}
