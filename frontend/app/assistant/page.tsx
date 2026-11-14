"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Wrench,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  User,
  ChevronDown,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  ChevronRight,
} from "lucide-react";
import {
  ChatMessageItem,
  ChatSessionItem,
  PromptSuggestion,
  fetchSuggestedPrompts,
  sendChatMessage,
  fetchChatHistory,
  fetchChatSessions,
  createChatSession,
  deleteChatSession,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────── constants ─────────────────────── */

const LANGUAGES = [
  { code: "en", label: "English", sttTag: "en-IN" },
  { code: "ml", label: "മലയാളം", sttTag: "ml-IN" },
  { code: "hi", label: "हिन्दी", sttTag: "hi-IN" },
  { code: "ta", label: "தமிழ்", sttTag: "ta-IN" },
  { code: "es", label: "Español", sttTag: "es-ES" },
] as const;

const QUICK_TOPICS = [
  { emoji: "🪲", label: "Pests & Diseases" },
  { emoji: "🔄", label: "Crop Rotation" },
  { emoji: "🧪", label: "Soil Health & Liming" },
  { emoji: "🌧️", label: "NASA Weather & Rain" },
  { emoji: "⚡", label: "What-If Drought Sim" },
  { emoji: "💰", label: "Carbon Credits" },
] as const;

/* ─────────────────────── helpers ─────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ═══════════════════════ COMPONENT ═══════════════════════ */

export default function AssistantPage() {
  const { farms, selectedFarm, selectFarm, token } = useAuth();

  /* ── chat state ── */
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  /* ── session / topic state ── */
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── language & voice ── */
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  /* ── load farm context when farm changes ── */
  useEffect(() => {
    if (selectedFarm && token) {
      loadSessions(selectedFarm.id, token);
      loadPrompts(selectedFarm.id, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarm, token]);

  /* ── load messages when active session changes ── */
  useEffect(() => {
    if (selectedFarm && token && activeSessionId) {
      loadSessionMessages(selectedFarm.id, token, activeSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  /* ── cleanup speech on unmount ── */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ─────────────── data loaders ─────────────── */

  async function loadSessions(farmId: string, userToken: string) {
    try {
      const list = await fetchChatSessions(farmId, userToken);
      setSessions(list);
      if (list.length > 0) {
        setActiveSessionId(list[0].id);
      } else {
        setActiveSessionId(undefined);
        setMessages([welcomeMessage()]);
      }
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setMessages([welcomeMessage()]);
    }
  }

  async function loadPrompts(farmId: string, userToken: string) {
    try {
      const p = await fetchSuggestedPrompts(farmId, userToken);
      setPrompts(p);
    } catch (err: any) {
      console.error("Failed to load prompts:", err);
    }
  }

  async function loadSessionMessages(farmId: string, userToken: string, sessionId: string) {
    try {
      const history = await fetchChatHistory(farmId, userToken, sessionId);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([welcomeMessage()]);
      }
    } catch (err: any) {
      console.error("Failed to load session messages:", err);
    }
  }

  function welcomeMessage(): ChatMessageItem {
    return {
      id: "welcome-1",
      session_id: "init",
      sender: "assistant",
      content: `Namaskaram! I am your **FieldShift AI Farm Assistant**.\n\nI have connected to your farm's digital twin, NASA GPM IMERG precipitation telemetry, SoilGrids baseline, and crop suitability models.\n\nHow can I help you optimize your farming operations today?`,
      citations: [
        "Kerala Agricultural University (KAU) Package of Practices",
        "NASA Earth Science Data Systems",
      ],
      tools_called: [
        {
          tool_name: "get_farm_digital_twin",
          description: "Connected to farm virtual replica",
          summary_result: "Telemetry synchronized",
        },
      ],
      created_at: new Date().toISOString(),
    };
  }

  /* ─────────────── session actions ─────────────── */

  const handleNewTopic = async (title: string = "New Topic") => {
    if (!selectedFarm || !token) return;
    try {
      const newSession = await createChatSession(selectedFarm.id, title, token);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([welcomeMessage()]);
      setSidebarOpen(false);
      return newSession;
    } catch (err: any) {
      console.error("Failed to create session:", err);
      return null;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!token) return;
    try {
      await deleteChatSession(sessionId, token);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(undefined);
          setMessages([welcomeMessage()]);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSidebarOpen(false);
  };

  /* ─────────────── chat actions ─────────────── */

  const handleSelectFarm = async (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    selectFarm(found);
    setMessages([]);
    setActiveSessionId(undefined);
    setSessions([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedFarm || !token || isSending) return;

    setInputText("");
    setIsSending(true);
    setError(null);

    /* Auto-create a session if none active */
    let sid = activeSessionId;
    if (!sid) {
      const newSession = await handleNewTopic("General");
      if (newSession) {
        sid = newSession.id;
      }
    }

    /* Optimistic user message */
    const tempUserMsg: ChatMessageItem = {
      id: "temp-" + Date.now(),
      session_id: sid || "session",
      sender: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(selectedFarm.id, text, token, sid, language);
      if (!sid) setActiveSessionId(response.session_id);

      const assistantMsg: ChatMessageItem = {
        id: response.message_id,
        session_id: response.session_id,
        sender: "assistant",
        content: response.reply,
        tools_called: response.tools_executed,
        citations: response.citations,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      /* refresh session list to update message counts */
      loadSessions(selectedFarm.id, token).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Failed to receive response from AI Assistant");
    } finally {
      setIsSending(false);
    }
  };

  /* ── quick topic chip handler ── */
  const handleQuickTopic = async (topic: typeof QUICK_TOPICS[number]) => {
    if (!selectedFarm || !token) return;
    const label = `${topic.emoji} ${topic.label}`;
    const newSession = await handleNewTopic(topic.label);
    if (newSession) {
      /* small delay so state settles, then send the chip text */
      setTimeout(() => {
        handleSendMessageForSession(newSession.id, `Tell me about ${topic.label}`);
      }, 100);
    }
  };

  const handleSendMessageForSession = async (sessionId: string, text: string) => {
    if (!selectedFarm || !token || isSending) return;
    setIsSending(true);
    setError(null);

    const tempUserMsg: ChatMessageItem = {
      id: "temp-" + Date.now(),
      session_id: sessionId,
      sender: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(selectedFarm.id, text, token, sessionId, language);
      const assistantMsg: ChatMessageItem = {
        id: response.message_id,
        session_id: response.session_id,
        sender: "assistant",
        content: response.reply,
        tools_called: response.tools_executed,
        citations: response.citations,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      loadSessions(selectedFarm.id, token).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Failed to receive response");
    } finally {
      setIsSending(false);
    }
  };

  /* ─────────────── STT (Speech-to-Text) ─────────────── */

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping recognition:", e);
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    setError(null);

    try {
      const recognition = new SpeechRecognition();
      const currentLangConfig = LANGUAGES.find((l) => l.code === language);
      recognition.lang = currentLangConfig?.sttTag || "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false; // Auto-finishes when user stops speaking
      recognition.maxAlternatives = 1;

      // Keep base text if already present in input
      const initialText = inputText.trim();

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript) {
          const separator = initialText.length > 0 ? " " : "";
          setInputText(initialText ? `${initialText}${separator}${fullTranscript}` : fullTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(
            "Microphone permission was denied. Please allow microphone access in your browser address bar."
          );
        } else if (event.error === "network") {
          setError(
            "Speech recognition network error: Browser speech service requires internet connection. You can also use the preset voice chips below."
          );
        } else if (event.error === "audio-capture") {
          setError("No microphone was detected. Please plug in or select a microphone in your OS settings.");
        } else if (event.error === "language-not-supported") {
          setError(
            `Voice recognition for '${currentLangConfig?.label || language}' is not supported by your browser engine. Try switching to English.`
          );
        } else if (event.error !== "no-speech") {
          setError(`Voice input notice (${event.error}). Click again or type your question.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (startErr: any) {
      console.error("Failed to start speech recognition:", startErr);
      setError("Unable to initialize microphone. Please check browser permissions or use the quick query chips.");
      setIsRecording(false);
    }
  }, [isRecording, language, inputText]);

  /* ─────────────── TTS (Text-to-Speech) ─────────────── */

  const toggleSpeak = useCallback(
    (msgId: string, text: string) => {
      if (speakingMsgId === msgId) {
        window.speechSynthesis?.cancel();
        setSpeakingMsgId(null);
        return;
      }

      window.speechSynthesis?.cancel();

      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`(.*?)`/g, "$1")
        .replace(/^#{1,4}\s/gm, "")
        .replace(/^[-*]\s/gm, "")
        .replace(/^>\s/gm, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const langTag = LANGUAGES.find((l) => l.code === language)?.sttTag || "en-IN";
      utterance.lang = langTag;
      utterance.rate = 0.95;

      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    },
    [speakingMsgId, language]
  );

  /* ─────────────── expand tools ─────────────── */

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  /* ─────────────── markdown renderer ─────────────── */

  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[10px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-2 text-xs text-zinc-200 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-sm font-bold text-white pt-2 border-b border-zinc-800 pb-1">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("#### ")) {
            return (
              <h4 key={idx} className="text-xs font-semibold text-emerald-400 pt-1.5 uppercase tracking-wider">
                {line.replace("#### ", "")}
              </h4>
            );
          }
          if (line.startsWith("> ⚠️") || line.startsWith("> ")) {
            return (
              <div key={idx} className="p-2.5 my-1.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-[11px]">
                {line.replace(/^>\s*/, "")}
              </div>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const clean = line.replace(/^[-*]\s*/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-400 font-bold shrink-0">•</span>
                <span>{renderFormattedInline(clean)}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)?.[1];
            const clean = line.replace(/^\d+\.\s*/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-400 font-mono font-semibold shrink-0">{num}.</span>
                <span>{renderFormattedInline(clean)}</span>
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{renderFormattedInline(line)}</p>;
        })}
      </div>
    );
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto">
      {/* ─── Header & Farm Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 px-4 pt-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-emerald-500/50 transition"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Phase 7 • Conversational AI
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">AI Farm Assistant</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Farm Selector */}
          {farms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-medium">Farm:</span>
              <select
                value={selectedFarm?.id || ""}
                onChange={(e) => handleSelectFarm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.location_name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Layout: Sidebar + Chat ─── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* ═══ Mobile Sidebar Overlay ═══ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══ Sidebar ═══ */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-200
            md:relative md:translate-x-0 md:z-auto md:flex
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Topics
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNewTopic()}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                title="New Topic"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white md:hidden transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center text-zinc-500 text-[11px] py-8 px-4">
                No topics yet. Start a conversation or click a quick topic below.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    activeSessionId === s.id
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-white"
                      : "hover:bg-zinc-900 border border-transparent text-zinc-300 hover:text-white"
                  }`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{s.title}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{relativeTime(s.updated_at)}</span>
                      {s.message_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-mono">
                          {s.message_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(s.id);
                    }}
                    className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete topic"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══ Main Chat Panel ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Safeguard Banner */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Deterministic Grounding:</strong> Rule-based tool-calling against live
                  farm telemetry. Never fabricates NPK doses.
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Engine: Local Telemetry Dispatcher</span>
              </div>
            </div>
          </div>

          {/* Quick Topic Chips */}
          <div className="px-4 py-3 border-b border-zinc-800/60 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleQuickTopic(topic)}
                  disabled={isSending || !selectedFarm}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:border-emerald-500/50 hover:text-white transition whitespace-nowrap disabled:opacity-50"
                >
                  {topic.emoji} {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Prompts (only when no messages beyond welcome) */}
          {prompts.length > 0 && messages.length <= 1 && (
            <div className="px-4 py-3 border-b border-zinc-800/40 shrink-0">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Suggested for {selectedFarm?.farm_name}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {prompts.slice(0, 6).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.prompt)}
                    disabled={isSending}
                    className="text-left p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 hover:border-emerald-500/40 transition group"
                  >
                    <div className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/70 group-hover:text-emerald-400">
                      {p.category}
                    </div>
                    <div className="text-[11px] text-zinc-300 font-medium mt-0.5 group-hover:text-white line-clamp-2">
                      {p.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Messages ─── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-400 mt-1">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-3.5 sm:p-4 space-y-3 ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                      : "bg-zinc-950/90 border border-zinc-800/90 rounded-tl-none shadow-sm"
                  }`}
                >
                  {/* Sender & Time */}
                  <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-zinc-800/40">
                    <span
                      className={
                        m.sender === "user"
                          ? "text-emerald-100 font-semibold"
                          : "text-emerald-400 font-semibold"
                      }
                    >
                      {m.sender === "user" ? "You (Farmer)" : "FieldShift AI"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={m.sender === "user" ? "text-emerald-200" : "text-zinc-500"}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {/* TTS button for assistant messages */}
                      {m.sender === "assistant" && m.id !== "welcome-1" && (
                        <button
                          onClick={() => toggleSpeak(m.id, m.content)}
                          className="p-1 rounded-md hover:bg-zinc-800 transition text-zinc-500 hover:text-zinc-200"
                          title={speakingMsgId === m.id ? "Stop reading" : "Read aloud"}
                        >
                          {speakingMsgId === m.id ? (
                            <VolumeX className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {m.sender === "user" ? (
                    <p className="text-xs leading-relaxed">{m.content}</p>
                  ) : (
                    renderMessageContent(m.content)
                  )}

                  {/* Tools Badge */}
                  {m.tools_called && m.tools_called.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                      <button
                        onClick={() => toggleToolExpand(m.id)}
                        className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono transition"
                      >
                        <Wrench className="w-3 h-3 text-emerald-400" />
                        <span>{m.tools_called.length} Telemetry Tool(s) Executed</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${
                            expandedTools[m.id] ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedTools[m.id] && (
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5 text-[11px]">
                          {m.tools_called.map((t, idx) => (
                            <div
                              key={idx}
                              className="border-b border-zinc-800/40 last:border-0 pb-1.5 last:pb-0"
                            >
                              <div className="font-mono text-emerald-400 text-[10px] font-semibold">
                                {t.tool_name}
                              </div>
                              <div className="text-zinc-400 text-[10px]">{t.description}</div>
                              <div className="text-zinc-300 font-medium text-[10px] mt-0.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/40">
                                Result: {t.summary_result}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                      <BookOpen className="w-3 h-3 text-zinc-500" />
                      {m.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 mt-1">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Sending indicator */}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-400 mt-1">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Querying farm twin and agronomic knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Input Bar ─── */}
          <div
            className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 shrink-0"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {isRecording && (
              <div className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2 mb-2 flex items-center justify-between gap-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>
                    Listening in <strong>{currentLang.label}</strong>... Speak into your microphone.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 text-white font-semibold transition"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl px-3 py-2 mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span className="truncate">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-[10px] text-zinc-400 hover:text-white px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Multi-lingual Voice Query Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px] no-scrollbar">
              <span className="text-zinc-500 text-[10px] uppercase font-mono shrink-0">Try Voice:</span>
              <button
                type="button"
                onClick={() => {
                  setLanguage("ml");
                  setInputText("വാഴയ്ക്ക് പകരം പയർ കൃഷി ചെയ്യാമോ?");
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 shrink-0 transition"
              >
                🎙️ മലയാളം: വാഴയ്ക്ക് പകരം പയർ കൃഷി ചെയ്യാമോ?
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("hi");
                  setInputText("मेरी मिट्टी में कौन सी फसल सबसे अच्छी रहेगी?");
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-cyan-400 shrink-0 transition"
              >
                🎙️ हिन्दी: दलहन फसलें कैसे लगाएं?
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setInputText("How can I improve soil nitrogen with legumes?");
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 shrink-0 transition"
              >
                🎙️ English: How to boost nitrogen with legumes?
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Language Selector */}
              <div className="relative shrink-0">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-xl pl-7 pr-3 py-2.5 sm:py-3 focus:outline-none focus:border-emerald-500 cursor-pointer min-h-[44px]"
                  title="Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending || !selectedFarm}
                placeholder={
                  selectedFarm
                    ? `Ask about ${selectedFarm.farm_name}...`
                    : "Select a farm to start..."
                }
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 sm:py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
              />

              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={!selectedFarm}
                className={`p-2.5 sm:p-3 rounded-2xl transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isRecording
                    ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-emerald-500/50"
                }`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? (
                  <div className="relative">
                    <MicOff className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending || !inputText.trim() || !selectedFarm}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-950/30 min-h-[44px]"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
