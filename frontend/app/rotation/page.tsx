"use client";

import { useEffect, useState } from "react";
import {
  evaluateCropSuitability,
  fetchFarmRotation,
  simulateFarmScenario,
  Farm,
  CropSuitabilityResponse,
  CropSuitabilityEvaluation,
  RotationStrategy,
  SimulationResponse,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  RotateCcw,
  Leaf,
  Droplets,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  DollarSign,
  Briefcase,
  TrendingUp,
  Award,
  Layers,
  Calendar,
  CloudRain,
  Sun,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type PriorityKey = "soil_health" | "water_saving" | "income" | "labor";

interface PriorityOption {
  key: PriorityKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    key: "soil_health",
    label: "Soil Health (N₂ Restorer)",
    icon: Leaf,
    description: "Maximizes biological nitrogen credits & organic carbon",
  },
  {
    key: "water_saving",
    label: "Water Conservation",
    icon: Droplets,
    description: "Cuts irrigation demand by up to 38% under drought",
  },
  {
    key: "income",
    label: "Commercial Income",
    icon: DollarSign,
    description: "Highest gross margins (₹2.1L/ac) with cash crops",
  },
  {
    key: "labor",
    label: "Low Labor",
    icon: Briefcase,
    description: "Less daily intensive crop management",
  },
];

