import { MapPin, Plus, Sparkles, AlertCircle } from "lucide-react";

export default function FarmsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 1 • Farm Management</div>
          <h1 className="text-2xl font-bold text-white mt-1">My Farms & Field Boundaries</h1>
          <p className="text-sm text-zinc-400">Register agricultural holdings and draw field boundaries with MapLibre GL.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-950">
          <Plus className="w-4 h-4" />
          <span>Register New Farm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Farm Card (Kerala Pilot) */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                FARM-KL-001
              </span>
              <h3 className="text-lg font-bold text-zinc-100 mt-2">Kanjirappally Valley Farm</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kottayam District, Kerala (9.55° N, 76.78° E)</span>
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
              Pilot Farm
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500">Total Area</div>
              <div className="font-semibold text-zinc-200 mt-1">1.85 Hectares</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500">Current Crop</div>
              <div className="font-semibold text-emerald-400 mt-1">Robusta Banana</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500">Irrigation</div>
              <div className="font-semibold text-zinc-200 mt-1">Drip Available</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800">
            <span className="text-zinc-400">Boundary: PostGIS GeoJSON Polygons (EPSG:4326)</span>
            <span className="text-emerald-400 font-medium">Ready for MapLibre</span>
          </div>
        </div>

        {/* Phase 1 Roadmap Notice */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 space-y-3 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Phase 1 Scope: Interactive Field Mapping</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            In Phase 1, we install PostgreSQL + PostGIS, configure SQLAlchemy schemas, and integrate MapLibre GL JS with
            Terra Draw so you can search your location, draw farm boundaries interactively, and calculate field acreages.
          </p>
        </div>
      </div>
    </div>
  );
}
