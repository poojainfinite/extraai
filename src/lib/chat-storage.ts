"use client";

/**
 * ═══════════════════════════════════════════════════════════════
 *  ExtraAI — Local Chat Storage (NO DATABASE!)
 * ─────────────────────────────────────────────────────────────
 *  Sab kuch user ke apne phone mein browser localStorage mein
 *  save hota hai. Aap ko koi database, koi server, koi storage
 *  cost nahi.
 *
 *  Har user ki chat unke apne phone mein safe rehti hai —
 *  bilkul ChatGPT / Gemini app ki tarah.
 * ═══════════════════════════════════════════════════════════════
 */

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  uploadedImage?: string | null;
  fileLabel?: string | null;
  timestamp: number;
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

const STORAGE_KEY = "extraai_chats_v1";
const MAX_CONVERSATIONS = 100; // Keep only last 100 conversations per user
const MAX_MESSAGES_PER_CHAT = 200; // Prevent one chat from growing infinitely

function safeGetAll(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredConversation[];
  } catch {
    return [];
  }
}

function safeSetAll(convs: StoredConversation[]) {
  if (typeof window === "undefined") return;
  try {
    // Auto-trim: keep only last N conversations to prevent runaway storage
    const trimmed = convs
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Storage full — clear oldest half and retry
    try {
      const half = convs
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, Math.floor(MAX_CONVERSATIONS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch { /* give up silently */ }
  }
}

/* ─── Public API ─── */

/** Get all conversations (for sidebar) — sorted by most recent first */
export function listConversations(): Array<{ id: string; title: string }> {
  return safeGetAll()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(c => ({ id: c.id, title: c.title }));
}

/** Get a full conversation with all its messages */
export function getConversation(id: string): StoredConversation | null {
  return safeGetAll().find(c => c.id === id) ?? null;
}

/** Create a new conversation and return its ID */
export function createConversation(title: string): string {
  const all = safeGetAll();
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const conv: StoredConversation = {
    id,
    title: (title || "New chat").slice(0, 60),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  all.unshift(conv);
  safeSetAll(all);
  return id;
}

/** Append a message to a conversation (creates conv if it doesn't exist) */
export function appendMessage(convId: string, msg: Omit<StoredMessage, "timestamp">): void {
  const all = safeGetAll();
  const idx = all.findIndex(c => c.id === convId);
  if (idx === -1) return;
  const conv = all[idx];
  conv.messages.push({ ...msg, timestamp: Date.now() });
  // Trim if too many messages in one chat
  if (conv.messages.length > MAX_MESSAGES_PER_CHAT) {
    conv.messages = conv.messages.slice(-MAX_MESSAGES_PER_CHAT);
  }
  conv.updatedAt = Date.now();
  // Update title from first user message if still generic
  if (conv.title === "New chat" || conv.title === "(image)" || conv.title === "(PDF)") {
    const firstUserMsg = conv.messages.find(m => m.role === "user");
    if (firstUserMsg && firstUserMsg.content) {
      conv.title = firstUserMsg.content.slice(0, 60);
    }
  }
  safeSetAll(all);
}

/** Delete a conversation */
export function deleteConversation(id: string): void {
  const all = safeGetAll().filter(c => c.id !== id);
  safeSetAll(all);
}

/** Delete all conversations */
export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** Storage stats (optional — for future settings screen) */
export function getStorageStats(): { count: number; sizeKB: number } {
  if (typeof window === "undefined") return { count: 0, sizeKB: 0 };
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  return {
    count: safeGetAll().length,
    sizeKB: Math.round(new Blob([raw]).size / 1024),
  };
}