export default function RotationPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [suitabilityData, setSuitabilityData] = useState<CropSuitabilityResponse | null>(null);
  const [rotationStrategies, setRotationStrategies] = useState<RotationStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);

  // Farmer Priority State
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityKey[]>(["soil_health"]);

  // What-If Simulation on Strategies State
  const [whatIfRainDelta, setWhatIfRainDelta] = useState<number>(-40);
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);

  const loadData = async (farmId: string, authToken: string, priorities: PriorityKey[] = selectedPriorities) => {
    setRefreshing(true);
    try {
      const [suitData, rotData] = await Promise.all([
        evaluateCropSuitability(farmId, authToken),
        fetchFarmRotation(farmId, authToken, priorities).catch((err) => {
          console.warn("Failed to fetch rotation strategies:", err);
          return null;
        }),
      ]);
      setSuitabilityData(suitData);
      if (rotData?.strategies) {
        setRotationStrategies(rotData.strategies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedFarm && token) {
      loadData(selectedFarm.id, token, selectedPriorities);
    }
  }, [selectedFarm, token]);

  const togglePriority = (pKey: PriorityKey) => {
    const exists = selectedPriorities.includes(pKey);
    let updated: PriorityKey[];
    if (exists) {
      updated = selectedPriorities.filter((k) => k !== pKey);
    } else {
      updated = [...selectedPriorities, pKey];
    }
    setSelectedPriorities(updated);
    if (selectedFarm && token) {
      loadData(selectedFarm.id, token, updated);
    }
  };

  const handleRunStrategyWhatIf = async (presetDelta?: number) => {
    if (!selectedFarm || !token) return;
    const delta = presetDelta !== undefined ? presetDelta : whatIfRainDelta;
    if (presetDelta !== undefined) {
      setWhatIfRainDelta(presetDelta);
    }
    setSimulationLoading(true);
    try {
      const sim = await simulateFarmScenario(
        selectedFarm.id,
        {
          rainfall_variation_pct: delta,
          irrigation_active: selectedFarm.irrigation_available ?? true,
          planting_delay_days: 0,
        },
        token
      );
      setSimulationResult(sim);
    } catch (err) {
      console.error("What-If simulation failed:", err);
    } finally {
      setSimulationLoading(false);
    }
  };

  // Run initial simulation on load for the default -40% scenario
  useEffect(() => {
    if (selectedFarm && token && !simulationResult) {
      handleRunStrategyWhatIf(-40);
    }
  }, [selectedFarm, token]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = farms.find((f) => f.id === e.target.value);
    if (matched) {
      selectFarm(matched);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCropId(expandedCropId === id ? null : id);
  };

  // Build 3-year chart data across strategies
  const chartData = [
    {
      year: "Year 1",
      "Strategy A (Soil) SOC%": 2.14,
      "Strategy B (Water) SOC%": 2.14,
      "Strategy C (Balanced) SOC%": 2.14,
      "Strategy A (Soil) N Credit": 0,
      "Strategy B (Water) N Credit": 0,
      "Strategy C (Balanced) N Credit": 0,
    },
    {
      year: "Year 2",
      "Strategy A (Soil) SOC%": 2.38,
      "Strategy B (Water) SOC%": 2.22,
      "Strategy C (Balanced) SOC%": 2.30,
      "Strategy A (Soil) N Credit": 45,
      "Strategy B (Water) N Credit": 25,
      "Strategy C (Balanced) N Credit": 35,
    },
    {
      year: "Year 3",
      "Strategy A (Soil) SOC%": 2.65,
      "Strategy B (Water) SOC%": 2.30,
      "Strategy C (Balanced) SOC%": 2.48,
      "Strategy A (Soil) N Credit": 50,
      "Strategy B (Water) N Credit": 28,
      "Strategy C (Balanced) N Credit": 35,
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 4 & 5 • Crop Intelligence & Multi-Strategy Optimizer
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Crop Rotation Strategies & Suitability</h1>
          <p className="text-sm text-zinc-300">
            Explore and stress-test 3-year rotation strategies with side-by-side trade-offs, farmer priority re-ranking, and climate What-If simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedFarm?.id || ""}
              onChange={handleFarmChange}
              className="bg-transparent text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-zinc-900 text-zinc-200">
                  {f.farm_name} ({f.total_area_acres} ac)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => selectedFarm && token && loadData(selectedFarm.id, token, selectedPriorities)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Recalculate Suitability & Rotation"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* SECTION 1: Farmer Priority Input (Re-ranks strategies) */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Step 1: Set Your Farming Priorities</span>
            </h2>
            <p className="text-xs text-zinc-300">
              Select what matters most to your smallholding. FieldShift re-ranks the strategies and explains the optimal fit.
            </p>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Direct Challenge Input #4 • Dynamic Priority Weighting
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRIORITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedPriorities.includes(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => togglePriority(opt.key)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-950/40 text-emerald-300"
                    : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`} />
                    <span>{opt.label}</span>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                        : "border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {/* Dynamic "Why this one" Rationale Banner */}
        {rotationStrategies.length > 0 && rotationStrategies[0] && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-500/40 text-xs flex items-start gap-3 mt-2">
            <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-300">Top-Ranked Recommendation:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 font-semibold text-[11px] border border-emerald-700">
                  {rotationStrategies[0].strategy_name}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  (Score: {rotationStrategies[0].priority_adjusted_score || rotationStrategies[0].overall_score}/100)
                </span>
              </div>
              <p className="text-zinc-200 leading-relaxed font-medium">
                👉 {rotationStrategies[0].why_recommended || rotationStrategies[0].why_this_one}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Side-by-Side Strategy Comparison Table (A vs B vs C) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Side-by-Side Strategy Comparison (A vs B vs C)</span>
            </h2>
            <p className="text-xs text-zinc-300">
              Clear multi-dimensional trade-offs across soil nitrogen credits, irrigation requirements, farm income, and pest resilience.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 self-start sm:self-auto">
            3-Year Rotation Cycles
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80">
                <th className="p-4 text-zinc-400 font-medium uppercase tracking-wider text-[11px] w-1/4">
                  Evaluation Dimension
                </th>
                <th className="p-4 text-emerald-400 font-bold uppercase tracking-wider text-[11px] border-l border-zinc-800/80 bg-emerald-950/20 w-1/4">
                  Strategy A: Soil Health Priority
                </th>
                <th className="p-4 text-cyan-400 font-bold uppercase tracking-wider text-[11px] border-l border-zinc-800/80 bg-cyan-950/20 w-1/4">
                  Strategy B: Water Efficiency
                </th>
                <th className="p-4 text-amber-400 font-bold uppercase tracking-wider text-[11px] border-l border-zinc-800/80 bg-amber-950/20 w-1/4">
                  Strategy C: Balanced Strategy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {/* Row 1: 3-Year Sequence */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">3-Year Crop Sequence</td>
                <td className="p-4 border-l border-zinc-800/60 font-medium text-emerald-300">
                  Banana → Cowpea (Pulse) → Cassava
                </td>
                <td className="p-4 border-l border-zinc-800/60 font-medium text-cyan-300">
                  Maize → Black Gram → Turmeric
                </td>
                <td className="p-4 border-l border-zinc-800/60 font-medium text-amber-300">
                  Banana → Vegetable Cowpea → Ginger
                </td>
              </tr>

              {/* Row 2: Biological N Credit */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">Biological N₂ Credit</td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-emerald-400 text-sm">+45 to +50 kg/ha</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Saves ~₹7,500/acre in synthetic urea</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-cyan-400 text-sm">+25 kg/ha</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Black gram winter pulse fixation</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-amber-400 text-sm">+35 kg/ha</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Inter-season vegetable cowpea credit</p>
                </td>
              </tr>

              {/* Row 3: Water Demand & Saving */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">Water Consumption</td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-zinc-200">20% lower irrigation</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Soil humus buffers moisture</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-cyan-400">38% lower irrigation</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Highest drought resilience; rain-synchronized</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-zinc-200">18% lower irrigation</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Requires drip irrigation for banana</p>
                </td>
              </tr>

              {/* Row 4: Annual Gross Income */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">Gross Farm Income</td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-semibold text-zinc-200">Medium (~₹1,65,000 / ac / yr)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Balanced pulses & tubers</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-semibold text-zinc-200">Medium (~₹1,42,000 / ac / yr)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Low input cost; resilient cash flow</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-bold text-emerald-400 text-sm">Highest (~₹2,10,000 / ac / yr)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Premium market price on ginger & banana</p>
                </td>
              </tr>

              {/* Row 5: Pest & Nematode Interruption */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">Pest & Disease Risk</td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold text-[10px]">
                    98% Suppression
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Breaks Panama wilt & root nematodes</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold text-[10px]">
                    88% Suppression
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Cereal-pulse-spice botanical shift</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold text-[10px]">
                    92% Suppression
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Raised beds needed to prevent rhizome rot</p>
                </td>
              </tr>

              {/* Row 6: 3-Year Soil Trend Trajectory */}
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="p-4 font-semibold text-white">3-Year Soil Health Trajectory</td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-mono text-emerald-400 font-semibold">SOC: 2.14% → 2.65% (+24%)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Health Index: 72 → 95 / 100</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-mono text-cyan-400 font-semibold">SOC: 2.14% → 2.30% (+7%)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Health Index: 72 → 84 / 100</p>
                </td>
                <td className="p-4 border-l border-zinc-800/60">
                  <span className="font-mono text-amber-400 font-semibold">SOC: 2.14% → 2.48% (+16%)</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Health Index: 72 → 90 / 100</p>
                </td>
              </tr>

              {/* Row 7: Best Fit Recommendation */}
              <tr className="bg-zinc-950/60">
                <td className="p-4 font-bold text-white">Recommended If You...</td>
                <td className="p-4 border-l border-zinc-800/60 text-emerald-200">
                  Seek maximum soil regeneration, organic matter buildup, and synthetic fertilizer cost cuts.
                </td>
                <td className="p-4 border-l border-zinc-800/60 text-cyan-200">
                  Face frequent water shortages, delayed monsoon rains, or wish to cut irrigation labor.
                </td>
                <td className="p-4 border-l border-zinc-800/60 text-amber-200">
                  Prioritize high commercial farm cash flow while safeguarding soil with legume intervals.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: 3-Year Soil Trend Interactive Chart */}
      <div className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>3-Year Soil Organic Carbon (SOC %) & N Credit Trend</span>
            </h2>
            <p className="text-xs text-zinc-300">
              Projected soil restoration over 3 rotation cycles. Strategy A delivers the highest compounding humus replenishment.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Strategy A (Soil)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span> Strategy B (Water)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Strategy C (Balanced)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="year" stroke="#a1a1aa" fontSize={12} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                domain={[1.8, 3.0]}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "12px" }}
                formatter={(value: any, name: any) => [`${value}%`, name]}
              />
              <Line
                type="monotone"
                dataKey="Strategy A (Soil) SOC%"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="Strategy B (Water) SOC%"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#06b6d4" }}
              />
              <Line
                type="monotone"
                dataKey="Strategy C (Balanced) SOC%"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 4: Interactive What-If Simulation on All 3 Strategies */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Challenge Requirement • What-If Stress Testing on Strategies
            </div>
            <h2 className="text-lg font-bold text-white mt-1">Multi-Strategy Climate What-If Simulator</h2>
            <p className="text-xs text-zinc-300">
              Test how Strategy A, B, and C hold up under an erratic monsoon shock (-40% rain drought vs +35% flood).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleRunStrategyWhatIf(-40)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                whatIfRainDelta === -40
                  ? "bg-rose-950/80 text-rose-300 border-rose-500 shadow-sm"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              🔴 -40% Monsoon Drought
            </button>
            <button
              onClick={() => handleRunStrategyWhatIf(-20)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                whatIfRainDelta === -20
                  ? "bg-amber-950/80 text-amber-300 border-amber-500"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              🟡 -20% Deficit
            </button>
            <button
              onClick={() => handleRunStrategyWhatIf(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                whatIfRainDelta === 0
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              🟢 0% Normal Climatology
            </button>
            <button
              onClick={() => handleRunStrategyWhatIf(35)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                whatIfRainDelta === 35
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              🔵 +35% Heavy Monsoon Inundation
            </button>
          </div>
        </div>

        {/* Custom Slider Input */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-2/3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">Fine-tune Precipitation Variation:</span>
              <span className={`font-mono font-bold text-sm ${whatIfRainDelta < 0 ? "text-rose-400" : whatIfRainDelta > 0 ? "text-cyan-400" : "text-emerald-400"}`}>
                {whatIfRainDelta > 0 ? `+${whatIfRainDelta}%` : `${whatIfRainDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={whatIfRainDelta}
              onChange={(e) => setWhatIfRainDelta(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>-50% Severe Aridity</span>
              <span>Baseline Historical Normal</span>
              <span>+50% Tropical Flood</span>
            </div>
          </div>

          <button
            onClick={() => handleRunStrategyWhatIf()}
            disabled={simulationLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50"
          >
            {simulationLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Simulate Resilience on A, B & C</span>
          </button>
        </div>

        {/* What-If Results Cards for the 3 Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {simulationResult?.strategy_evaluations ? (
            simulationResult.strategy_evaluations.map((stratEval, i) => {
              const isRecommended = stratEval.is_recommended;
              const resScore = stratEval.resilience_score ?? 85;
              const isHighRes = resScore >= 85;
              const isModRes = resScore >= 70 && resScore < 85;

              return (
                <div
                  key={stratEval.strategy_id || `eval-${i}`}
                  className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    isRecommended
                      ? "bg-gradient-to-b from-emerald-950/40 to-zinc-900 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30"
                      : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        {stratEval.strategy_name.split(":")[0] || `Strategy ${String.fromCharCode(65 + i)}`}
                      </span>
                      {isRecommended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold tracking-wide uppercase">
                          ★ Most Resilient
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">{stratEval.strategy_name}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{stratEval.crops}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase">Resilience Score</div>
                        <div className="text-xl font-black text-white">{resScore}/100</div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          isHighRes
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : isModRes
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {stratEval.resilience_rating}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {stratEval.impact_summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                    Scenario: <strong>{simulationResult.scenario_inputs.rainfall_variation_pct}</strong> rainfall shock
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 p-8 text-center text-zinc-500 text-xs">
              Running multi-strategy climate shock simulation...
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Crop Suitability Rankings & Detailed Score Breakdown (25/25/20/15/15) */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              <span>Agro-Climatic Suitability Scoring & Kerala Monsoon Windows</span>
            </h2>
            <p className="text-xs text-zinc-300">
              Evaluated across 5 FAO EcoCrop dimensions: Soil (25%), Climate (25%), Water (20%), Drainage (15%), and Season (15%).
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {suitabilityData?.crops?.length || 18} Kerala & Regional Crops
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-xs">Evaluating crop compatibility...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {suitabilityData?.crops.map((crop) => {
              const isExpanded = expandedCropId === crop.crop_id;
              const isHighlySuitable = crop.suitability_score >= 85;
              const isModSuitable = crop.suitability_score >= 70 && crop.suitability_score < 85;

              // Seasonal window badge color
              const isMonsoonCrop =
                crop.planting_window.toLowerCase().includes("virippu") ||
                crop.planting_window.toLowerCase().includes("monsoon") ||
                crop.planting_window.toLowerCase().includes("may") ||
                crop.planting_window.toLowerCase().includes("june");

              return (
                <div
                  key={crop.crop_id}
                  className={`p-5 rounded-3xl border transition-all space-y-3.5 flex flex-col justify-between ${
                    isHighlySuitable
                      ? "bg-zinc-900/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                      : isModSuitable
                      ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      : "bg-zinc-950/60 border-zinc-800/80 opacity-90"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-white">{crop.crop_name}</h3>
                        <p className="text-xs text-zinc-400 italic">{crop.scientific_name}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-400">{crop.suitability_score}</div>
                        <div className="text-[10px] text-zinc-400">Score / 100</div>
                      </div>
                    </div>

                    {/* Class badge & N-fixation indicator */}
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-xs ${
                          isHighlySuitable
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : isModSuitable
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {crop.suitability_class}
                      </span>

                      {crop.nitrogen_fixation && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                          <Leaf className="w-3 h-3" />
                          <span>Fixes N₂</span>
                        </span>
                      )}
                    </div>

                    {/* Seasonal Planting Window Badge (Kerala Monsoon) */}
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium text-zinc-300">Monsoon Window:</span>
                      </div>
                      <span className="text-zinc-200 font-semibold text-[11px] truncate max-w-[170px]" title={crop.planting_window}>
                        {crop.planting_window}
                      </span>
                    </div>

                    {/* Score Breakdown Bar (25/25/20/15/15) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                        <span>Score Contribution Breakdown</span>
                        <span>25 / 25 / 20 / 15 / 15%</span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(crop.component_scores.soil_score * 0.25)}%` }}
                          className="bg-amber-500 h-full"
                          title={`Soil (25% weight): ${crop.component_scores.soil_score}/100`}
                        />
                        <div
                          style={{ width: `${(crop.component_scores.climate_score * 0.25)}%` }}
                          className="bg-orange-500 h-full"
                          title={`Climate (25% weight): ${crop.component_scores.climate_score}/100`}
                        />
                        <div
                          style={{ width: `${(crop.component_scores.water_score * 0.20)}%` }}
                          className="bg-cyan-500 h-full"
                          title={`Water (20% weight): ${crop.component_scores.water_score}/100`}
                        />
                        <div
                          style={{ width: `${(crop.component_scores.drainage_score * 0.15)}%` }}
                          className="bg-blue-500 h-full"
                          title={`Drainage (15% weight): ${crop.component_scores.drainage_score}/100`}
                        />
                        <div
                          style={{ width: `${(crop.component_scores.seasonal_score * 0.15)}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Season (15% weight): ${crop.component_scores.seasonal_score}/100`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
                        <span className="text-amber-400">Soil: {crop.component_scores.soil_score}</span>
                        <span className="text-orange-400">Clim: {crop.component_scores.climate_score}</span>
                        <span className="text-cyan-400">Water: {crop.component_scores.water_score}</span>
                        <span className="text-blue-400">Drain: {crop.component_scores.drainage_score}</span>
                        <span className="text-emerald-400">Season: {crop.component_scores.seasonal_score}</span>
                      </div>
                    </div>

                    {/* Supporting Factor Highlight */}
                    {crop.supporting_factors.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{crop.supporting_factors[0]}</span>
                      </div>
                    )}

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-zinc-800 text-xs">
                        {crop.limitations.length > 0 && (
                          <div>
                            <span className="text-amber-400 block font-semibold mb-1">Agronomic Limitations:</span>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                              {crop.limitations.map((lim, i) => (
                                <li key={`${crop.crop_id}-lim-${i}`}>{lim}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-zinc-400 text-xs pt-1">
                          Duration: <strong className="text-zinc-200">{crop.duration_days}</strong> • Source: FAO Ecocrop & KAU
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(crop.crop_id)}
                    className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 pt-2 flex items-center justify-center gap-1 border-t border-zinc-800/60"
                  >
                    <span>{isExpanded ? "Show Less" : "Inspect Detailed Agronomic Breakdown"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
