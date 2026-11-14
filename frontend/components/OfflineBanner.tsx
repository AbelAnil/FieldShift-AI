"use client";

import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, RefreshCw, Terminal, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function OfflineBanner() {
  const { isBackendOnline, isLoading, checkBackend } = useAuth();
  const [checking, setChecking] = useState(false);

  if (isBackendOnline || isLoading) return null;

  const handleRetry = async () => {
    setChecking(true);
    await checkBackend();
    setChecking(false);
  };

  return (
    <div className="bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-zinc-950 border-b border-rose-500/30 px-4 py-3 text-xs text-rose-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Backend Offline:</span>{" "}
            <span>FieldShift FastAPI service is not reachable at </span>
            <code className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-mono text-[11px]">
              http://localhost:8000
            </code>
            <span className="hidden sm:inline">. Live Earth observation, soil and digital twin data cannot be fetched until the backend is running.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000</span>
          </div>

          <button
            onClick={handleRetry}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs transition shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Retrying..." : "Retry Connection"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
