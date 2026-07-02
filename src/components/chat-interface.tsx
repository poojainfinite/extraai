"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import {
  Send, Loader2, Plus, Trash2, MessageSquare,
  Image as ImageIcon, Menu, X, Copy, Check, User,
  Volume2, VolumeX, FileDown, Download,
  Paperclip, Mic, MicOff, FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extractPdfText } from "@/lib/pdf-utils";
import { AdBanner } from "@/components/ad-banner";
import { InterstitialAd, type InterstitialHandle } from "@/components/interstitial-ad";




/* ─── Types ─── */
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;       // primary URL (proxy — reliable)
  imageDirectUrl?: string | null; // original URL (fallback)
  uploadedImage?: string | null;
  fileLabel?: string | null;
  loading?: boolean;
}
interface Conv { id: string; title: string; }
interface Cfg { provider: string; model: string; tier: "free" | "premium"; vision: boolean; textProvider?: string; visionProvider?: string; configuredKeys?: string[]; hasAnyKey?: boolean; }
interface Props {
  conversations: Conv[];
  activeConversationId?: string;
  initialMessages?: Msg[];
}

function isImageReq(text: string): boolean {
  const l = text.toLowerCase().trim();
  // Regex-based: catches "generate an image", "create a picture", "make me a photo", etc.
  const englishVerbs = "(generate|create|make|draw|paint|design|render|produce|give\\s+me|show\\s+me|i\\s+want|i\\s+need)";
  const englishNouns = "(image|picture|photo|illustration|art|artwork|painting|drawing|wallpaper|poster|logo|banner|thumbnail|icon|portrait|sketch)";
  const englishPattern = new RegExp(`\\b${englishVerbs}\\s+(an?\\s+|me\\s+(an?\\s+)?|the\\s+|some\\s+)?${englishNouns}\\b`, "i");
  if (englishPattern.test(l)) return true;

  // Hindi/Hinglish patterns
  const hindiKws = [
    "image bana", "photo bana", "tasveer bana", "picture bana", "chitra bana",
    "image bnao", "photo bnao", "picture bnao", "image banao", "photo banao",
    "picture banao", "tasveer banao", "chitra banao", "tasveer bnao",
    "iska photo", "iski photo", "ek image", "ek photo", "ek picture", "ek tasveer",
    "ek chitra", "photo nikalo", "image nikalo",
  ];
  if (hindiKws.some(k => l.includes(k))) return true;

  // Standalone "image of X", "photo of X", "picture of X"
  if (/\b(image|picture|photo|illustration|artwork|painting|drawing)\s+of\s+/i.test(l)) return true;

  // "Draw X" / "Paint X" / "Sketch X" at the start = image request
  if (/^(draw|paint|sketch|illustrate)\s+(a|an|the|me)?\s*\w+/i.test(l)) return true;

  return false;
}

