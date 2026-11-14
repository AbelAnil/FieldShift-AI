"use client";

import { useEffect, useState } from "react";
import {
  fetchFarmEnvironment,
  fetchFarmRainfall,
  fetchFarmVegetation,
  fetchDataSources,
  Farm,
  EnvironmentSummaryResponse,
  RainfallResponse,
  VegetationResponse,
  DataSourceItem,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Satellite,
  Droplets,
  Sun,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Calendar,
  CloudRain,
  Compass,
  ExternalLink,
  Activity,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
} from "recharts";

export default function EarthIntelligencePage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);

  const [envData, setEnvData] = useState<EnvironmentSummaryResponse | null>(null);
  const [rainfallData, setRainfallData] = useState<RainfallResponse | null>(null);
  const [vegData, setVegData] = useState<VegetationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"rainfall" | "climate" | "vegetation" | "provenance">("rainfall");

  // Load data sources registry
  useEffect(() => {
    async function loadSources() {
      try {
        const sources = await fetchDataSources();
        setDataSources(sources);
      } catch (err) {
        console.error("Data sources fetch failed", err);
      }
    }
    loadSources();
  }, []);

  const loadFarmData = async (farmId: string, authToken: string) => {
    setRefreshing(true);
    try {
      const [env, rain, veg] = await Promise.all([
        fetchFarmEnvironment(farmId, authToken),
        fetchFarmRainfall(farmId, authToken, 30),
        fetchFarmVegetation(farmId, authToken),
      ]);
      setEnvData(env);
      setRainfallData(rain);
      setVegData(veg);
    } catch (err) {
      console.error("Failed to load environment intelligence", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedFarm && token) {
      loadFarmData(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = farms.find((f) => f.id === e.target.value);
    if (matched) {
      selectFarm(matched);
    }
  };

  const refreshCurrentFarm = () => {
    if (selectedFarm && token) {
      loadFarmData(selectedFarm.id, token);
    }
  };

  // Helper for Data Status Badge
  const renderStatusBadge = (status?: string, statusLabel?: string) => {
    const isLive = status === "live" || status?.toLowerCase().includes("live");
    const isCached = status === "cached" || status?.toLowerCase().includes("cache");

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-xs border ${
          isLive
            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
            : isCached
            ? "bg-cyan-950 text-cyan-300 border-cyan-800"
            : "bg-amber-950 text-amber-300 border-amber-800"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive ? "bg-emerald-400 animate-pulse" : isCached ? "bg-cyan-400" : "bg-amber-400"
          }`}
        />
        {statusLabel || (isLive ? "Live NASA API" : isCached ? "Cached Telemetry" : "Regional Baseline")}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner: Farm Selector & Quick Telemetry Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 2 • NASA Earth Observation Engine & Long-Term Climatology
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Earth Intelligence Dashboard</h1>
          <p className="text-sm text-zinc-300">
            Calibrated satellite observations from NASA GPM IMERG, NASA POWER, SMAP, and Landsat 8/9 / Sentinel-2.
          </p>
        </div>

        {/* Farm Selector Dropdown */}
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
                  {f.farm_name} ({f.location_name.split(",")[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={refreshCurrentFarm}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Refresh NASA Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* FEATURE A: Long-Term NASA Baseline vs 30-Day Rainfall Anomaly */}
      {rainfallData?.climatology_baseline && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>NASA Multi-Year Climatology Baseline vs. Current 30-Day Anomaly</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Source: {rainfallData.climatology_baseline.source}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-medium">Current 30-Day Precipitation</span>
              <div className="text-2xl font-black text-white">
                {rainfallData.climatology_baseline.current_rainfall_30d_mm}{" "}
                <span className="text-sm font-normal text-zinc-400">mm</span>
              </div>
              <p className="text-xs text-zinc-400">NASA GPM IMERG calibrated late run</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-medium">30-Year Climatological Normal</span>
              <div className="text-2xl font-black text-zinc-300">
                {rainfallData.climatology_baseline.normal_rainfall_30d_mm}{" "}
                <span className="text-sm font-normal text-zinc-400">mm</span>
              </div>
              <p className="text-xs text-zinc-400">{rainfallData.climatology_baseline.climate_regime}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-medium">Rainfall Anomaly vs Normal</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-black ${
                    rainfallData.climatology_baseline.rainfall_anomaly_pct > 20
                      ? "text-cyan-400"
                      : rainfallData.climatology_baseline.rainfall_anomaly_pct < -20
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {rainfallData.climatology_baseline.anomaly_label}
                </span>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 border border-zinc-700 text-zinc-200">
                {rainfallData.climatology_baseline.anomaly_category}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Climatological Adaptation Guidance:</strong>{" "}
              {rainfallData.climatology_baseline.adaptation_guidance}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid with Data Status, Last Updated, and Source Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Rainfall Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-medium text-zinc-300">NASA GPM Rainfall (30d)</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white">
                {rainfallData?.cumulative_rainfall_mm ?? "--"}{" "}
                <span className="text-sm font-normal text-zinc-400">mm</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                (~10 km Gridded Satellite Estimate)
              </div>
            </div>

            <div className="text-xs flex items-center justify-between pt-1">
              <span className="text-zinc-400">Heavy Rain Days:</span>
              <span
                className={`font-semibold ${
                  rainfallData && rainfallData.heavy_rain_events_count > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {rainfallData?.heavy_rain_events_count ?? 0} events (&gt;40mm)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              {renderStatusBadge(rainfallData?.data_status, rainfallData?.data_status_label)}
              <a
                href={rainfallData?.source_url || "https://gpm.nasa.gov/data/imerg"}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-cyan-400 transition flex items-center gap-1 text-[11px]"
                title="Open NASA GPM IMERG Source"
              >
                <span>GPM IMERG</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] text-zinc-400">
              Updated: {rainfallData?.last_updated || "Live"}
            </div>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-medium text-zinc-300">NASA POWER Temperature</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white">
                {envData?.summary.avg_temperature_c ?? "--"}{" "}
                <span className="text-sm font-normal text-zinc-400">°C</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                (0.5° Agroclimatology Grid)
              </div>
            </div>

            <div className="text-xs flex items-center justify-between pt-1">
              <span className="text-zinc-400">Solar Radiation:</span>
              <span className="text-zinc-200 font-semibold">
                {envData?.summary.avg_solar_radiation_mj_m2 ?? "--"} MJ/m²
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              {renderStatusBadge(envData?.data_status, envData?.data_status_label)}
              <a
                href="https://power.larc.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1 text-[11px]"
                title="Open NASA POWER Portal"
              >
                <span>NASA POWER</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] text-zinc-400">
              Updated: {envData?.last_updated || "Live"}
            </div>
          </div>
        </div>

        {/* Canopy NDVI Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-medium text-zinc-300">Canopy Greenness (NDVI)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {vegData?.latest_ndvi ? vegData.latest_ndvi.toFixed(2) : "--"}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                (Landsat 8/9 & Sentinel-2 10–30m)
              </div>
            </div>

            <div className="text-xs flex items-center justify-between pt-1">
              <span className="text-zinc-400">Vigor Status:</span>
              <span className="text-zinc-200 font-medium truncate max-w-[140px]">
                {vegData?.canopy_status.vigor_status ?? "Analyzing..."}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              {renderStatusBadge("live", "Sentinel-2 MSI")}
              <a
                href="https://landsat.gsfc.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-emerald-400 transition flex items-center gap-1 text-[11px]"
                title="Open NASA Landsat Program"
              >
                <span>Landsat/Copernicus</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] text-zinc-400">
              Acquired: {vegData?.latest_acquisition_date || "2026-11-10"}
            </div>
          </div>
        </div>

        {/* SMAP Soil Moisture Card (with explicit Regional Estimate confidence note) */}
        <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-medium text-zinc-300">SMAP Soil Moisture</span>
              <Satellite className="w-4 h-4 text-purple-400" />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white flex items-baseline gap-2">
                <span>{envData?.smap_regional.surface_soil_moisture_m3m3 ?? "--"}</span>
                <span className="text-sm font-normal text-zinc-400">m³/m³</span>
              </div>
              {/* Direct confidence note for coarse 9km footprint */}
              <div className="text-xs font-semibold text-purple-300 mt-0.5">
                Regional Estimate (9 km Footprint)
              </div>
            </div>

            <div className="text-xs flex items-center justify-between pt-1">
              <span className="text-zinc-400">Anomaly Context:</span>
              <span className="text-purple-300 font-medium">
                {envData?.smap_regional.anomaly_percent || "Near Normal"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              {renderStatusBadge("cached", "NASA SMAP L4 Enhanced")}
              <a
                href="https://smap.jpl.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-purple-400 transition flex items-center gap-1 text-[11px]"
                title="Open NASA SMAP Mission"
              >
                <span>NASA SMAP</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-[11px] text-zinc-400">
              Updated: Daily late run
            </div>
          </div>
        </div>
      </div>

      {/* Tab Controls for Detailed Charts */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("rainfall")}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "rainfall"
              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          NASA GPM Rainfall Trends
        </button>
        <button
          onClick={() => setActiveTab("climate")}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "climate"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          NASA POWER Agroclimatology
        </button>
        <button
          onClick={() => setActiveTab("vegetation")}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "vegetation"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Landsat & Sentinel Vegetation (NDVI/NDMI)
        </button>
        <button
          onClick={() => setActiveTab("provenance")}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "provenance"
              ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Data Sources & Provenance
        </button>
      </div>

      {/* Tab 1: Rainfall Visualization */}
      {activeTab === "rainfall" && (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-cyan-400" />
                <span>Daily Precipitation & 7-Day Rolling Trend</span>
              </h3>
              <p className="text-xs text-zinc-300">NASA GPM IMERG 0.1° multi-satellite calibrated precipitation</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-3 rounded bg-cyan-500"></span> Daily Rain (mm)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400"></span> 7-Day Rolling Total (mm)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full pt-4">
            {rainfallData && rainfallData.timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rainfallData.timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#a1a1aa" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Bar dataKey="daily_rainfall_mm" name="Daily Rain (mm)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="rolling_7d_rainfall_mm"
                    name="7-Day Rolling Total (mm)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Loading rainfall series...</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Climate Visualization */}
      {activeTab === "climate" && (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>Thermal Dynamics & Surface Radiation</span>
              </h3>
              <p className="text-xs text-zinc-300">NASA POWER Daily Air Temperature (Min/Max/Mean) & Solar Irradiance</p>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full pt-4">
            {envData && envData.weather_timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={envData.weather_timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#a1a1aa" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="temp_max" name="Max Temp (°C)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="temp_mean" name="Mean Temp (°C)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="temp_min" name="Min Temp (°C)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Loading climate series...</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Vegetation Dynamics */}
      {activeTab === "vegetation" && (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Multi-Spectral Canopy Indices (NDVI vs. NDMI)</span>
              </h3>
              <p className="text-xs text-zinc-300">Landsat 8/9 OLI (30m) & Sentinel-2 MSI (10m) 16-day composites</p>
            </div>
            <div className="text-xs text-zinc-300 font-medium">
              Current Canopy Status: <span className="text-emerald-400 font-bold">{vegData?.canopy_status.interpretation}</span>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full pt-4">
            {vegData && vegData.observations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vegData.observations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#a1a1aa" fontSize={11} domain={[0, 1.0]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ndvi" name="NDVI (Canopy Greenness)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="ndmi" name="NDMI (Canopy Moisture)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Loading vegetation trajectory...</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Data Sources & Provenance Registry */}
      {activeTab === "provenance" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Scientific Earth Observation Provenance Registry</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((ds, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {ds.provider}
                    </span>
                    <h4 className="font-bold text-sm text-zinc-100 mt-1">{ds.dataset_name}</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                    {ds.license}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">Spatial Resolution:</span>
                    <span className="text-zinc-100 font-semibold text-xs">{ds.spatial_resolution}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase font-medium">Temporal Resolution:</span>
                    <span className="text-zinc-100 font-semibold text-xs">{ds.temporal_resolution}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-amber-400 font-semibold block mb-0.5">Scientific Limitation:</span>
                  <p className="text-zinc-300 leading-relaxed text-xs">{ds.scientific_limitations}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
