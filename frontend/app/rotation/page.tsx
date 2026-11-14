"use client";

import { useEffect, useState } from "react";
import {
  evaluateCropSuitability,
  Farm,
  CropSuitabilityResponse,
  CropSuitabilityEvaluation,
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
} from "lucide-react";

export default function RotationPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [suitabilityData, setSuitabilityData] = useState<CropSuitabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);

  const loadSuitability = async (farmId: string, authToken: string) => {
    setRefreshing(true);
    try {
      const data = await evaluateCropSuitability(farmId, authToken);
      setSuitabilityData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedFarm && token) {
      loadSuitability(selectedFarm.id, token);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 4 & 5 • Crop Intelligence & Rotation Optimization
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Crop Suitability & Rotation Planner</h1>
          <p className="text-sm text-zinc-400">
            Multi-factor suitability scoring and multi-year rotation strategies grounded in Kerala agricultural research.
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
                  {f.farm_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => selectedFarm && token && loadSuitability(selectedFarm.id, token)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Recalculate Suitability"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live Telemetry Used Banner */}
      {suitabilityData && (
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Telemetry Applied to Scoring Model:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <span>
              Soil pH: <strong className="text-zinc-200">{suitabilityData.telemetry_used.soil_ph}</strong>
            </span>
            <span>•</span>
            <span>
              Avg Temp: <strong className="text-zinc-200">{suitabilityData.telemetry_used.ambient_temp_avg_c}°C</strong>
            </span>
            <span>•</span>
            <span>
              30d Rain: <strong className="text-zinc-200">{suitabilityData.telemetry_used.precipitation_30d_mm} mm</strong>
            </span>
            <span>•</span>
            <span>
              Slope: <strong className="text-zinc-200">{suitabilityData.telemetry_used.slope_deg}°</strong>
            </span>
            <span>•</span>
            <span>
              Irrigation:{" "}
              <strong className="text-emerald-400">
                {suitabilityData.telemetry_used.irrigation_active ? "Available" : "Rainfed"}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* SECTION 1: Crop Suitability Rankings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              <span>Crop Suitability Engine ({suitabilityData?.crops.length ?? 0} Kerala Crops)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Ranked by weighted scoring across Soil (25%), Climate (25%), Water (20%), Drainage (15%), and Season (15%).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-xs">Evaluating crop compatibility...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suitabilityData?.crops.map((crop) => {
              const isExpanded = expandedCropId === crop.crop_id;
              const isHighlySuitable = crop.suitability_score >= 85;
              const isModSuitable = crop.suitability_score >= 70 && crop.suitability_score < 85;

              return (
                <div
                  key={crop.crop_id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 ${
                    isHighlySuitable
                      ? "bg-zinc-900/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                      : isModSuitable
                      ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      : "bg-zinc-950/60 border-zinc-800/80 opacity-85"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{crop.crop_name}</h3>
                      <p className="text-[11px] text-zinc-400 italic">{crop.scientific_name}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400">{crop.suitability_score}</div>
                      <div className="text-[10px] text-zinc-400">Score / 100</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        isHighlySuitable
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : isModSuitable
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {crop.suitability_class}
                    </span>

                    {crop.nitrogen_fixation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        <span>Fixes N₂</span>
                      </span>
                    )}
                  </div>

                  {/* Supporting Factor Highlight */}
                  {crop.supporting_factors.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{crop.supporting_factors[0]}</span>
                    </div>
                  )}

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800 text-[11px]">
                      <div>
                        <span className="text-zinc-400 block font-medium mb-1">Component Breakdown:</span>
                        <div className="grid grid-cols-2 gap-1.5 text-zinc-300">
                          <div>Soil: <strong className="text-white">{crop.component_scores.soil_score}</strong>/100</div>
                          <div>Climate: <strong className="text-white">{crop.component_scores.climate_score}</strong>/100</div>
                          <div>Water: <strong className="text-white">{crop.component_scores.water_score}</strong>/100</div>
                          <div>Drainage: <strong className="text-white">{crop.component_scores.drainage_score}</strong>/100</div>
                        </div>
                      </div>

                      {crop.limitations.length > 0 && (
                        <div>
                          <span className="text-amber-400 block font-medium mb-0.5">Limitations:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                            {crop.limitations.map((lim, i) => (
                              <li key={i}>{lim}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-zinc-500 pt-1 text-[10px]">
                        Planting window: {crop.planting_window}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => toggleExpand(crop.crop_id)}
                    className="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-200 pt-1 flex items-center justify-center gap-1"
                  >
                    <span>{isExpanded ? "Show Less" : "Inspect Agro-climatic Criteria"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: The Three Alternative Rotation Strategies */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <span>Three Alternative Crop Rotation Strategies</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Multi-year crop sequences preventing soil-borne monoculture depletion, optimized for Kerala agro-climatic zones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strategy A */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-emerald-500/30 space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Strategy A</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Soil Health Priority</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Prioritizes leguminous crops (Cowpea, Green Gram) to replenish biological nitrogen, improve organic matter,
              and break continuous monoculture pest cycles.
            </p>
            <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 1:</span>{" "}
                <span className="font-semibold text-white">Banana (Robusta)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 2:</span>{" "}
                <span className="font-semibold text-emerald-400">Cowpea (Vigna unguiculata)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Year 3:</span>{" "}
                <span className="font-semibold text-white">Cassava / Tapioca</span>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400/90 pt-1 font-mono">
              Soil Benefit: +45 kg/ha residual N & enhanced microbial biomass.
            </div>
          </div>

          {/* Strategy B */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Strategy B</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Water Efficiency Priority</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Selects lower water-demand crops with high drought resilience, aligning planting windows strictly with
              historical NASA GPM monsoon precipitation patterns.
            </p>
            <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 1:</span>{" "}
                <span className="font-semibold text-white">Maize (Zea mays)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 2:</span>{" "}
                <span className="font-semibold text-cyan-400">Black Gram (Urad)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Year 3:</span>{" "}
                <span className="font-semibold text-white">Turmeric (Curcuma longa)</span>
              </div>
            </div>
            <div className="text-[10px] text-cyan-400/90 pt-1 font-mono">
              Water Benefit: ~35% lower irrigation requirement than continuous banana.
            </div>
          </div>

          {/* Strategy C */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Strategy C</span>
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Balanced Strategy</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Equilibrates market value with soil conservation and seasonal labor feasibility, following Kerala Agricultural
              University (KAU) intercropping guidance.
            </p>
            <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 1:</span>{" "}
                <span className="font-semibold text-white">Banana (Nendran)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-400">Year 2:</span>{" "}
                <span className="font-semibold text-amber-400">Vegetable Cowpea</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Year 3:</span>{" "}
                <span className="font-semibold text-white">Ginger (Zingiber officinale)</span>
              </div>
            </div>
            <div className="text-[10px] text-amber-400/90 pt-1 font-mono">
              Economic Benefit: Maximizes market revenue while breaking pest cycles.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
