"use client";

import { useEffect, useState } from "react";
import { fetchHealth, HealthResponse } from "@/lib/api";
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export default function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/80 text-zinc-100 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs shadow-sm backdrop-blur">
      <div className="flex items-center gap-1.5">
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : health?.status === "healthy" ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        )}

        <span className="font-medium">
          {loading && !health ? "Checking API..." : health ? "Backend Online" : "Backend Offline"}
        </span>
      </div>

      {health && (
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-700 text-zinc-400">
          <span>v{health.version}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-mono">{health.region}</span>
        </div>
      )}

      {error && !loading && (
        <span className="hidden md:inline text-rose-400 truncate max-w-[200px]" title={error}>
          {error}
        </span>
      )}

      <button
        onClick={checkHealth}
        disabled={loading}
        title="Refresh health status"
        className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-zinc-200"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

