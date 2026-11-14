import { Binary, Layers, Sliders, History } from "lucide-react";

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 6 • Digital Representation</div>
        <h1 className="text-2xl font-bold text-white mt-1">Predictive Farm Digital Twin</h1>
        <p className="text-sm text-zinc-400">Integrated virtual model of farm state, historical snapshots, and what-if simulation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs">Twin Health</span>
            <Binary className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">Active</div>
          <div className="text-xs text-zinc-400">Aggregating 5 data streams</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs">Data Completeness</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">72%</div>
          <div className="text-xs text-zinc-400">Pending physical soil test</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs">Snapshot Date</span>
            <History className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">Current</div>
          <div className="text-xs text-zinc-400">Updated with recent telemetry</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs">What-If Scenarios</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">Ready</div>
          <div className="text-xs text-zinc-400">Simulate delayed rainfall / crops</div>
        </div>
      </div>
    </div>
  );
}

