import { NextRequest } from "next/server";
import { getProvider, toGeminiContents, type ChatMsg } from "@/lib/ai-providers";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are ExtraAI — a premium, intelligent, multilingual AI assistant. You are the user's all-in-one helper. Whatever they ask — a question, an email, code, an explanation, a plan, an analysis — you give a complete, Pro-level answer.

IDENTITY:
- Name: ExtraAI. Be confident, accurate, friendly, and direct. Never refuse a reasonable task.

LANGUAGE:
- Reply in the SAME language as the user: Hindi → Hindi, English → English, Sanskrit → Sanskrit, Hinglish → Hinglish. Match their tone.

CONVERSATION CONTEXT:
- The chat is a continuous thread. Always remember and use the previous messages in this conversation.
- If the user asks a follow-up that depends on earlier context, refer back to it naturally — do not ask them to repeat themselves.
- Maintain a coherent thread across many turns.

QUALITY (every answer should feel premium):
1. Structure: use **bold**, headings, bullet points, numbered lists, tables, \`inline code\`, and \`\`\`language\\ncode blocks\`\`\`.
2. Code & apps: write COMPLETE, runnable, production-quality code with brief comments. For full apps, list the file structure and include all files needed to run.
3. Emails & letters: deliver ready-to-send content with subject line, greeting, body, and closing.
4. Complex problems: break into clear steps, show reasoning, then give a clear conclusion.
5. Explanations: clear, with examples and analogies. Hindi/Hinglish explanations should feel natural, not translated.
6. Image analysis: describe the subject, context, mood, text, and answer the user's specific question. Identify games, brands, scenes, screenshots accurately if you can recognise them.
7. PDFs / documents: answer strictly based on the provided content.
8. Accuracy first: if you're unsure, say so honestly. Never fabricate facts, links, or APIs.
9. Be thorough where it matters, concise where it doesn't. No padding.

IMPORTANT — IMAGE GENERATION:
- If the user asks you to "generate / create / make / draw / paint" an image, picture, photo, or art, DO NOT write a long prompt or refuse. ExtraAI has built-in image generation — the app handles it directly.
- If somehow the request reaches you, reply in one short line: "Generating your image now…" (in the user's language) and nothing else.
- NEVER say "I can't create images" or "use Midjourney/DALL-E". ExtraAI CAN create images natively.

You are ExtraAI — make every answer accurate, useful, and beautifully formatted.`;

/* Stream from Gemini API natively */
async function streamGemini(provider: ReturnType<typeof getProvider>, messages: ChatMsg[]): Promise<ReadableStream<Uint8Array>> {
  const { systemInstruction, contents } = toGeminiContents(messages);
  const body: Record<string, unknown> = { contents };
  if (systemInstruction) body.systemInstruction = systemInstruction;
  body.generationConfig = { temperature: 0.7, maxOutputTokens: 4096 };

  const url = `${provider.url}/models/${provider.model}:streamGenerateContent?alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": provider.key! },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(110000),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini error: ${res.status} ${errText.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (!data) continue;
            try {
              const j = JSON.parse(data);
              const text = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join("") || "";
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            } catch { /* ignore */ }
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

/* Stream from OpenAI-compatible (OpenAI, OpenRouter, Groq, Pollinations) */
async function streamOpenAICompat(provider: ReturnType<typeof getProvider>, messages: ChatMsg[]): Promise<ReadableStream<Uint8Array>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider.key) headers["Authorization"] = `Bearer ${provider.key}`;

  const body: Record<string, unknown> = {
    model: provider.type === "pollinations" ? "openai" : provider.model,
    messages, temperature: 0.7, stream: true,
  };
  if (provider.type === "pollinations") body.referrer = "extraai";

  const res = await fetch(provider.url, {
    method: "POST", headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(110000),
  });

  if (!res.ok || !res.body) throw new Error(`AI error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
            } catch { /* ignore */ }
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

async function simpleFallback(messages: ChatMsg[]): Promise<string> {
  try {
    const last = messages[messages.length - 1];
    const userMsg = typeof last?.content === "string" ? last.content : "Hello";
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(userMsg)}?referrer=extraai`,
      { signal: AbortSignal.timeout(40000) }
    );
    if (res.ok) {
      const text = await res.text();
      if (text.trim() && !text.trimStart().startsWith("{")) return text.trim();
    }
  } catch { /* ignore */ }
  return "⏳ AI server thoda busy hai. Please 3-5 second baad same sawaal dobara bhejein.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const userGeminiKey = request.headers.get("x-extraai-gemini-key");
    const provider = getProvider(userGeminiKey);
    const chatMessages: ChatMsg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-12),
    ];

    // Try streaming
    try {
      const stream = provider.type === "gemini"
        ? await streamGemini(provider, chatMessages)
        : await streamOpenAICompat(provider, chatMessages);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (err) {
      console.error("Stream failed:", (err as Error).message);
    }

    // Ultimate fallback
    const content = await simpleFallback(messages);
    return new Response(
      `data: ${JSON.stringify({ content })}\n\ndata: [DONE]\n\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  } catch (error) {
    return Response.json({
      content: "⏳ Error: " + (error as Error).message,
    });
  }
}
