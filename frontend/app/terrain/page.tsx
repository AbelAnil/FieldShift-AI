"use client";

import { useEffect, useState } from "react";
import {
  fetchFarmTerrain,
  toggleWaterlogging,
  Farm,
  TerrainResponse,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Mountain,
  Waves,
  Compass,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

export default function TerrainPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [terrain, setTerrain] = useState<TerrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadTerrain = async (farmId: string, authToken: string) => {
    try {
      const data = await fetchFarmTerrain(farmId, authToken);
      setTerrain(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedFarm && token) {
      loadTerrain(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = farms.find((f) => f.id === e.target.value);
    if (matched) {
      selectFarm(matched);
    }
  };

  const handleToggleWaterlogging = async () => {
    if (!selectedFarm || !terrain || !token) return;
    setToggling(true);
    try {
      const newStatus = !terrain.farmer_marked_waterlogging;
      await toggleWaterlogging(selectedFarm.id, newStatus, token);
      setTerrain({ ...terrain, farmer_marked_waterlogging: newStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 3 • Terrain & Hydrology
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Terrain Relief & Drainage Analysis</h1>
          <p className="text-sm text-zinc-400">
            NASADEM ~30m elevation relief, slope gradient, and PySheds flow accumulation modeling.
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
        </div>
      </div>

      {/* Scientific Limitation Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-300">Preliminary Indicator:</span>
          <p className="text-amber-200/90 leading-relaxed">
            {terrain?.scientific_limitation ||
              "DEM flow accumulation indicates topographic gathering potential, not confirmed subsurface waterlogging. Actual drainage depends on farm drains, infiltration rate, and soil permeability."}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Mean Elevation</span>
            <Mountain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {terrain?.elevation_mean_m ?? "--"} <span className="text-sm font-normal text-zinc-400">m MSL</span>
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Relief Range:</span>
            <span className="text-zinc-200 font-medium">
              {terrain ? `${terrain.elevation_min_m} - ${terrain.elevation_max_m}m` : "--"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Average Slope</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {terrain?.slope_mean_deg ?? "--"} <span className="text-sm font-normal text-zinc-400">degrees</span>
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Class:</span>
            <span className="text-emerald-400 font-medium truncate max-w-[130px]">{terrain?.slope_class ?? "--"}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Dominant Aspect</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{terrain?.aspect_dominant ?? "--"}</div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Solar Exposure:</span>
            <span className="text-zinc-200 font-medium">South-West Monsoon Facing</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Topographic Wetness (TWI)</span>
            <Waves className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{terrain?.topographic_wetness_index ?? "--"}</div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Swale Index:</span>
            <span className="text-zinc-200 font-medium">Moderate Accumulation</span>
          </div>
        </div>
      </div>

      {/* Detailed Analysis & Farmer Waterlogging Validation Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            <span>Hydrological Drainage Assessment</span>
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">{terrain?.drainage_assessment}</p>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended Farm Conservation Measures:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-1">
              <li>Maintain contour bunding or vegetative grass strips along slopes &gt;4° to mitigate topsoil erosion.</li>
              <li>Keep natural drainage swales unobstructed to prevent water stagnation in banana/pepper plots.</li>
              <li>On sloping lateritic valley terrains, preserve deep-rooted perimeter trees and terrace bunds to prevent localized topsoil washouts during high-intensity monsoon showers.</li>
            </ul>
          </div>
        </div>

        {/* Farmer Ground-Truth Validation Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 text-xs">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Ground-Truth Calibration</span>
          </h3>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Farmers can mark known waterlogging locations from on-field experience to validate and calibrate the
            DEM flow accumulation models.
          </p>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Observed Waterlogging:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  terrain?.farmer_marked_waterlogging
                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                    : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                }`}
              >
                {terrain?.farmer_marked_waterlogging ? "Active Flag on Field" : "No Waterlogging Reported"}
              </span>
            </div>

            <button
              onClick={handleToggleWaterlogging}
              disabled={toggling}
              className={`w-full py-2 px-3 rounded-xl font-semibold transition ${
                terrain?.farmer_marked_waterlogging
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
              }`}
            >
              {terrain?.farmer_marked_waterlogging ? "Clear Waterlogging Flag" : "Mark Known Waterlogging Swale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
