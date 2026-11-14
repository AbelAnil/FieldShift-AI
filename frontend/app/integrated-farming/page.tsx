"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Recycle,
  Droplets,
  Sun,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Plus,
  X,
  Fish,
  Trees,
  Sprout,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  IntegratedFarmingOverview,
  CattleTHIStatus,
  RainwaterPondTelemetry,
  PollinationImpactTelemetry,
  NutrientBioResourceBalance,
  LivestockItem,
  FarmPondItem,
  ApicultureItem,
  fetchIntegratedFarmingOverview,
  addLivestockProfile,
  addFarmPondProfile,
  addApicultureProfile,
} from "@/lib/api";

export default function IntegratedFarmingPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();

  const [overview, setOverview] = useState<IntegratedFarmingOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for Sub-Systems
  const [activeTab, setActiveTab] = useState<"overview" | "livestock" | "aquaculture" | "apiculture" | "circularity">("overview");

  // Selected circular loop node for interactive inspection
  const [selectedNode, setSelectedNode] = useState<string>("livestock");

  // Interactive Farm Pond Sizer state (slider overrides for what-if sizing)
  const [interactivePondArea, setInteractivePondArea] = useState<number>(150);
  const [interactivePondDepth, setInteractivePondDepth] = useState<number>(1.8);

  // Interactive Bee Hive Sizer state
  const [interactiveHiveCount, setInteractiveHiveCount] = useState<number>(4);
  const [interactiveBeeSpecies, setInteractiveBeeSpecies] = useState<string>("Apis cerana indica (Indian Bee)");

  // Add Asset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAssetType, setModalAssetType] = useState<"livestock" | "pond" | "bees">("livestock");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for adding assets
  const [animalType, setAnimalType] = useState("dairy_cattle");
  const [breedName, setBreedName] = useState("Vechoor Dwarf");
  const [unitCount, setUnitCount] = useState(2);
  const [dailyYield, setDailyYield] = useState("12 litres milk/day");
  const [biogasLinked, setBiogasLinked] = useState(true);
  const [notes, setNotes] = useState("");

  const [pondName, setPondName] = useState("Terrace Runoff Catchment Pond");
  const [pondArea, setPondArea] = useState(180);
  const [pondDepth, setPondDepth] = useState(1.8);
  const [pondSpecies, setPondSpecies] = useState("Composite Carp (Catla, Rohu, Mrigal)");
  const [pondSource, setPondSource] = useState("Monsoon Surface Runoff");

  const [beeSpecies, setBeeSpecies] = useState("Apis cerana indica");
  const [hiveCount, setHiveCount] = useState(4);
  const [targetCrops, setTargetCrops] = useState("Nutmeg, Coconut, Vegetables");
  const [medicinalMarket, setMedicinalMarket] = useState(false);

  useEffect(() => {
    if (selectedFarm && token) {
      loadIFS(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  const loadIFS = async (farmId: string, authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIntegratedFarmingOverview(farmId, authToken);
      setOverview(data);
      if (data.ponds.length > 0) {
        setInteractivePondArea(data.ponds[0].surface_area_sqm);
        setInteractivePondDepth(data.ponds[0].mean_depth_m);
      }
      if (data.apiculture.length > 0) {
        setInteractiveHiveCount(data.apiculture[0].hive_count);
        setInteractiveBeeSpecies(data.apiculture[0].bee_species);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load Integrated Farming System telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (selectedFarm && token) {
      setRefreshing(true);
      loadIFS(selectedFarm.id, token);
    }
  };

  // Dynamic Pond calculation based on interactive sliders
  const dynamicPondMetrics = useMemo(() => {
    const capacityM3 = interactivePondArea * interactivePondDepth;
    const capacityLitres = capacityM3 * 1000;
    const rain30d = overview?.rainwater_telemetry.cumulative_30d_rain_mm || 515.0;
    const farmAreaAcres = overview?.rainwater_telemetry.farm_area_acres || 2.0;
    const farmAreaM2 = farmAreaAcres * 4046.86;
    const harvestableRunoffM3 = farmAreaM2 * (rain30d / 1000.0) * 0.35;
    const harvestableRunoffLitres = harvestableRunoffM3 * 1000;
    const fillPct = Math.min(100, (harvestableRunoffM3 / capacityM3) * 100);
    const fishBiomassKg = capacityM3 * 1.6;
    const irrigationDays = Math.max(1, Math.floor((capacityM3 * 0.7) / (farmAreaAcres * 4.0)));

    return {
      capacityM3,
      capacityLitres,
      harvestableRunoffM3,
      harvestableRunoffLitres,
      fillPct,
      fishBiomassKg,
      irrigationDays,
    };
  }, [interactivePondArea, interactivePondDepth, overview]);

  // Dynamic Pollination calculation based on hive slider
  const dynamicBeeMetrics = useMemo(() => {
    const isStingless = interactiveBeeSpecies.toLowerCase().includes("stingless") || interactiveBeeSpecies.toLowerCase().includes("tetragonula");
    const honeyYieldPerHive = isStingless ? 1.2 : 10.0;
    const honeyPriceKg = isStingless ? 2000.0 : 550.0;
    const totalHoneyKg = interactiveHiveCount * honeyYieldPerHive;
    const honeyRevenue = totalHoneyKg * honeyPriceKg;
    const basePollinationBoost = 26.0; // average boost for multi-tier Kerala canopy
    const pollinationVal = interactiveHiveCount * 5500.0;

    return {
      isStingless,
      totalHoneyKg,
      honeyRevenue,
      basePollinationBoost,
      pollinationVal,
    };
  }, [interactiveHiveCount, interactiveBeeSpecies]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm || !token) return;
    setIsSubmitting(true);
    try {
      if (modalAssetType === "livestock") {
        await addLivestockProfile(
          selectedFarm.id,
          {
            animal_type: animalType,
            breed_name: breedName,
            unit_count: Number(unitCount),
            daily_yield_metric: dailyYield,
            biogas_linked: biogasLinked,
            notes,
          },
          token
        );
      } else if (modalAssetType === "pond") {
        await addFarmPondProfile(
          selectedFarm.id,
          {
            pond_name: pondName,
            surface_area_sqm: Number(pondArea),
            mean_depth_m: Number(pondDepth),
            primary_fish_species: pondSpecies,
            water_source: pondSource,
          },
          token
        );
      } else {
        await addApicultureProfile(
          selectedFarm.id,
          {
            bee_species: beeSpecies,
            hive_count: Number(hiveCount),
            target_pollination_crops: targetCrops.split(",").map((s) => s.trim()),
            medicinal_honey_market: medicinalMarket,
          },
          token
        );
      }
      setIsModalOpen(false);
      await loadIFS(selectedFarm.id, token);
    } catch (err: any) {
      alert(err.message || "Failed to register asset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 sm:pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <Recycle className="w-3 h-3 text-emerald-400 shrink-0" />
              Module 11 • Circular Bio-Resource Architecture
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
              NASA POWER & GPM Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3">
            Integrated Farming System (IFS)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Synergistic multi-enterprise modeling linking dairy cattle, farm pond aquaculture, rice-duck mutualism,
            and apiculture cross-pollination to eliminate external inputs and maximize whole-farm resilience.
          </p>
        </div>

        {/* Action Controls & Farm Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          {farms.length > 0 && (
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => {
                const found = farms.find((f) => f.id === e.target.value);
                if (found) selectFarm(found);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-medium flex-1 sm:flex-initial"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name} ({f.total_area_acres?.toFixed(1) || "2.0"} ac)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition disabled:opacity-50 shrink-0"
            title="Refresh NASA telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-950 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add IFS Asset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800/80 p-4 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading && !overview ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-zinc-400">Synthesizing NASA microclimate & circular bio-resource matrices...</p>
        </div>
      ) : overview ? (
        <>
          {/* Top 4 Circular KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Cattle THI Heat Stress */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Livestock Comfort</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    overview.thi_status.thi_value < 72
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : overview.thi_status.thi_value < 78
                      ? "bg-amber-950 text-amber-400 border-amber-800"
                      : "bg-rose-950 text-rose-400 border-rose-800"
                  }`}
                >
                  {overview.thi_status.stress_level}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
                  {overview.thi_status.thi_value}
                  <span className="text-xs font-medium text-zinc-400">THI Score</span>
                </div>
                <div className="text-xs text-zinc-400">
                  NASA POWER: {overview.thi_status.temperature_c}°C • {overview.thi_status.relative_humidity_pct}% RH
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Milk Yield Risk:</span>
                <span className={overview.thi_status.milk_yield_risk_pct > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
                  {overview.thi_status.milk_yield_risk_pct > 0 ? `-${overview.thi_status.milk_yield_risk_pct}%` : "0% (Optimal)"}
                </span>
              </div>
            </div>

            {/* KPI 2: Farm Pond Harvestable Water */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Rainwater Catchment</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {overview.rainwater_telemetry.pond_fill_percentage}% Capacity
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
                  {(overview.rainwater_telemetry.harvestable_runoff_litres / 100000).toFixed(1)}
                  <span className="text-xs font-medium text-zinc-400">Lakh Litres Rain</span>
                </div>
                <div className="text-xs text-zinc-400">
                  NASA GPM 30d: {overview.rainwater_telemetry.cumulative_30d_rain_mm} mm precipitation
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Drought Buffer:</span>
                <span className="text-cyan-400 font-semibold">
                  {overview.rainwater_telemetry.emergency_dry_irrigation_days} Dry Irrigation Days
                </span>
              </div>
            </div>

            {/* KPI 3: Pollination Multiplier */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Apiculture Multiplier</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                  +{overview.pollination_telemetry.projected_yield_increase_pct}% Yield
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
                  ₹{(overview.pollination_telemetry.estimated_additional_harvest_value_inr / 1000).toFixed(0)}k
                  <span className="text-xs font-medium text-zinc-400">Crop Boost Value</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Active Crop: {overview.pollination_telemetry.active_crop}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Honey Revenue:</span>
                <span className="text-amber-400 font-semibold">
                  ₹{overview.pollination_telemetry.annual_honey_gross_revenue_inr.toLocaleString()}/yr
                </span>
              </div>
            </div>

            {/* KPI 4: Synthetic NPK Fertilizer Offset */}
            <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Chemical NPK Displaced</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  65–80% Offset
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-emerald-400 flex items-baseline gap-1.5">
                  ₹{overview.nutrient_balance.synthetic_fertilizer_cost_saved_inr.toLocaleString()}
                  <span className="text-xs font-medium text-zinc-400">Saved / Year</span>
                </div>
                <div className="text-xs text-zinc-400">
                  FYM: {overview.nutrient_balance.total_fym_produced_tons_year} tons • Bio-Slurry: {overview.nutrient_balance.biogas_slurry_litres_year.toLocaleString()} L
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">NPK Displaced:</span>
                <span className="text-emerald-300 font-semibold">
                  {(overview.nutrient_balance.nitrogen_n_displaced_kg + overview.nutrient_balance.phosphorus_p_displaced_kg + overview.nutrient_balance.potassium_k_displaced_kg).toFixed(0)} kg total
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs sm:text-sm whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition ${
                activeTab === "overview"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Circular Flow Visualizer
            </button>
            <button
              onClick={() => setActiveTab("livestock")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition ${
                activeTab === "livestock"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Livestock & Heat Gauge ({overview.livestock.length})
            </button>
            <button
              onClick={() => setActiveTab("aquaculture")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition ${
                activeTab === "aquaculture"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Farm Pond Sizer ({overview.ponds.length})
            </button>
            <button
              onClick={() => setActiveTab("apiculture")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition ${
                activeTab === "apiculture"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Apiculture Synergy ({overview.apiculture.length})
            </button>
            <button
              onClick={() => setActiveTab("circularity")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition ${
                activeTab === "circularity"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Nutrient Matrix & Balance
            </button>
          </div>

          {/* TAB 1: CIRCULAR FLOW VISUALIZER */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Interactive Bio-Resource Architecture Diagram */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Recycle className="w-5 h-5 text-emerald-400" />
                      Whole-Farm Circular Bio-Resource Matrix
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Click any enterprise node to highlight interconnected biological transfers, waste conversions, and nutrient recycling loops.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Modelled Closed Loop
                    </span>
                  </div>
                </div>

                {/* Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Node 1: Crops & Trees */}
                  <div
                    onClick={() => setSelectedNode("crops")}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedNode === "crops"
                        ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-3">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">1. Crops & Trees</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Paddy, Banana, Spices & Perimeter Napier</div>
                    <div className="mt-3 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900">
                      Supplies roughage & nectar
                    </div>
                  </div>

                  {/* Node 2: Dairy & Cattle */}
                  <div
                    onClick={() => setSelectedNode("livestock")}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedNode === "livestock"
                        ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-950"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-900/50 text-amber-400 flex items-center justify-center mb-3">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">2. Dairy & Biogas</div>
                    <div className="text-[11px] text-zinc-400 mt-1">2 Cows + 2m³ Domestic Methane Digester</div>
                    <div className="mt-3 text-[10px] text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-900">
                      Displaces 8 tons FYM & cooking gas
                    </div>
                  </div>

                  {/* Node 3: Farm Pond Aquaculture */}
                  <div
                    onClick={() => setSelectedNode("aquaculture")}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedNode === "aquaculture"
                        ? "bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-950"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-cyan-900/50 text-cyan-400 flex items-center justify-center mb-3">
                      <Fish className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">3. Farm Pond</div>
                    <div className="text-[11px] text-zinc-400 mt-1">150m² Rain Retention + Composite Carp</div>
                    <div className="mt-3 text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-900">
                      Drought buffer + rich pond sludge
                    </div>
                  </div>

                  {/* Node 4: Poultry & Ducks */}
                  <div
                    onClick={() => setSelectedNode("poultry")}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedNode === "poultry"
                        ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-950"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-900/50 text-purple-400 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">4. Poultry & Ducks</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Deep litter + Rice-Duck Paddy mutualism</div>
                    <div className="mt-3 text-[10px] text-purple-400 bg-purple-950/60 px-2 py-1 rounded border border-purple-900">
                      BPH pest control + 3.0% N manure
                    </div>
                  </div>

                  {/* Node 5: Bee Colonies */}
                  <div
                    onClick={() => setSelectedNode("apiculture")}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedNode === "apiculture"
                        ? "bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500/20 shadow-lg shadow-yellow-950"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-yellow-900/50 text-yellow-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">5. Apiculture</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Indian Honey Bee & Stingless Cheruthen</div>
                    <div className="mt-3 text-[10px] text-yellow-400 bg-yellow-950/60 px-2 py-1 rounded border border-yellow-900">
                      +28% Fruit set + medicinal honey
                    </div>
                  </div>
                </div>

                {/* Node Detail Explainer Panel */}
                <div className="mt-6 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2">
                    <Activity className="w-4 h-4" />
                    <span>Biological Energy & Nutrient Linkages for Selected Node:</span>
                  </div>

                  {selectedNode === "crops" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Cattle:</strong>
                        Paddy straw and bund-planted Hybrid Napier (CO-5) supply 100% of the maintenance roughage and green fodder for 2 cows.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Apiculture:</strong>
                        Nutmeg, coconut spadix, and banana blossoms provide year-round pollen and nectar forage for bee colonies.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">From All Enterprises:</strong>
                        Receives digested bio-slurry, poultry litter, pond sludge, and biological pest control from ducks.
                      </div>
                    </div>
                  )}

                  {selectedNode === "livestock" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Household & Farm:</strong>
                        22 kg daily dung feeds domestic 2m³ biogas plant, producing 1.5 m³ methane daily (replaces 2 LPG cylinders/month).
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Soil & Crops:</strong>
                        Digested liquid slurry (1.8% N) is applied through drip/basin irrigation to banana, pepper, and nutmeg trees.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Farm Pond:</strong>
                        Controlled diluted bio-slurry inoculates the pond with phytoplankton and zooplankton for composite carp culture.
                      </div>
                    </div>
                  )}

                  {selectedNode === "aquaculture" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Drought Protection:</strong>
                        Stores over 270,000 litres of harvested monsoon runoff, buffering 45+ critical dry-season irrigation days.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Crop Nutrition:</strong>
                        Anaerobically matured pond bottom silt/sludge is excavated every summer, providing phosphorus-rich top-dressing.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Food Security:</strong>
                        Produces ~430 kg of fresh fish (Catla, Rohu, Karimeen) annually using on-farm residues and plankton.
                      </div>
                    </div>
                  )}

                  {selectedNode === "poultry" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Rice-Duck Mutualism:</strong>
                        Ducks foraged in the paddy field eat brown planthoppers and leaf folders, eliminating synthetic insecticides.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">To Spice Vines:</strong>
                        Deep litter manure (3.0% N, 2.5% P₂O₅) is targeted directly to black pepper vines to stimulate vigorous rooting.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Water Aeration:</strong>
                        Ducks paddling in paddy water aerate the root-zone and release trapped carbon dioxide, boosting root respiration.
                      </div>
                    </div>
                  )}

                  {selectedNode === "apiculture" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Nutmeg & Cashew Yield:</strong>
                        Indian Honey Bees boost cross-pollination fruit set by +28%, preventing premature button drop in coconut & nutmeg.
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Medicinal Cheruthen Honey:</strong>
                        Stingless bees (*Tetragonula*) produce potent medicinal honey selling at premium farmgate rates (₹1,500–₹2,500/kg).
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                        <strong className="text-zinc-100 block mb-1">Zero Land Footprint:</strong>
                        Hives mounted on shade trees or house perimeters require zero dedicated arable acreage.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Circular Loops Inventory Table */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">5 Continuous On-Farm Bio-Resource Cycles</h3>
                <div className="space-y-3">
                  {overview.nutrient_balance.circular_loops.map((loop, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <span>{loop.source}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400">{loop.destination}</span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">{loop.benefit}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-900 self-start sm:self-auto shrink-0">
                        Modelled Bio-Loop
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVESTOCK & HEAT GAUGE */}
          {activeTab === "livestock" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Livestock THI Gauge Card */}
                <div className="lg:col-span-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        Live Cattle THI Gauge
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        NASA POWER
                      </span>
                    </div>

                    {/* Circular/Linear THI Gauge Visual */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center space-y-2">
                      <div className="text-4xl font-extrabold text-white">
                        {overview.thi_status.thi_value}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Temperature-Humidity Index
                      </div>

                      {/* Visual gauge bar */}
                      <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden relative my-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            overview.thi_status.thi_value < 72
                              ? "bg-emerald-500"
                              : overview.thi_status.thi_value < 78
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, ((overview.thi_status.thi_value - 60) / 40) * 100))}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-zinc-400 px-1 font-mono">
                        <span>Comfort (&lt;72)</span>
                        <span>Mild (72-78)</span>
                        <span>Severe (&gt;88)</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/60">
                        <span className="text-zinc-400">Respiration State:</span>
                        <span className="text-zinc-200 font-medium">{overview.thi_status.respiration_impact}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/60">
                        <span className="text-zinc-400">Milk Yield Risk:</span>
                        <span className={overview.thi_status.milk_yield_risk_pct > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                          {overview.thi_status.milk_yield_risk_pct}% decline risk
                        </span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/60">
                        <span className="text-zinc-400">Microclimate Feed:</span>
                        <span className="text-zinc-300 font-mono text-[11px]">{overview.thi_status.temperature_c}°C / {overview.thi_status.relative_humidity_pct}% RH</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 text-[11px] text-zinc-400">
                    Formula: <code className="text-emerald-400">THI = 0.8×T + (RH/100)×(T-14.4) + 46.4</code>
                  </div>
                </div>

                {/* Advisory & Interventions */}
                <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Automated Veterinary & Barn Climate Advisory
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Dynamic heat mitigation rules triggered automatically by ambient NASA POWER agroclimatological thresholds:
                    </p>

                    <div className="space-y-3">
                      {overview.thi_status.recommended_interventions.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-zinc-300 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
                      <div className="text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-400" />
                        Boundary Napier Grass Fodder Sizing
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        To sustain <strong>{overview.livestock.find((l) => l.animal_type === "dairy_cattle")?.unit_count || 2} adult dairy cows</strong> with 25 kg green fodder daily (~18 metric tons/yr), FieldShift AI recommends sizing <strong>6.5 cents (0.065 acres)</strong> of <em>Hybrid Napier (CO-5)</em> along perimeter farm bunds. Napier grass utilizes soil moisture from field drainage edges with zero arable land sacrifice.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Livestock Inventory */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Registered Livestock & Poultry Inventory</h3>
                  <button
                    onClick={() => {
                      setModalAssetType("livestock");
                      setIsModalOpen(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Animal
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Breed</th>
                        <th className="pb-3">Head Count</th>
                        <th className="pb-3">Daily Yield</th>
                        <th className="pb-3">Manure (kg/day)</th>
                        <th className="pb-3">Biogas Linked</th>
                        <th className="pb-3">Agronomic Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {overview.livestock.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-800/40">
                          <td className="py-3 font-medium capitalize text-white flex items-center gap-1.5">
                            {item.animal_type === "dairy_cattle" ? (
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            )}
                            {item.animal_type.replace("_", " ")}
                          </td>
                          <td className="py-3">{item.breed_name}</td>
                          <td className="py-3 font-bold text-zinc-100">{item.unit_count}</td>
                          <td className="py-3 text-emerald-400 font-medium">{item.daily_yield_metric || "N/A"}</td>
                          <td className="py-3 font-mono">{item.daily_manure_kg_total} kg</td>
                          <td className="py-3">
                            {item.biogas_linked ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                                2m³ Digester
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Direct compost</span>
                            )}
                          </td>
                          <td className="py-3 text-zinc-400 max-w-xs truncate">{item.notes || "Organic soil replenishment"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AQUACULTURE & POND SIZER */}
          {activeTab === "aquaculture" && (
            <div className="space-y-6">
              {/* Interactive Farm Pond Sizer */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Fish className="w-5 h-5 text-cyan-400" />
                      NASA GPM Farm Pond Sizer & Aquaculture Ecosystem
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Models harvestable monsoon runoff vs retention basin capacity and fish carrying densities.
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Farm Area: <strong className="text-zinc-200">{overview.rainwater_telemetry.farm_area_acres} Acres</strong> • Rainfall (30d): <strong className="text-cyan-400">{overview.rainwater_telemetry.cumulative_30d_rain_mm} mm</strong>
                  </div>
                </div>

                {/* Interactive Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 mb-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-zinc-300 font-medium">Pond Surface Area:</span>
                      <span className="text-cyan-400 font-bold font-mono">{interactivePondArea} m² ({Math.round(interactivePondArea * 0.247)} cents)</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={600}
                      step={10}
                      value={interactivePondArea}
                      onChange={(e) => setInteractivePondArea(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>50 m² (Micro homestead)</span>
                      <span>300 m² (Standard)</span>
                      <span>600 m² (Commercial)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-zinc-300 font-medium">Pond Mean Depth:</span>
                      <span className="text-cyan-400 font-bold font-mono">{interactivePondDepth} meters</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      value={interactivePondDepth}
                      onChange={(e) => setInteractivePondDepth(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>1.0 m (Shallow nursery)</span>
                      <span>1.8 m (Optimal composite carp)</span>
                      <span>3.0 m (Deep perennial)</span>
                    </div>
                  </div>
                </div>

                {/* Sizing Output Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">Pond Capacity</span>
                    <div className="text-2xl font-bold text-white mt-1">
                      {(dynamicPondMetrics.capacityLitres / 1000).toFixed(0)}k Litres
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">{dynamicPondMetrics.capacityM3.toFixed(1)} m³ total volume</div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">Harvestable Runoff</span>
                    <div className="text-2xl font-bold text-cyan-400 mt-1">
                      {(dynamicPondMetrics.harvestableRunoffLitres / 100000).toFixed(2)}L
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{dynamicPondMetrics.harvestableRunoffM3.toFixed(0)} m³ (C_runoff = 0.35)</div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">Fish Carrying Capacity</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {dynamicPondMetrics.fishBiomassKg.toFixed(0)} kg
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">~{Math.round(interactivePondArea * 2.5)} fingerlings stocked</div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">Drought Irrigation Run</span>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      {dynamicPondMetrics.irrigationDays} Days
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Emergency crop root-zone buffer</div>
                  </div>
                </div>

                {/* Stocking Species Matrix */}
                <div className="border-t border-zinc-800 pt-6">
                  <h3 className="text-sm font-bold text-white mb-3">Composite Carp Culture & High-Value Regional Fish Ratios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {overview.rainwater_telemetry.species_mix.map((sp, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-zinc-200">{sp.species}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {sp.stocking_ratio_pct}%
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{sp.feed}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs text-zinc-300 leading-relaxed">
                  <strong>Pokkali Rice-Fish Synergy Note:</strong> In low-lying and coastal saline zones (Ernakulam, Alappuzha, Thrissur), the pond coordinates with Pokkali paddy rotation. Paddy is cultivated in fresh monsoon water (June–Oct), followed by organic Tiger Prawn and Karimeen (Pearlspot) foraging on decaying paddy stubble during saline dry months (Nov–April) with zero commercial pellet feed.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APICULTURE & POLLINATION */}
          {activeTab === "apiculture" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hive Interactive Sizer */}
                <div className="lg:col-span-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Bee Hive Deployment Calculator
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Bee Species Model:</label>
                        <select
                          value={interactiveBeeSpecies}
                          onChange={(e) => setInteractiveBeeSpecies(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Apis cerana indica (Indian Bee)">Apis cerana indica (Indian Honey Bee)</option>
                          <option value="Tetragonula iridipennis (Stingless Bee / Cheruthen)">Tetragonula iridipennis (Stingless Dammer Bee)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Hive Density:</span>
                          <span className="text-amber-400 font-bold font-mono">{interactiveHiveCount} Hives</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={12}
                          value={interactiveHiveCount}
                          onChange={(e) => setInteractiveHiveCount(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                          <span>1 hive</span>
                          <span>4 hives (Rec. per ac)</span>
                          <span>12 hives</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Annual Honey Harvest:</span>
                          <span className="text-white font-bold">{dynamicBeeMetrics.totalHoneyKg.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Projected Honey Revenue:</span>
                          <span className="text-amber-400 font-bold">₹{dynamicBeeMetrics.honeyRevenue.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Cross-Pollination Benefit:</span>
                          <span className="text-emerald-400 font-bold">₹{dynamicBeeMetrics.pollinationVal.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">Total Enterprise Yield:</span>
                          <span className="text-emerald-300 font-bold">₹{(dynamicBeeMetrics.honeyRevenue + dynamicBeeMetrics.pollinationVal).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-[11px] text-zinc-500">
                    Stingless Bee honey (Cheruthen) commands ₹1,500–₹2,500/kg in Kerala Ayurvedic and medicinal markets.
                  </div>
                </div>

                {/* Pollination Gains by Crop Card */}
                <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-2">Scientific Cross-Pollination Multipliers</h3>
                  <p className="text-xs text-zinc-400 mb-6">
                    ICAR and Kerala Agricultural University (KAU) proven yield multipliers for key plantation crops:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-zinc-200">Nutmeg & Mace</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">+28% Fruit Set</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Nutmeg has dioecious/unisexual flowers. Bee activity dramatically improves pollination of female flowers, reducing premature fruit drop.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-zinc-200">Cashew (*Anacardium*)</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">+32% Nut Set</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Pollinates hermaphrodite panicle flowers, resulting in heavier nut weight and higher shelling percentage.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-zinc-200">Coconut</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">+22% Button Retention</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Bees forage intensely on coconut spadix pollen, reducing female button shedding and increasing copra yields.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-zinc-200">Cucurbits & Vegetables</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">+35% Uniform Yield</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Essential for pumpkin, bitter gourd, and snake gourd fertilization, resulting in symmetrical, market-grade produce.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-zinc-300 leading-relaxed">
                    <strong>Nectar Dearth & Floral Calendar Advisory:</strong> During peak southwest monsoon (June–August), intense rains limit bee flight. FieldShift AI prompts the farmer to provide 1:1 sugar syrup supplementary feeding and pollen substitute patties until post-monsoon rubber and spice flowering begins.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NUTRIENT MATRIX & BALANCE */}
          {activeTab === "circularity" && (
            <div className="space-y-6">
              {/* Nutrient Displacement Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-2">Synthetic Chemical Fertilizer Displacement</h3>
                  <p className="text-xs text-zinc-400 mb-6">
                    Total bio-manure generated on-farm replacing commercial Urea, DAP (Di-Ammonium Phosphate), and MOP (Muriate of Potash):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
                      <div className="text-xs font-semibold text-zinc-400 uppercase">Nitrogen (N)</div>
                      <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                        {overview.nutrient_balance.nitrogen_n_displaced_kg} kg
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Displaces Urea</div>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
                      <div className="text-xs font-semibold text-zinc-400 uppercase">Phosphorus (P₂O₅)</div>
                      <div className="text-2xl font-extrabold text-cyan-400 mt-1">
                        {overview.nutrient_balance.phosphorus_p_displaced_kg} kg
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Displaces Rock Phosphate / DAP</div>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
                      <div className="text-xs font-semibold text-zinc-400 uppercase">Potassium (K₂O)</div>
                      <div className="text-2xl font-extrabold text-amber-400 mt-1">
                        {overview.nutrient_balance.potassium_k_displaced_kg} kg
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">Displaces MOP</div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-zinc-300">Cattle Farm Yard Manure (FYM):</span>
                      <strong className="text-white font-mono">{overview.nutrient_balance.total_fym_produced_tons_year} Metric Tons/year</strong>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-zinc-300">Poultry Deep-Litter Bedding:</span>
                      <strong className="text-white font-mono">{overview.nutrient_balance.total_poultry_manure_kg_year} kg/year</strong>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <span className="text-zinc-300">Digested Biogas Ammoniacal Slurry:</span>
                      <strong className="text-white font-mono">{overview.nutrient_balance.biogas_slurry_litres_year.toLocaleString()} Litres/year</strong>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
                      <span className="text-emerald-300 font-semibold">Net Annual Farmer Expenditure Saved:</span>
                      <strong className="text-emerald-400 font-bold font-mono text-sm">
                        ₹{overview.nutrient_balance.synthetic_fertilizer_cost_saved_inr.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Soil Carbon Sequestration Card */}
                <div className="lg:col-span-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Trees className="w-4 h-4 text-emerald-400" />
                      Soil Organic Carbon (SOC)
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Continuous microbial digestion and circular FYM application actively builds topsoil organic matter.
                    </p>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
                      <span className="text-xs text-zinc-400 uppercase font-semibold">Annual SOC Accumulation</span>
                      <div className="text-xl font-bold text-emerald-400">+0.22% / ha / yr</div>
                      <p className="text-[11px] text-zinc-400 pt-1">
                        Buffers tropical laterite soil acidity (pH 4.8 to 5.8) and expands water-holding capacity.
                      </p>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed">
                      {overview.nutrient_balance.soil_organic_carbon_gain_rate}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 text-[11px] text-zinc-400">
                    Complies with Module 10 smallholder carbon credit aggregation protocols.
                  </div>
                </div>
              </div>

              {/* Monoculture vs IFS Comparative Matrix */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">System Impact Benchmark: Monoculture vs FieldShift IFS</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                        <th className="pb-3">Component</th>
                        <th className="pb-3 text-rose-400">Standalone Monoculture</th>
                        <th className="pb-3 text-emerald-400">FieldShift Integrated Farm (IFS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      <tr>
                        <td className="py-3 font-semibold text-white">Income Streams</td>
                        <td className="py-3 text-zinc-400">1 (Single seasonal crop harvest)</td>
                        <td className="py-3 text-emerald-400 font-medium">5 (Crops, A2 Milk, Fresh Fish, Eggs/Meat, Honey)</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Fertilizer Sourcing</td>
                        <td className="py-3 text-zinc-400">100% purchased synthetic NPK</td>
                        <td className="py-3 text-emerald-400 font-medium">60–80% displaced by cow FYM, bio-slurry & poultry litter</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Pest Management</td>
                        <td className="py-3 text-zinc-400">Chemical sprays & systemic insecticides</td>
                        <td className="py-3 text-emerald-400 font-medium">Biological (Rice-duck mutualism, Trichoderma, bee-friendly IPM)</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Drought Resilience</td>
                        <td className="py-3 text-zinc-400">High vulnerability; groundwater depletion</td>
                        <td className="py-3 text-emerald-400 font-medium">Rain retention pond stores &gt;270,000L for 45+ critical days</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-white">Pollination Fruit Set</td>
                        <td className="py-3 text-zinc-400">Subject to wild insect decline</td>
                        <td className="py-3 text-emerald-400 font-medium">+28% fruit set boost via managed bee colonies</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADD IFS ASSET MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Register New IFS Asset
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-type selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAssetType("livestock")}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      modalAssetType === "livestock"
                        ? "bg-amber-950 text-amber-300 border-amber-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    Livestock / Birds
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAssetType("pond")}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      modalAssetType === "pond"
                        ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    Farm Pond
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAssetType("bees")}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      modalAssetType === "bees"
                        ? "bg-yellow-950 text-yellow-300 border-yellow-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    Apiculture Hives
                  </button>
                </div>

                <form onSubmit={handleCreateAsset} className="space-y-4">
                  {modalAssetType === "livestock" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Animal Category</label>
                        <select
                          value={animalType}
                          onChange={(e) => setAnimalType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                        >
                          <option value="dairy_cattle">Dairy Cattle</option>
                          <option value="poultry">Poultry (Chickens)</option>
                          <option value="duck">Ducks (Rice-Duck Mutualism)</option>
                          <option value="goat">Goats / Sheep</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Breed Name</label>
                          <input
                            type="text"
                            value={breedName}
                            onChange={(e) => setBreedName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                            placeholder="e.g. Vechoor, Gramasree, Chara"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Unit Head Count</label>
                          <input
                            type="number"
                            min={1}
                            value={unitCount}
                            onChange={(e) => setUnitCount(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Daily Yield Metric</label>
                        <input
                          type="text"
                          value={dailyYield}
                          onChange={(e) => setDailyYield(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          placeholder="e.g. 14 litres milk/day or 12 eggs/day"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="biogasCheck"
                          checked={biogasLinked}
                          onChange={(e) => setBiogasLinked(e.target.checked)}
                          className="rounded bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-0"
                        />
                        <label htmlFor="biogasCheck" className="text-xs text-zinc-300">
                          Connect dung output to domestic 2m³ Biogas Digester
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Agronomic Notes</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          placeholder="e.g. Free-range in paddy; manure dedicated to pepper vines"
                        />
                      </div>
                    </>
                  )}

                  {modalAssetType === "pond" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Pond Name</label>
                        <input
                          type="text"
                          value={pondName}
                          onChange={(e) => setPondName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Surface Area (m²)</label>
                          <input
                            type="number"
                            min={20}
                            value={pondArea}
                            onChange={(e) => setPondArea(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Mean Depth (m)</label>
                          <input
                            type="number"
                            step={0.1}
                            min={1.0}
                            value={pondDepth}
                            onChange={(e) => setPondDepth(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Primary Fish Species</label>
                        <input
                          type="text"
                          value={pondSpecies}
                          onChange={(e) => setPondSpecies(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          placeholder="Composite Carp, Pearlspot, GIFT Tilapia"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Water Inflow Source</label>
                        <input
                          type="text"
                          value={pondSource}
                          onChange={(e) => setPondSource(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          placeholder="e.g. Monsoon Surface Runoff & Natural Spring"
                        />
                      </div>
                    </>
                  )}

                  {modalAssetType === "bees" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Honeybee Species</label>
                        <select
                          value={beeSpecies}
                          onChange={(e) => setBeeSpecies(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                        >
                          <option value="Apis cerana indica">Apis cerana indica (Indian Honey Bee)</option>
                          <option value="Tetragonula iridipennis">Tetragonula iridipennis (Stingless Bee / Cheruthen)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Hive Count</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={hiveCount}
                          onChange={(e) => setHiveCount(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Target Pollination Crops (comma-separated)</label>
                        <input
                          type="text"
                          value={targetCrops}
                          onChange={(e) => setTargetCrops(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                          placeholder="Nutmeg, Coconut, Vegetables, Cashew"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="medHoneyCheck"
                          checked={medicinalMarket}
                          onChange={(e) => setMedicinalMarket(e.target.checked)}
                          className="rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-0"
                        />
                        <label htmlFor="medHoneyCheck" className="text-xs text-zinc-300">
                          Target high-value medicinal honey premium market (₹1,500+/kg)
                        </label>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Registering..." : "Save Asset"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-sm text-zinc-400">
          No farm selected or backend service is offline.
        </div>
      )}
    </div>
  );
}
