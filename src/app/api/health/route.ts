export const dynamic = "force-dynamic";

export async function GET() {
  // App uses no server-side database (chat history is in browser localStorage)
  return Response.json({ ok: true });
}
