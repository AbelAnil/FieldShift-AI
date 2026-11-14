import { RotateCcw, ShieldAlert, CheckCircle2, Droplets, Leaf } from "lucide-react";

export default function RotationPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 5 • Decision Engine</div>
        <h1 className="text-2xl font-bold text-white mt-1">Crop Rotation Optimization Planner</h1>
        <p className="text-sm text-zinc-400">Compare 3 distinct multi-year rotation strategies grounded in Kerala agronomic rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategy A */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 space-y-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Strategy A</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Soil Health Priority</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Prioritizes leguminous green manures (Cowpea, Green Gram) to restore biological nitrogen fixation and reduce soil-borne pathogenetic build-up.
          </p>
          <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-zinc-300">
              <span>Year 1:</span> <span className="font-semibold text-white">Banana (Robusta)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 2:</span> <span className="font-semibold text-emerald-400">Cowpea (Vigna unguiculata)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 3:</span> <span className="font-semibold text-white">Tapioca / Cassava</span>
            </div>
          </div>
        </div>

        {/* Strategy B */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Strategy B</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Water Efficiency Priority</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Optimizes for low-water demand crops and synchronizes cultivation windows strictly with historical NASA GPM rainfall probability distributions.
          </p>
          <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-zinc-300">
              <span>Year 1:</span> <span className="font-semibold text-white">Maize (Drought Tolerant)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 2:</span> <span className="font-semibold text-cyan-400">Black Gram (Urad)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 3:</span> <span className="font-semibold text-white">Turmeric (Curcuma longa)</span>
            </div>
          </div>
        </div>

        {/* Strategy C */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Strategy C</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Balanced Strategy</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Equilibrates commercial value with soil conservation, labor demands, and regional Kerala Agricultural University package of practices.
          </p>
          <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-zinc-300">
              <span>Year 1:</span> <span className="font-semibold text-white">Banana (Nendran)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 2:</span> <span className="font-semibold text-amber-400">Vegetable Cowpea</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Year 3:</span> <span className="font-semibold text-white">Ginger (Zingiber officinale)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