export function ChatInterface({ conversations: initConvs, activeConversationId, initialMessages = [] }: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [busy, setBusy] = useState(false);
  const [convs, setConvs] = useState(initConvs);
  const [sidebar, setSidebar] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingPdf, setPendingPdf] = useState<{ name: string; text: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [cfg, setCfg] = useState<Cfg | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const cidRef = useRef<string | undefined>(activeConversationId);
  const recRef = useRef<any>(null);
  const interstitialRef = useRef<InterstitialHandle>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { taRef.current?.focus(); }, []);
  const refreshConfig = useCallback(() => {
    fetch("/api/config", { headers: {} }).then(r => r.json()).then(setCfg).catch(() => {});
  }, []);

  useEffect(() => { refreshConfig(); }, [refreshConfig]);

  // Load conversations from localStorage on mount + focus
  useEffect(() => {
    refreshConvList();
    const onFocus = () => refreshConvList();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      window.addEventListener("visibilitychange", onFocus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("visibilitychange", onFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Load messages for the active conversation from localStorage
  useEffect(() => {
    if (!activeConversationId) {
      // Home page — clear if no conv selected
      if (msgs.length > 0 && !cidRef.current) setMsgs([]);
      return;
    }
    // Load conversation messages
    (async () => {
      const { getConversation } = await import("@/lib/chat-storage");
      const conv = getConversation(activeConversationId);
      if (conv) {
        setMsgs(conv.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrl: m.imageUrl,
          uploadedImage: m.uploadedImage,
          fileLabel: m.fileLabel,
        })));
        cidRef.current = activeConversationId;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  /* ── Copy ── */
  const doCopy = useCallback((id: string, txt: string) => {
    navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }, []);

  /* ── Speak (TTS) ── */
  const doSpeak = useCallback((id: string, txt: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking === id) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    window.speechSynthesis.cancel();
    const clean = txt.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_~\[\]]/g, "");
    const u = new SpeechSynthesisUtterance(clean.slice(0, 4000));
    u.rate = 1; u.onend = () => setSpeaking(null); u.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(u); setSpeaking(id);
  }, [speaking]);

  /* ── PDF download (print-based — supports ALL languages incl. Hindi/Sanskrit) ── */
  const doPdf = useCallback((txt: string) => {
    try {
      const esc = (s: string) => s
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // basic markdown → html
      let html = esc(txt)
        .replace(/```([\s\S]*?)```/g, (_m, c) => `<pre>${c}</pre>`)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*)$/gm, "<h2>$1</h2>")
        .replace(/\n/g, "<br>");

      const win = window.open("", "_blank");
      if (!win) {
        // popup blocked → fallback to text download
        const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `ExtraAI_${Date.now()}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ExtraAI Document</title>
<style>
  body{font-family:'Segoe UI',system-ui,Arial,sans-serif;line-height:1.7;color:#1e293b;max-width:760px;margin:32px auto;padding:0 24px;}
  h1{color:#db2777;font-size:26px;border-bottom:3px solid #f9a8d4;padding-bottom:8px;}
  h2{color:#9333ea;font-size:20px;margin-top:20px;}
  h3{color:#9333ea;font-size:17px;}
  pre{background:#0f172a;color:#34d399;padding:14px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;font-size:13px;}
  code{background:#fce7f3;color:#be185d;padding:2px 5px;border-radius:4px;font-size:90%;}
  strong{color:#0f172a;}
  .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;}
  @media print{body{margin:0;}}
</style></head><body>
<h1>✨ ExtraAI</h1>
<div>${html}</div>
<div class="footer">Generated by ExtraAI — Advanced AI Assistant</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);}</script>
</body></html>`);
      win.document.close();
    } catch {
      try {
        const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `ExtraAI_${Date.now()}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert("Download fail hua. Please dobara try karein.");
      }
    }
  }, []);

  /* ── Voice search (Web Speech API) ── */
  const toggleVoice = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice search aapke browser mein support nahi hai. Chrome use karein."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "hi-IN"; // Hindi + English both work
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
  }, [listening]);

  /* ── Unified file upload (image OR PDF) ── */
  async function onAnyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => { setPendingImage(reader.result as string); setPendingPdf(null); };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setBusy(true);
        const text = await extractPdfText(file);
        setPendingPdf({ name: file.name, text: text.slice(0, 12000) });
        setPendingImage(null);
        setBusy(false);
      } else {
        alert("Please select an image or PDF file.");
      }
    } catch {
      alert("File read karne mein problem hui. Dobara try karein.");
      setBusy(false);
    } finally {
      e.target.value = "";
    }
  }

  /* ── Save (LOCAL — no database) ── */
  async function save(userTxt: string, aiTxt: string, imgUrl?: string | null) {
    try {
      const { createConversation, appendMessage } = await import("@/lib/chat-storage");
      // Create new conversation if none active
      if (!cidRef.current) {
        cidRef.current = createConversation(userTxt.slice(0, 60) || "New chat");
      }
      // Append both messages
      appendMessage(cidRef.current, {
        id: `u_${Date.now()}`,
        role: "user",
        content: userTxt,
      });
      appendMessage(cidRef.current, {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: aiTxt,
        imageUrl: imgUrl,
      });
      // Refresh sidebar
      refreshConvList();
    } catch (e) {
      console.error("Save failed:", e);
    }
  }

  /* ── Streaming chat ── */
  async function streamChat(history: { role: string; content: string }[], aiId: string): Promise<string> {
    let full = "";
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12), stream: true }), signal: AbortSignal.timeout(120000) });
    if (!res.body) throw new Error("No stream");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          if (j.delta) full += j.delta; else if (j.content) full = j.content;
          const cur = full;
          setMsgs(p => p.map(m => m.id === aiId ? { ...m, content: cur, loading: false } : m));
        } catch {}
      }
    }
    return full;
  }

  /* ── Submit ── */
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!input.trim() && !pendingImage && !pendingPdf) || busy) return;
    const txt = input.trim();
    const img = pendingImage;
    const pdf = pendingPdf;
    setInput(""); setPendingImage(null); setPendingPdf(null); setBusy(true);

    const userLabel = pdf ? `📄 ${pdf.name}` : null;
    const uMsg: Msg = { id: `u${Date.now()}`, role: "user", content: txt || (img ? "(image)" : pdf ? "(PDF)" : ""), uploadedImage: img, fileLabel: userLabel };
    const aiId = `a${Date.now()}`;
    const aMsg: Msg = { id: aiId, role: "assistant", content: "", loading: true };
    setMsgs(p => [...p, uMsg, aMsg]);

    try {
      if (img) {
        // Server-side vision: OCR (free) + AI vision (if key) — never gets stuck
        let content = "";
        try {
          const r = await fetch("/api/vision", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: img, question: txt || "Describe this image in detail. What do you see?" }),
            signal: AbortSignal.timeout(70000),
          });
          const d = await r.json();
          content = d.content || "📷 Image analyze nahi ho payi. Dobara try karein.";
        } catch {
          content = "📷 Image analyze nahi ho payi. Internet check karke dobara try karein.";
        }
        setMsgs(p => p.map(m => m.id === aiId ? { ...m, content, loading: false } : m));
        await save(txt || "(image)", content);
      } else if (pdf) {
        const q = txt || "Is PDF ka summary aur key points batao.";
        const hist = [{ role: "user", content: `Following is the content of a PDF document named "${pdf.name}":\n\n${pdf.text}\n\n---\nUser question: ${q}` }];
        const full = await streamChat(hist, aiId);
        const content = full || "Could not process PDF.";
        setMsgs(p => p.map(m => m.id === aiId ? { ...m, content, loading: false } : m));
        await save(`📄 ${pdf.name}: ${q}`, content);
      } else if (isImageReq(txt)) {
        const r = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: txt }) });
        const d = await r.json();
        if (d.imageUrl) {
          const content = `✅ Image ready: "${d.prompt || txt}"`;
          setMsgs(p => p.map(m => m.id === aiId ? { ...m, content, imageUrl: d.imageUrl, imageDirectUrl: d.directUrl, loading: false } : m));
          await save(txt, content, d.imageUrl);
        } else {
          setMsgs(p => p.map(m => m.id === aiId ? { ...m, content: "❌ Image generation failed. Try different words.", loading: false } : m));
        }
      } else {
        const hist = msgs.filter(m => !m.loading).map(m => ({ role: m.role, content: m.content }));
        hist.push({ role: "user", content: txt });
        const full = await streamChat(hist, aiId);
        const content = full || "⏳ AI busy hai, please dobara try karein.";
        setMsgs(p => p.map(m => m.id === aiId ? { ...m, content, loading: false } : m));
        await save(txt, content);
      }
    } catch (err) {
      const isTimeout = (err as Error)?.name === "AbortError" || String(err).includes("abort");
      const content = isTimeout ? "⏳ Thoda time lag raha tha. Same sawaal dobara bhejein." : "⏳ Connection issue. Please dobara try karein.";
      setMsgs(p => p.map(m => m.id === aiId ? { ...m, content, loading: false } : m));
    } finally {
      setBusy(false);
      // Show an occasional ad (user-friendly frequency)
      interstitialRef.current?.maybeShow();
    }
  }

  async function refreshConvList() {
    try {
      const { listConversations } = await import("@/lib/chat-storage");
      setConvs(listConversations());
    } catch { /* ignore */ }
  }

  async function newChat() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(null);
    setMsgs([]);
    setPendingImage(null);
    setPendingPdf(null);
    setInput("");
    cidRef.current = undefined;
    // Close the sidebar immediately so user lands on the new chat main screen
    setSidebar(false);
    // Always refresh the conversation list so the sidebar shows everything from DB
    await refreshConvList();
    // Navigate to home (if not already)
    if (activeConversationId !== undefined) {
      router.push("/");
    }
    // Focus the input so user can type right away
    setTimeout(() => taRef.current?.focus(), 100);
  }

  // When user taps an existing chat in the sidebar, close sidebar on mobile
  function handleConvClick() {
    setSidebar(false);
  }
  async function delConv(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const { deleteConversation } = await import("@/lib/chat-storage");
    deleteConversation(id);
    setConvs(p => p.filter(c => c.id !== id));
    if (activeConversationId === id) newChat();
  }
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  /* ── Format ── */
  function fmt(text: string): ReactNode {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const lang = lines[0]?.trim() || "";
        const code = (lang ? lines.slice(1) : lines).join("\n");
        return (
          <div key={i} className="my-3 rounded-lg overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-slate-400 text-xs">
              <span>{lang || "code"}</span>
              <button onClick={() => doCopy(`c${i}${Date.now()}`, code)} className="hover:text-white flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
            </div>
            <pre className="p-3 text-sm text-green-400 bg-slate-900 overflow-x-auto"><code>{code}</code></pre>
          </div>
        );
      }
      const segs = part.split(/(\*\*.*?\*\*|`[^`]+`)/g);
      return <span key={i}>{segs.map((s, j) => {
        if (s.startsWith("**") && s.endsWith("**")) return <strong key={j} className="font-semibold">{s.slice(2, -2)}</strong>;
        if (s.startsWith("`") && s.endsWith("`")) return <code key={j} className="bg-pink-50 text-purple-600 px-1 py-0.5 rounded text-sm">{s.slice(1, -1)}</code>;
        return <span key={j}>{s}</span>;
      })}</span>;
    });
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-pink-100 text-slate-700 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`} style={{ top: 64 }}>
        <div className="flex flex-col h-full">
          <div className="p-3">
            <button onClick={newChat} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-semibold rounded-xl hover:from-pink-400 hover:to-purple-500 transition-all brand-glow">
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {convs.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">No conversations yet</p> : convs.map(c => (
              <Link key={c.id} href={`/chat/${c.id}`} onClick={handleConvClick} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm group transition-colors ${activeConversationId === c.id ? "bg-pink-50 text-purple-600 border border-pink-200" : "text-slate-600 hover:bg-slate-50 hover:text-purple-600"}`}>
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
                <button onClick={(e) => delConv(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full">
              <img src="/icon.png" alt="ExtraAI" className="w-8 h-8 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">ExtraAI</p>
                <p className="text-[10px] text-slate-500 truncate">Advanced AI Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebar && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebar(false)} />}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="lg:hidden flex items-center gap-2 p-3 border-b border-slate-100">
          <button onClick={() => setSidebar(!sidebar)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            {sidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-slate-900">
            Extra<span className="text-pink-500">AI</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-10">
              {/* Real app icon — same as splash + Play Store */}
              <div className="mb-5 animate-float-up">
                <img
                  src="/icon.png"
                  alt="ExtraAI"
                  className="w-20 h-20 rounded-2xl object-cover animate-pulse-glow"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                How can I help you?
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                Ask anything, upload a file, or create an image
              </p>

              {/* HERO: Image generation — premium card */}
              <button
                onClick={() => { setInput("Generate an image of "); taRef.current?.focus(); }}
                className="w-full max-w-md mb-3 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-purple-50 border border-pink-200 rounded-2xl hover:shadow-md hover:shadow-pink-100 transition-all text-left animate-float-up"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 flex items-center justify-center shrink-0 brand-glow">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">Generate an image</p>
                  <p className="text-xs text-slate-500 truncate">Create stunning images from your description</p>
                </div>
                <Send className="w-4 h-4 text-pink-500 shrink-0" />
              </button>

            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {msgs.map(m => (
                <div key={m.id} className="flex items-start gap-3 animate-float-up">
                  {m.role === "user" ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-700">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <img src="/icon.png" alt="ExtraAI" className="w-8 h-8 rounded-full object-cover shrink-0 brand-glow" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-pink-500 mb-1">{m.role === "user" ? "You" : "ExtraAI"}</p>
                    {m.uploadedImage && <img src={m.uploadedImage} alt="Uploaded" className="rounded-lg max-w-[200px] mb-2 border border-pink-200" />}
                    {m.fileLabel && <span className="inline-block text-xs bg-pink-50 text-purple-600 border border-pink-200 px-2 py-1 rounded-md mb-2">{m.fileLabel}</span>}

                    {m.loading && !m.content ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                        <span className="text-sm text-slate-400">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        {m.content && (
                          <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                            {fmt(m.content)}
                            {m.loading && <span className="inline-block w-2 h-4 bg-pink-500 ml-0.5 animate-pulse align-middle" />}
                          </div>
                        )}
                        {m.imageUrl && (
                          <div className="mt-3">
                            <img
                              src={m.imageUrl}
                              alt="Generated"
                              className="rounded-xl max-w-full sm:max-w-md border border-pink-200 brand-glow cursor-pointer"
                              loading="lazy"
                              onClick={() => window.open(m.imageUrl as string, "_blank")}
                              onError={(e) => {
                                // If proxy fails, fall back to the direct URL
                                if (m.imageDirectUrl && (e.currentTarget as HTMLImageElement).src !== m.imageDirectUrl) {
                                  (e.currentTarget as HTMLImageElement).src = m.imageDirectUrl;
                                }
                              }}
                            />
                            <div className="flex gap-4 mt-2">
                              <button
                                onClick={() => window.open(m.imageUrl as string, "_blank")}
                                className="text-xs text-pink-500 hover:text-purple-600 flex items-center gap-1"
                              >
                                <ImageIcon className="w-3 h-3" /> Open
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const r = await fetch(m.imageUrl as string);
                                    const blob = await r.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `ExtraAI_${Date.now()}.jpg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                  } catch {
                                    // Fallback: open in new tab
                                    window.open(m.imageUrl as string, "_blank");
                                  }
                                }}
                                className="text-xs text-pink-500 hover:text-purple-600 flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                            </div>
                          </div>
                        )}
                        {m.role === "assistant" && !m.loading && m.content && m.content.length > 1 && (
                          <div className="flex items-center gap-1 mt-3 flex-wrap">
                            <button onClick={() => doCopy(m.id, m.content)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-purple-600 px-2 py-1 rounded-md hover:bg-pink-50 border border-transparent hover:border-pink-200">
                              {copied === m.id ? <><Check className="w-3 h-3 text-pink-500" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                            <button onClick={() => doSpeak(m.id, m.content)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-purple-600 px-2 py-1 rounded-md hover:bg-pink-50 border border-transparent hover:border-pink-200">
                              {speaking === m.id ? <><VolumeX className="w-3 h-3 text-orange-400" /> Stop</> : <><Volume2 className="w-3 h-3" /> Speak</>}
                            </button>
                            <button onClick={() => doPdf(m.content)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-purple-600 px-2 py-1 rounded-md hover:bg-pink-50 border border-transparent hover:border-pink-200">
                              <FileDown className="w-3 h-3" /> PDF
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Ads (env-driven, user-friendly) */}
        <InterstitialAd ref={interstitialRef} />
        <AdBanner />


        {/* Input */}
        <div className="border-t border-pink-100 bg-white p-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            {(pendingImage || pendingPdf) && (
              <div className="mb-2 flex items-center gap-2">
                {pendingImage && (
                  <div className="relative">
                    <img src={pendingImage} alt="Pending" className="w-14 h-14 rounded-lg object-cover border border-pink-300" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-pink-300 text-purple-600 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                )}
                {pendingPdf && (
                  <div className="relative flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-pink-500" />
                    <span className="text-xs text-purple-700 max-w-[150px] truncate">{pendingPdf.name}</span>
                    <button onClick={() => setPendingPdf(null)} className="text-slate-400 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <span className="text-xs text-pink-400">{pendingImage ? "Image attached — ask about it" : "PDF attached — ask about it"}</span>
              </div>
            )}
            <form onSubmit={submit} className="flex items-end gap-1.5 bg-slate-50 border border-pink-200 rounded-2xl p-2 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-100 transition-all">
              <input ref={imgRef} type="file" accept="image/*,application/pdf" onChange={onAnyFile} className="hidden" />
              <button type="button" onClick={() => imgRef.current?.click()} className="p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors shrink-0" title="Attach photo or PDF"><Paperclip className="w-4 h-4" /></button>
              <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask anything..." rows={1} disabled={busy} className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm resize-none max-h-32 min-h-[36px] py-1.5" style={{ height: Math.min(Math.max(36, input.split("\n").length * 24), 128) }} />
              <button type="button" onClick={toggleVoice} className={`p-2 rounded-lg transition-colors shrink-0 ${listening ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"}`} title="Voice input">{listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
              <button type="submit" disabled={busy || (!input.trim() && !pendingImage && !pendingPdf)} className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 transition-all shrink-0 brand-glow">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
            </form>
            <p className="text-[11px] text-slate-400 text-center mt-1.5">ExtraAI can make mistakes. Check important info.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
