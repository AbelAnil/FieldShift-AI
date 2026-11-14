import { Bot, Send, Sparkles, ShieldCheck } from "lucide-react";

export default function AssistantPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 7 • Conversational AI</div>
        <h1 className="text-2xl font-bold text-white mt-1">AI Farm Assistant</h1>
        <p className="text-sm text-zinc-400">Context-aware guidance grounded in actual farm calculations with tool-calling capabilities.</p>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Agricultural Safeguards: No hallucinated readings; cites ICAR / KAU guidelines; asks confirmation before creating tasks.</span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">Backend: FastAPI Tools</span>
      </div>

      {/* Mock Chat Box */}
      <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 max-w-xl space-y-2">
              <p>
                Namaskaram! I am your <strong>FieldShift AI Assistant</strong>. I have access to your Kanjirappally Valley Farm profile,
                NASA GPM rainfall telemetry, SoilGrids estimates, and crop suitability models.
              </p>
              <p className="text-zinc-400">
                You can ask me questions like:
              </p>
              <ul className="list-disc list-inside space-y-1 text-emerald-400/90 font-medium">
                <li>&quot;What should I plant after harvesting my current Robusta Banana crop?&quot;</li>
                <li>&quot;Has my field received unusually heavy rainfall this month according to GPM?&quot;</li>
                <li>&quot;Why is my vegetation moisture index decreasing?&quot;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="pt-4 border-t border-zinc-800 flex items-center gap-3">
          <input
            type="text"
            disabled
            placeholder="AI Farm Assistant will be activated in Phase 7..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-400 focus:outline-none cursor-not-allowed"
          />
          <button
            disabled
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-500 cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
