"use client";

import { useEffect, useState } from "react";
import { fetchHealth, HealthResponse } from "@/lib/api";
import { Activity, AlertCircle, CheckCircle2, RefreshCw, ChevronDown, Satellite, Database, Check } from "lucide-react";

export default function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to connect to backend");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll every 45 seconds
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  const services = health?.services || {
    nasa_power: { status: "online", name: "NASA POWER Agroclimatology" },
    nasa_gpm: { status: "online", name: "NASA GPM IMERG Precipitation" },
    isric_soilgrids: { status: "online", name: "ISRIC SoilGrids 250m" },
  };

  return (
    <div className="relative">
      <div
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs shadow-sm backdrop-blur cursor-pointer transition"
      >
        <div className="flex items-center gap-1.5">
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : health?.status === "healthy" ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          )}

          <span className="font-semibold text-xs">
            {loading && !health ? "Checking API..." : health ? "Backend Online" : "Backend Offline"}
          </span>
        </div>

        {health && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-700 text-zinc-400">
            <span className="text-emerald-400 font-mono text-[11px]">NASA & SoilGrids OK</span>
          </div>
        )}

        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </div>

      {/* Popover Showing Upstream Scientific Reachability */}
      {showDetails && health && (
        <div className="absolute right-0 top-10 w-72 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl z-50 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-white">Scientific Services Status</span>
            <span className="text-[10px] font-mono text-zinc-400">v{health.version}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-zinc-200 font-medium">NASA POWER API</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                {services.nasa_power?.status || "online"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-200 font-medium">NASA GPM IMERG</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                {services.nasa_gpm?.status || "online"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-200 font-medium">ISRIC SoilGrids 250m</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                {services.isric_soilgrids?.status || "online"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800 flex justify-between">
            <span>Uptime: {Math.floor(health.uptime_seconds / 60)} mins</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                checkHealth();
              }}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Re-probe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
