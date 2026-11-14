import { FlaskConical, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SoilIntelligencePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 3 • Soil Intelligence</div>
        <h1 className="text-2xl font-bold text-white mt-1">Soil Intelligence & Nutrients</h1>
        <p className="text-sm text-zinc-400">Farmer lab test observations and ISRIC SoilGrids modelled profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>ISRIC SoilGrids 250m Estimates</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Modelled</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-zinc-500">Soil pH (in H2O)</div>
              <div className="text-base font-bold text-white mt-1">5.8 (Moderately Acidic)</div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-zinc-500">Soil Texture</div>
              <div className="text-base font-bold text-white mt-1">Clay Loam</div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-zinc-500">Organic Carbon</div>
              <div className="text-base font-bold text-white mt-1">21.4 g/kg</div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-zinc-500">Bulk Density</div>
              <div className="text-base font-bold text-white mt-1">1.28 cg/cm³</div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Source: ISRIC SoilGrids modelled global estimations. Labelled as estimates, not physical laboratory measurements.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Farmer Laboratory Test Records</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/40">
              Lab Tests Missing
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            No farmer-uploaded laboratory soil test on record. NPK deficiencies are never fabricated when physical laboratory
            measurements are absent.
          </p>
          <div className="p-3 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-400 space-y-2">
            <div className="font-medium text-zinc-300">Recommended Next Step:</div>
            <div>Submit a regional Krishi Bhavan soil test (Available N, P2O5, K2O, Micronutrients) to enhance suitability accuracy.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

