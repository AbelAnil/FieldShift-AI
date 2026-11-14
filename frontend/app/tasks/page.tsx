import { CalendarCheck, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 8 • Action Engine</div>
          <h1 className="text-2xl font-bold text-white mt-1">Smart Farm Tasks & Reminders</h1>
          <p className="text-sm text-zinc-400">Condition-based farm suggestions and farmer-approved activity checklists.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition">
          <Plus className="w-4 h-4" />
          <span>New Farm Task</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Mock Task Item */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-zinc-200">Inspect southern drainage channel</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Trigger: NASA GPM forecast &gt;45mm rainfall in 48 hours • Southern depression swale
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-zinc-400">Priority: High</span>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition">
              Mark Complete
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-zinc-200">Submit Krishi Bhavan soil sample</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Trigger: Missing NPK measurements in Soil Profile for Kanjirappally field
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-zinc-400">Priority: Medium</span>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition">
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
