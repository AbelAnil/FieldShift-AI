"use client";

import { useEffect, useState } from "react";
import {
  fetchFarms,
  loginDemoUser,
  fetchFarmDigitalTwin,
  simulateFarmScenario,
  Farm,
  DigitalTwinResponse,
  SimulationResponse,
} from "@/lib/api";
import {
  Binary,
  Layers,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Play,
  TrendingDown,
  Droplets,
  Mountain,
  FlaskConical,
  Sun,
  Sprout,
  Info,
} from "lucide-react";

export default function DigitalTwinPage() {
  const [token, setToken] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulation Controls
  const [simCrop, setSimCrop] = useState("Cassava / Tapioca");
  const [simRainDelta, setSimRainDelta] = useState<number>(-25); // -25% dry anomaly
  const [simIrrigation, setSimIrrigation] = useState(false);
  const [simDelayDays, setSimDelayDays] = useState(15);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const auth = await loginDemoUser(1);
        setToken(auth.access_token);
        const farmList = await fetchFarms(auth.access_token);
        setFarms(farmList);
        if (farmList.length > 0) {
          setSelectedFarm(farmList[0]);
          await loadTwin(farmList[0].id, auth.access_token);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadTwin = async (farmId: string, authToken: string) => {
    setRefreshing(true);
    try {
      const data = await fetchFarmDigitalTwin(farmId, authToken);
      setTwin(data);
      // Auto run default simulation
      await runSimulation(farmId, authToken, simCrop, simRainDelta, simIrrigation, simDelayDays);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const runSimulation = async (
    farmId: string,
    authToken: string,
    crop: string,
    rainDelta: number,
    irrigation: boolean,
    delay: number
  ) => {
    setSimulating(true);
    try {
      const res = await simulateFarmScenario(
        farmId,
        {
          crop_name: crop,
          rainfall_delta_pct: Number(rainDelta),
          irrigation_available: irrigation,
          planting_delay_days: Number(delay),
        },
        authToken
      );
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = farms.find((f) => f.id === e.target.value);
    if (matched && token) {
      setSelectedFarm(matched);
      loadTwin(matched.id, token);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFarm && token) {
      runSimulation(selectedFarm.id, token, simCrop, simRainDelta, simIrrigation, simDelayDays);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 6 • Farm Digital Twin & Predictive Simulation
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Predictive Farm Digital Twin</h1>
          <p className="text-sm text-zinc-400">
            Unified virtual farm model synthesizing soil, terrain, satellite observations, and what-if agricultural scenarios.
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
            onClick={() => selectedFarm && token && loadTwin(selectedFarm.id, token)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Refresh Digital Twin"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Score */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Environmental Risk Score</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{twin?.risk_assessment.overall_risk_score ?? "--"}</span>
            <span className="text-xs font-normal text-zinc-500">/ 100</span>
          </div>
          <div className="text-xs flex items-center justify-between pt-1">
            <span className="text-zinc-400">Status:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                twin && twin.risk_assessment.overall_risk_score >= 60
                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                  : twin && twin.risk_assessment.overall_risk_score >= 35
                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }`}
            >
              {twin?.risk_assessment.risk_level ?? "Stable"}
            </span>
          </div>
        </div>

        {/* Data Completeness */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Data Completeness</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {twin?.data_completeness_pct ?? "--"}%
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Physical Lab Test:</span>
            <span className="text-zinc-200 font-medium">
              {twin?.soil_state.has_lab_test ? "Verified" : "SoilGrids Modelled"}
            </span>
          </div>
        </div>

        {/* Current Crop State */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Active Crop State</span>
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {twin?.crop_state.current_crop ?? "--"}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>Irrigation:</span>
            <span className="text-emerald-400 font-medium">
              {twin?.crop_state.irrigation_active ? "Drip Line Active" : "Rainfed Plot"}
            </span>
          </div>
        </div>

        {/* Canopy Vigor */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-medium">Canopy Telemetry</span>
            <Binary className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            NDVI {twin?.vegetation_state.latest_ndvi ? twin.vegetation_state.latest_ndvi.toFixed(2) : "--"}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
            <span>NDMI (Moisture):</span>
            <span className="text-purple-400 font-medium">
              {twin?.vegetation_state.latest_ndmi ? twin.vegetation_state.latest_ndmi.toFixed(2) : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Subsystem State Cards */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Binary className="w-5 h-5 text-emerald-400" />
            <span>Digital Twin Subsystem Telemetry Layer</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">Last Snapshot: {twin?.last_synced}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Soil Subsystem */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <FlaskConical className="w-4 h-4" />
              <span>Soil Subsystem</span>
            </div>
            <div className="space-y-1 text-zinc-400">
              <div>Effective pH: <strong className="text-white">{twin?.soil_state.effective_ph}</strong></div>
              <div>Texture: <strong className="text-white">{twin?.soil_state.effective_texture}</strong></div>
              <div>SOC: <strong className="text-white">{twin?.soil_state.organic_carbon_pct}%</strong></div>
              <div className="text-[10px] text-zinc-500 pt-1">
                {twin?.soil_state.has_lab_test ? "Physical Lab Measurements Active" : "SoilGrids Modelled Baseline"}
              </div>
            </div>
          </div>

          {/* Terrain Subsystem */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Mountain className="w-4 h-4" />
              <span>Terrain Subsystem</span>
            </div>
            <div className="space-y-1 text-zinc-400">
              <div>Elevation: <strong className="text-white">{twin?.terrain_state.elevation_mean_m}m MSL</strong></div>
              <div>Slope: <strong className="text-white">{twin?.terrain_state.slope_mean_deg}°</strong> ({twin?.terrain_state.slope_class})</div>
              <div>Aspect: <strong className="text-white">{twin?.terrain_state.aspect_dominant}</strong></div>
              <div>Swale Risk: <strong className="text-amber-400">{twin?.terrain_state.flow_accumulation_risk.split("(")[0]}</strong></div>
            </div>
          </div>

          {/* Atmosphere Subsystem */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sun className="w-4 h-4" />
              <span>Atmosphere (NASA)</span>
            </div>
            <div className="space-y-1 text-zinc-400">
              <div>30d Precip: <strong className="text-white">{twin?.environmental_state.cumulative_rainfall_30d_mm} mm</strong></div>
              <div>Mean Temp: <strong className="text-white">{twin?.environmental_state.avg_temperature_c}°C</strong></div>
              <div>SMAP Soil Moisture: <strong className="text-white">{twin?.environmental_state.smap_moisture_m3m3} m³/m³</strong></div>
              <div className="text-[10px] text-purple-400 pt-1">~9 km Satellite Footprint</div>
            </div>
          </div>

          {/* Active Risk Factors */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Active Stressors ({twin?.risk_assessment.risk_factors.length ?? 0})</span>
            </div>
            {twin?.risk_assessment.risk_factors && twin.risk_assessment.risk_factors.length > 0 ? (
              <div className="space-y-1.5 text-[11px]">
                {twin.risk_assessment.risk_factors.slice(0, 2).map((rf, i) => (
                  <div key={i} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="font-semibold text-zinc-200 block">{rf.factor}</span>
                    <span className="text-[10px] text-zinc-400 line-clamp-1">{rf.detail}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-[11px] pt-1">No critical environmental risks detected.</div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: What-If Scenario Simulator */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-purple-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>Interactive What-If Scenario Simulator</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Simulate climate shocks, crop substitutions, irrigation cutbacks, and delayed planting on farm risk and suitability.
            </p>
          </div>
          <span className="text-xs text-purple-400 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-full font-medium">
            Predictive Decision Engine
          </span>
        </div>

        {/* Simulation Controls Form */}
        <form onSubmit={handleSimulateSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Simulated Crop Selection */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">Simulated Crop Substitution</label>
            <select
              value={simCrop}
              onChange={(e) => setSimCrop(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500"
            >
              <option value="Banana (Nendran / Robusta)">Banana (High Water Demand)</option>
              <option value="Cassava / Tapioca">Cassava (Drought Tolerant Tuber)</option>
              <option value="Cowpea (Lobia / Payar)">Cowpea (Nitrogen-Fixing Pulse)</option>
              <option value="Rice (Paddy - Uma / Jyothi)">Rice / Paddy (Lowland Basin)</option>
              <option value="Maize (Corn)">Maize (Moderate Water Demand)</option>
              <option value="Ginger (Varada / Rio de Janeiro)">Ginger (High Value Spice)</option>
            </select>
          </div>

          {/* Rainfall Anomaly Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-zinc-300 font-medium">Rainfall Anomaly (%)</label>
              <span className={`font-bold ${simRainDelta < 0 ? "text-amber-400" : "text-cyan-400"}`}>
                {simRainDelta > 0 ? `+${simRainDelta}%` : `${simRainDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="5"
              value={simRainDelta}
              onChange={(e) => setSimRainDelta(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>-60% (Drought)</span>
              <span>0% (Normal)</span>
              <span>+60% (Flooding)</span>
            </div>
          </div>

          {/* Irrigation Toggle */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">Irrigation Availability</label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSimIrrigation(true)}
                className={`flex-1 py-1.5 px-3 rounded-xl transition ${
                  simIrrigation
                    ? "bg-purple-600 text-white font-semibold"
                    : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                }`}
              >
                Drip Active
              </button>
              <button
                type="button"
                onClick={() => setSimIrrigation(false)}
                className={`flex-1 py-1.5 px-3 rounded-xl transition ${
                  !simIrrigation
                    ? "bg-purple-600 text-white font-semibold"
                    : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                }`}
              >
                Rainfed
              </button>
            </div>
          </div>

          {/* Delayed Planting Days */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-zinc-300 font-medium">Sowing Delay</label>
              <span className="font-bold text-zinc-200">+{simDelayDays} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="5"
              value={simDelayDays}
              onChange={(e) => setSimDelayDays(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>On-time</span>
              <span>+45 days delay</span>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={simulating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-950"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{simulating ? "Calculating Scenario..." : "Run What-If Simulation"}</span>
            </button>
          </div>
        </form>

        {/* Simulation Output Dossier */}
        {simulationResult && (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase">
                  Scenario Report • {simulationResult.simulation_id}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Simulated Outcome: {simulationResult.scenario_inputs.simulated_crop}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    Projected Risk:{" "}
                    <span
                      className={
                        simulationResult.projected_risk_score >= 50
                          ? "text-rose-400"
                          : simulationResult.projected_risk_score >= 30
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {simulationResult.projected_risk_score}/100 ({simulationResult.projected_risk_level})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recalculated Suitability */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="text-zinc-400 font-semibold block">Recalculated Suitability Under Scenario:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">
                    {simulationResult.recalculated_suitability.score}
                  </span>
                  <span className="text-zinc-400">/ 100 ({simulationResult.recalculated_suitability.class})</span>
                </div>
                {simulationResult.recalculated_suitability.supporting_factors.length > 0 && (
                  <div className="text-[11px] text-zinc-300 pt-1">
                    ✓ {simulationResult.recalculated_suitability.supporting_factors[0]}
                  </div>
                )}
              </div>

              {/* Agro-climatic Consequences */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="text-zinc-400 font-semibold block">Agronomic Consequences & Advisory:</span>
                <ul className="space-y-1 text-zinc-300 text-[11px]">
                  {simulationResult.consequences.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-zinc-500 italic border-t border-zinc-800/80">
              {simulationResult.scientific_disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
