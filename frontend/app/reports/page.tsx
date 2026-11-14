import { FileText, Download, ShieldCheck } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 8 • Reporting</div>
        <h1 className="text-2xl font-bold text-white mt-1">Farm Reports & Compliance Exports</h1>
        <p className="text-sm text-zinc-400">Downloadable agricultural decision reports with data provenance and scientific references.</p>
      </div>

      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100">Kanjirappally Farm Decision Dossier</h3>
            <p className="text-xs text-zinc-400">Complete summary: NASA Earth Data, Soil Profile, Suitability & 3 Rotation Strategies</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Includes Data Provenance & Limitation Disclaimers:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>NASA GPM IMERG 10km precipitation trends & anomaly index</li>
            <li>ISRIC SoilGrids 250m modelled parameters vs. missing lab NPK</li>
            <li>WhiteboxTools topographic wetness index and slope gradient</li>
            <li>Kerala Agricultural University (KAU) crop calendar alignment</li>
          </ul>
        </div>

        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-500 font-medium text-xs cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF Report (Activated in Phase 8)</span>
        </button>
      </div>
    </div>
  );
}
