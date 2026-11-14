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
  loginDemoUser,
  fetchFarms,
  Farm,
  FarmReportResponse,
  fetchFarmReport,
} from "@/lib/api";

export default function ReportsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [token, setToken] = useState<string>("");
  const [report, setReport] = useState<FarmReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const auth = await loginDemoUser(1);
        setToken(auth.access_token);
        const farmsList = await fetchFarms(auth.access_token);
        setFarms(farmsList);

        if (farmsList.length > 0) {
          const defaultFarm = farmsList[0];
          setSelectedFarm(defaultFarm);
          await loadReport(defaultFarm.id, auth.access_token);
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize reports engine");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

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

  const handleSelectFarm = async (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    setSelectedFarm(found);
    await loadReport(found.id, token);
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

        <div className="flex items-center gap-3">
          {farms.length > 0 && (
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => handleSelectFarm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            disabled={!report}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold transition"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? "Copied" : "Copy MD"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!report}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Dossier</span>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
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
                  Certified KAU & NASA Grounding
                </span>
              </div>
            </div>

            {/* Structured Markdown Preview */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-850 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-[600px] overflow-y-auto">
              {report.markdown_report}
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
