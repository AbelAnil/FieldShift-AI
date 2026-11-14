"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Wrench,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  User,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  Farm,
  ChatMessageItem,
  PromptSuggestion,
  fetchSuggestedPrompts,
  sendChatMessage,
  fetchChatHistory,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AssistantPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    if (selectedFarm && token) {
      loadFarmContext(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  async function loadFarmContext(farmId: string, userToken: string) {
    try {
      // 1. Fetch suggested prompts
      const promptList = await fetchSuggestedPrompts(farmId, userToken);
      setPrompts(promptList);

      // 2. Fetch recent chat history
      const history = await fetchChatHistory(farmId, userToken);
      if (history.length > 0) {
        setMessages(history);
        setSessionId(history[history.length - 1].session_id);
      } else {
        // Welcome message if no previous history
        setMessages([
          {
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
          },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to load farm context:", err);
    }
  }

  const handleSelectFarm = async (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    selectFarm(found);
    setMessages([]);
    setSessionId(undefined);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedFarm || !token || isSending) return;

    setInputText("");
    setIsSending(true);
    setError(null);

    // Optimistically add user message
    const tempUserMsg: ChatMessageItem = {
      id: "temp-" + Date.now(),
      session_id: sessionId || "session",
      sender: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(selectedFarm.id, text, token, sessionId);
      setSessionId(response.session_id);

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
    } catch (err: any) {
      setError(err.message || "Failed to receive response from AI Assistant");
    } finally {
      setIsSending(false);
    }
  };

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Helper to render markdown text neatly
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

  const renderFormattedInline = (text: string) => {
    // Process bold (**text**) and code (`text`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="px-1 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[10px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Farm Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 7 • Conversational AI</div>
          <h1 className="text-2xl font-bold text-white mt-1">AI Farm Assistant</h1>
          <p className="text-sm text-zinc-400">Context-aware agronomic guidance grounded in NASA telemetry and KAU scientific models.</p>
        </div>

        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Farm:</span>
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

      {/* Safeguard & Integrity Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Deterministic Grounding:</strong> Uses rule-based tool-calling against live farm telemetry. Never fabricates NPK nutrient doses without a physical lab test.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine: Local Telemetry Dispatcher</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      {prompts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suggested Questions for {selectedFarm?.farm_name}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.prompt)}
                disabled={isSending}
                className="text-left p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800/80 hover:border-emerald-500/50 transition duration-150 group"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 group-hover:text-emerald-300">
                  {p.category}
                </div>
                <div className="text-xs text-zinc-200 font-medium mt-1 group-hover:text-white line-clamp-2">
                  {p.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Thread Container */}
      <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col h-[560px] overflow-hidden shadow-xl">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Connecting to farm digital twin...</span>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-400 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4.5 space-y-3 ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                      : "bg-zinc-950/90 border border-zinc-800/90 rounded-tl-none shadow-sm"
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pb-1 border-b border-zinc-800/40">
                    <span className={m.sender === "user" ? "text-emerald-100 font-semibold" : "text-emerald-400 font-semibold"}>
                      {m.sender === "user" ? "You (Farmer)" : "FieldShift AI"}
                    </span>
                    <span className={m.sender === "user" ? "text-emerald-200" : "text-zinc-500"}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Body Text */}
                  {m.sender === "user" ? (
                    <p className="text-xs leading-relaxed">{m.content}</p>
                  ) : (
                    renderMessageContent(m.content)
                  )}

                  {/* Executed Tools Badge (Assistant only) */}
                  {m.tools_called && m.tools_called.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
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
                      </div>

                      {expandedTools[m.id] && (
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5 text-[11px]">
                          {m.tools_called.map((t, idx) => (
                            <div key={idx} className="border-b border-zinc-800/40 last:border-0 pb-1.5 last:pb-0">
                              <div className="font-mono text-emerald-400 text-[10px] font-semibold">{t.tool_name}</div>
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

                  {/* Scientific Citations (Assistant only) */}
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
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 mt-1 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Querying farm twin and agronomic knowledge base...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col gap-2">
          {error && (
            <div className="text-xs text-red-400 flex items-center gap-1.5 px-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || !selectedFarm}
              placeholder={
                selectedFarm
                  ? `Ask about ${selectedFarm.farm_name}'s crops, soil, NASA rainfall, rotation, or simulation...`
                  : "Select a farm to start chatting..."
              }
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim() || !selectedFarm}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-950/30"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}