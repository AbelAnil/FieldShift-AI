"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  RefreshCw,
  Sprout,
  Droplets,
  Layers,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import {
  Farm,
  FarmReportResponse,
  fetchFarmReport,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ReportsPage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [report, setReport] = useState<FarmReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport(farmId: string, userToken: string) {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchFarmReport(farmId, userToken);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedFarm && token) {
      loadReport(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  const handleSelectFarm = (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    selectFarm(found);
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.markdown_report);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.markdown_report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FieldShift_${report.farm_name.replace(/\s+/g, "_")}_Dossier.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 8 • Reporting & Dossiers</div>
          <h1 className="text-2xl font-bold text-white mt-1">Farm Decision Dossier & Compliance Report</h1>
          <p className="text-sm text-zinc-400">
            Synthesized intelligence report combining NASA Earth observations, soil audits, crop suitability rankings, and rotation roadmaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {farms.length > 0 && (
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => handleSelectFarm(e.target.value)}
              className="flex-1 sm:flex-none bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer min-w-0"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => selectedFarm && loadReport(selectedFarm.id, token)}
            disabled={isLoading || !selectedFarm}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>Regen</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            disabled={!report}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!report}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/20"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Generating comprehensive farm intelligence dossier...</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* KPI Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Composite Risk</div>
              <div className="text-lg font-bold text-white mt-1">
                {report.summary_kpis.risk_score} <span className="text-xs text-zinc-400 font-normal">/ 100</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{report.summary_kpis.risk_level}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">NASA 30d Rain</div>
              <div className="text-lg font-bold text-white mt-1">
                {report.summary_kpis.rainfall_30d_mm.toFixed(1)} <span className="text-xs text-zinc-400 font-normal">mm</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">GPM IMERG v07</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Soil Reaction</div>
              <div className="text-lg font-bold text-white mt-1">
                {report.summary_kpis.effective_ph.toFixed(1)} <span className="text-xs text-zinc-400 font-normal">pH</span>
              </div>
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">{report.summary_kpis.ph_category}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Mean Slope</div>
              <div className="text-lg font-bold text-white mt-1">
                {report.summary_kpis.slope_deg.toFixed(1)}°
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">NASADEM 30m</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Top Crop</div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={report.summary_kpis.top_crop}>
                {report.summary_kpis.top_crop}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                Score: {report.summary_kpis.top_crop_score.toFixed(1)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Pending Actions</div>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {report.summary_kpis.pending_tasks_count}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Active Checklist</div>
            </div>
          </div>

          {/* Dossier Document Sheet */}
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-4 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{report.farm_name} Decision Dossier</h2>
                  <div className="text-xs text-zinc-400">Generated: {report.generated_at}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                  Grounded in KAU & NASA data
                </span>
              </div>
            </div>

            {/* Formatted Dossier Document View */}
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed shadow-inner max-h-[700px] overflow-y-auto space-y-4 font-sans">
              {report.markdown_report.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-xl font-extrabold text-white border-b border-zinc-800 pb-2 mt-4 pt-2">
                      {trimmed.replace("# ", "")}
                    </h1>
                  );
                }
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-emerald-400 mt-5 pt-1 border-b border-zinc-900 pb-1">
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-sm font-semibold text-zinc-200 mt-3">
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                }
                if (trimmed.startsWith("---")) {
                  return <hr key={idx} className="border-zinc-800 my-4" />;
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  const content = trimmed.substring(2);
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2 text-zinc-300">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>
                        {content.split(/(\*\*.*?\*\*)/).map((chunk, cIdx) => {
                          if (chunk.startsWith("**") && chunk.endsWith("**")) {
                            return (
                              <strong key={cIdx} className="text-white font-semibold">
                                {chunk.slice(2, -2)}
                              </strong>
                            );
                          }
                          return chunk;
                        })}
                      </span>
                    </div>
                  );
                }
                if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                  // Table row
                  const cells = trimmed
                    .split("|")
                    .slice(1, -1)
                    .map((c) => c.trim());
                  if (cells.every((c) => c.match(/^:?-+:?$/))) {
                    return null; // separator row
                  }
                  return (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-zinc-900/60 rounded border border-zinc-850 font-mono text-[11px]">
                      {cells.map((cell, cIdx) => (
                        <div key={cIdx} className="text-zinc-300 truncate">
                          {cell}
                        </div>
                      ))}
                    </div>
                  );
                }
                if (!trimmed) {
                  return <div key={idx} className="h-1" />;
                }
                return (
                  <p key={idx} className="text-zinc-300">
                    {trimmed.split(/(\*\*.*?\*\*)/).map((chunk, cIdx) => {
                      if (chunk.startsWith("**") && chunk.endsWith("**")) {
                        return (
                          <strong key={cIdx} className="text-white font-semibold">
                            {chunk.slice(2, -2)}
                          </strong>
                        );
                      }
                      return chunk;
                    })}
                  </p>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Scientific integrity verified: NPK nutrient recommendations withheld pending certified laboratory testing.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition"
                >
                  Download .md
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
