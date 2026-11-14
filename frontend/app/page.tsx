import Link from "next/link";
import {
  Satellite,
  RotateCcw,
  FlaskConical,
  Mountain,
  Sprout,
  ArrowRight,
  TrendingUp,
  Droplets,
  CloudSun,
  ShieldCheck,
  MapPin,
  Bot,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-900/40 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span>NASA Space Apps Challenge 2026</span>
            <span>•</span>
            <span>Team ChungusReloaded</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Adapting Farms with NASA Earth Observations
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            FieldShift AI creates a farm-level predictive digital twin integrating NASA satellite observations,
            ISRIC soil intelligence, terrain hydrology, and crop rotation optimization to help farmers in Kerala adapt
            to shifting monsoons and climate volatility.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/farms"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-950"
            >
              <span>Explore My Farms</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/earth-intelligence"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-medium transition-all"
            >
              <Satellite className="w-4 h-4 text-emerald-400" />
              <span>Earth Intelligence</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pilot Region</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Kerala, IN</div>
            <div className="text-xs text-zinc-400 mt-1">Highland & Midland Agro-zones</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">NASA Rainfall (GPM)</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">IMERG v07</div>
            <div className="text-xs text-zinc-400 mt-1">0.1° (~10 km) Multi-satellite</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Vegetation Indices</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">NDVI & NDMI</div>
            <div className="text-xs text-zinc-400 mt-1">Landsat 8/9 & Sentinel-2 (10-30m)</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rotation Engine</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">3 Strategies</div>
            <div className="text-xs text-zinc-400 mt-1">Soil Health • Water • Balanced</div>
          </div>
        </div>
      </div>

      {/* Core Workflow Pipeline */}
      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">System Architecture Pipeline</h2>
            <p className="text-xs text-zinc-400">From satellite telemetry to farmer decision support</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Scientifically Grounded</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
          {[
            { step: "01", title: "NASA Earth Data", desc: "GPM, SMAP, POWER, Landsat" },
            { step: "02", title: "Geospatial Engine", desc: "NDVI, NDMI, Slope, Flow" },
            { step: "03", title: "Digital Twin", desc: "Farm profile & field history" },
            { step: "04", title: "Crop Suitability", desc: "Kerala agro-climatic scoring" },
            { step: "05", title: "Rotation Planner", desc: "Multi-year strategy optimizer" },
            { step: "06", title: "AI Assistant & Tasks", desc: "Grounded guidance & reminders" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-emerald-500/40 transition-colors space-y-2 relative"
            >
              <div className="text-[10px] font-mono text-emerald-400 font-bold">{item.step}</div>
              <div className="font-semibold text-zinc-200">{item.title}</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/earth-intelligence"
          className="group p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Satellite className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            Earth Intelligence
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Monitor historical GPM rainfall patterns, regional SMAP soil moisture anomalies, and multispectral
            vegetation stress indices.
          </p>
        </Link>

        <Link
          href="/rotation"
          className="group p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            Crop Rotation Optimizer
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Compare 3 alternative sequence plans (Soil Health, Water Efficiency, and Balanced) optimized for Kerala
            agro-climatic zones.
          </p>
        </Link>

        <Link
          href="/assistant"
          className="group p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition space-y-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            AI Farm Assistant
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Context-aware conversational assistant grounded in actual farm calculations with zero hallucination and
            actionable reminder generation.
          </p>
        </Link>
      </div>
    </div>
  );
}
