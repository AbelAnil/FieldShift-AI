import { Satellite, Droplets, Sun, Info } from "lucide-react";

export default function EarthIntelligencePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 2 • NASA Integration</div>
        <h1 className="text-2xl font-bold text-white mt-1">Earth Intelligence Dashboard</h1>
        <p className="text-sm text-zinc-400">NASA Earth observation feeds and multi-spectral vegetation indicators.</p>
      </div>

      {/* Dataset Provenance & Scientific Integrity Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <span className="font-semibold text-amber-300">Scientific Integrity Notice:</span> NASA SMAP (soil moisture ~9km)
          and GPM IMERG (rainfall ~10km) provide essential regional climate context and anomalies, but are gridded satellite
          estimates, not field-level rain gauges or in-situ probe measurements.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">GPM IMERG v07</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="font-bold text-zinc-100">NASA Rainfall Trends</h3>
          <p className="text-xs text-zinc-400">
            Precipitation accumulations, 7-day rolling totals, and heavy rainfall anomaly flags for Kerala monsoon seasons.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Landsat 8/9 & S2</span>
            <Satellite className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-bold text-zinc-100">Vegetation Indices (NDVI / NDMI)</h3>
          <p className="text-xs text-zinc-400">
            Canopy vigor and moisture stress monitoring with cloud-filtered surface reflectance and acquisition date transparency.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">NASA POWER</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-bold text-zinc-100">Agroclimatology & Radiation</h3>
          <p className="text-xs text-zinc-400">
            Daily air temperature min/max, all-sky surface solar radiation, and relative humidity trends for crop growth modeling.
          </p>
        </div>
      </div>
    </div>
  );
}

