import { Mountain, Waves, AlertCircle } from "lucide-react";

export default function TerrainPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 3 • Hydrology</div>
        <h1 className="text-2xl font-bold text-white mt-1">Terrain & Drainage Hydrology</h1>
        <p className="text-sm text-zinc-400">NASADEM / Copernicus DEM elevation, slope, flow accumulation, and water accumulation risk.</p>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">Preliminary Indicator:</span> DEM-derived flow accumulation maps
          indicate topographic water gathering potential, not confirmed subsurface waterlogging. Actual drainage also depends
          on farm drains, infiltration rate, and soil permeability.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-xs font-mono text-zinc-400">Elevation Analysis</div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-emerald-400" />
            <span>NASADEM ~30m</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Field relief range: 142m - 158m MSL. Gentle undulating terrain characteristic of midland Kottayam rubber/plantation slopes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-xs font-mono text-zinc-400">Slope Gradient</div>
          <h3 className="font-bold text-zinc-100">Slope & Aspect</h3>
          <p className="text-xs text-zinc-400">
            Average slope: 4.2° (Class 2: Gently sloping). Low soil erosion hazard under perennial cover.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-xs font-mono text-zinc-400">Hydrological Flow</div>
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>PySheds Flow Routing</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Natural swale identified along southern boundary. Low-to-moderate water accumulation concern during peak South-West monsoon.
          </p>
        </div>
      </div>
    </div>
  );
}

