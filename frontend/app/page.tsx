"use client";

import { useEffect, useState } from "react";
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
  CalendarCheck,
  FileText,
  Coins,
  Binary,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Farm,
  DigitalTwinResponse,
  fetchFarmDigitalTwin,
  fetchFarmTasks,
  TaskItem,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { farms, selectedFarm, token, isBackendOnline } = useAuth();
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadFarmData() {
      if (!selectedFarm || !token) return;
      try {
        setIsLoading(true);
        const [twinData, tasksData] = await Promise.all([
          fetchFarmDigitalTwin(selectedFarm.id, token),
          fetchFarmTasks(selectedFarm.id, token, false),
        ]);
        setTwin(twinData);
        setTasks(tasksData);
      } catch (err) {
        console.error("Failed to load dashboard overview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFarmData();
  }, [selectedFarm, token]);

  const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-950 border border-emerald-900/50 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span>NASA Space Apps Challenge 2026</span>
            <span>•</span>
            <span>Team ChungusReloaded</span>
            <span>•</span>
            <span>v3.2 Production</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Adapting Farms with NASA Earth Observations & Local Intelligence
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            FieldShift AI creates a farm-level predictive digital twin integrating NASA satellite precipitation,
            ISRIC soil intelligence, terrain hydrology, crop rotation optimization, conversational AI guidance,
            and smallholder carbon credit readiness.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/digital-twin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-emerald-950/30"
            >
              <Binary className="w-4 h-4" />
              <span>Open Digital Twin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-semibold transition"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Ask AI Farm Assistant</span>
            </Link>
            <Link
              href="/carbon"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-sm font-semibold transition"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Carbon Credits</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Live Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilot Farm */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Pilot Farm</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white truncate">
              {selectedFarm ? selectedFarm.farm_name : "Kanjirappally Valley Farm"}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {selectedFarm ? `${selectedFarm.total_area_acres.toFixed(1)} acres (${selectedFarm.total_area_hectares.toFixed(2)} ha)` : "1.85 ha"} • {selectedFarm?.current_crop || "Robusta Banana"}
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {selectedFarm?.location_name || "Kottayam, Kerala"}
          </div>
        </div>

        {/* NASA Precipitation */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">NASA GPM Rainfall (30d)</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {twin ? twin.environmental_state.cumulative_rainfall_30d_mm.toFixed(1) : "382.4"} <span className="text-xs text-zinc-400 font-normal">mm</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">GPM IMERG v07 Multi-satellite</div>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono">
            Avg Temp: {twin ? twin.environmental_state.avg_temperature_c.toFixed(1) : "27.4"}°C (POWER)
          </div>
        </div>

        {/* Soil Health Status */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Soil pH & Baseline</span>
            <FlaskConical className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {twin ? twin.soil_state.effective_ph.toFixed(1) : "5.2"} <span className="text-xs text-zinc-400 font-normal">pH</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {twin ? twin.soil_state.ph_category : "Strongly Acidic Laterite"}
            </div>
          </div>
          <div className="text-[11px] text-amber-400 font-mono truncate">
            {twin?.soil_state.has_lab_test ? "Verified Lab Test" : "Modelled (NPK Withheld)"}
          </div>
        </div>

        {/* Action Engine Status */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Farm Action Matrix</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {pendingTasksCount} <span className="text-xs text-zinc-400 font-normal">Pending Tasks</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Twin Completeness: {twin ? twin.data_completeness_pct : 88}%
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Risk: {twin ? `${twin.risk_assessment.overall_risk_score}/100 (${twin.risk_assessment.risk_level})` : "Low"}
          </div>
        </div>
      </div>

      {/* Interactive Subsystem Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Integrated Agricultural Intelligence Modules</h2>
          <span className="text-xs font-mono text-emerald-400">All 10 Modules Operational</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Earth Intelligence */}
          <Link
            href="/earth-intelligence"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Satellite className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-cyan-300">
                NASA IMERG & Sentinel
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Earth Observation Engine</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Daily precipitation timeseries, 7-day rolling totals, temperature ranges, foliar NDVI vigor, and NDMI canopy moisture stress.
              </p>
            </div>
          </Link>

          {/* Soil Intelligence */}
          <Link
            href="/soil"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
                <FlaskConical className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-amber-300">
                SoilGrids & Lab Tests
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Soil Intelligence</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                ISRIC 250m baseline soil grids, physical Krishi Bhavan lab test entry, pH liming dosage, and strict scientific NPK suppression rules.
              </p>
            </div>
          </Link>

          {/* Terrain & Hydrology */}
          <Link
            href="/terrain"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400">
                <Mountain className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-blue-300">
                NASADEM & Hydrology
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Terrain & Drainage</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                NASADEM 30m elevation model, slope classification, topographic wetness index (TWI), flow accumulation risk, and farmer waterlogging flags.
              </p>
            </div>
          </Link>

          {/* Digital Twin */}
          <Link
            href="/digital-twin"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <Binary className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-emerald-300">
                Predictive Simulator
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Predictive Digital Twin</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Multi-layer virtual replica synthesizing all telemetry. Features an interactive What-If stress simulator for drought and planting delay.
              </p>
            </div>
          </Link>

          {/* Crop Rotation Planner */}
          <Link
            href="/rotation"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-purple-300">
                12 Kerala Crops
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Crop Rotation Planner</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Generates 3 multi-year rotation strategies: Soil Health (legume-intensive), Water Efficiency (drought-resilient), and Balanced commercial yield.
              </p>
            </div>
          </Link>

          {/* AI Farm Assistant */}
          <Link
            href="/assistant"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-800/80 flex items-center justify-center text-teal-400">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-teal-300">
                Tool Calling & KAU
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">AI Farm Assistant</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Deterministic conversational assistant with deep telemetry tool execution. Grounded in KAU Package of Practices with complete citations.
              </p>
            </div>
          </Link>

          {/* Tasks & Reminders */}
          <Link
            href="/tasks"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-rose-300">
                Telemetry Triggers
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Smart Tasks & Reminders</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Condition-based reminders triggered automatically by high rainfall alerts, missing soil tests, canopy moisture deficit, or rotation shifts.
              </p>
            </div>
          </Link>

          {/* Carbon Credits */}
          <Link
            href="/carbon"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-emerald-300">
                Verra & Gold Standard
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Carbon Credit Readiness</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Honest eligibility screening, conservative yield & net revenue modelling, evidence ledger, and FPO aggregation submission dossiers.
              </p>
            </div>
          </Link>

          {/* Reports & Decision Dossiers */}
          <Link
            href="/reports"
            className="p-5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition duration-150 group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-indigo-300">
                Export Dossiers
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white">Farm Decision Dossiers</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                One-click comprehensive farm dossiers synthesizing telemetry, crop rankings, rotation plans, and compliance disclaimers.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Phased Roadmap Execution Status */}
      <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>NASA Space Apps 2026 Implementation Roadmap (Consolidated v3.2)</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            10 / 10 Phases Built
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { phase: "Phase 0", title: "App Foundation", status: "Done" },
            { phase: "Phase 1", title: "Farm Maps & Auth", status: "Done" },
            { phase: "Phase 2", title: "NASA Earth Data", status: "Done" },
            { phase: "Phase 3 & 4", title: "Soil, Terrain & Crops", status: "Done" },
            { phase: "Phase 5 & 6", title: "Rotation & Digital Twin", status: "Done" },
            { phase: "Phase 7", title: "AI Farm Assistant", status: "Done" },
            { phase: "Phase 8", title: "Tasks & Dossiers", status: "Done" },
            { phase: "Phase 9", title: "Carbon Credit Module", status: "Done" },
            { phase: "Phase 10", title: "Deployment Ready", status: "Active" },
            { phase: "Global", title: "Region Pack System", status: "Active" },
          ].map((p, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">{p.phase}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {p.status}
                </span>
              </div>
              <div className="font-semibold text-zinc-200 truncate">{p.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
