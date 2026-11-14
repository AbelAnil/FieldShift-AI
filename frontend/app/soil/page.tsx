"use client";

import { useEffect, useState } from "react";
import {
  fetchFarmSoilAnalysis,
  recordFarmerSoilTest,
  Farm,
  SoilAnalysisResponse,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Info,
  MapPin,
  X,
  ShieldCheck,
  Layers,
} from "lucide-react";

export default function SoilIntelligencePage() {
  const { farms, selectedFarm, selectFarm, token, isBackendOnline } = useAuth();
  const [soilData, setSoilData] = useState<SoilAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Lab Test Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phInput, setPhInput] = useState(6.2);
  const [nInput, setNInput] = useState<number | string>(280);
  const [pInput, setPInput] = useState<number | string>(22);
  const [kInput, setKInput] = useState<number | string>(195);
  const [ocInput, setOcInput] = useState<number | string>(2.3);
  const [textureInput, setTextureInput] = useState("Clay Loam");
  const [labNameInput, setLabNameInput] = useState("Krishi Bhavan Soil Testing Lab, Kottayam");

  const loadSoil = async (farmId: string, authToken: string) => {
    setRefreshing(true);
    try {
      const data = await fetchFarmSoilAnalysis(farmId, authToken);
      setSoilData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedFarm && token) {
      loadSoil(selectedFarm.id, token);
    }
  }, [selectedFarm, token]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = farms.find((f) => f.id === e.target.value);
    if (matched) {
      selectFarm(matched);
    }
  };

  const handleSubmitLabTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm || !token) return;

    setSubmitting(true);
    try {
      await recordFarmerSoilTest(
        selectedFarm.id,
        {
          ph: Number(phInput),
          nitrogen: nInput ? Number(nInput) : null,
          phosphorus: pInput ? Number(pInput) : null,
          potassium: kInput ? Number(kInput) : null,
          organic_carbon: ocInput ? Number(ocInput) : null,
          texture: textureInput,
          lab_name: labNameInput,
          measurement_date: new Date().toISOString().slice(0, 10),
        },
        token
      );
      setIsModalOpen(false);
      await loadSoil(selectedFarm.id, token);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 3 • Soil Intelligence
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Soil Properties & Nutrient Health</h1>
          <p className="text-sm text-zinc-400">
            Combines farmer laboratory soil test measurements with ISRIC SoilGrids 250m modelled estimates.
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Enter Lab Soil Test</span>
          </button>
        </div>
      </div>

      {/* Scientific Integrity Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-300">Scientific Soil Policy:</span>
          <p className="text-amber-200/90 leading-relaxed">
            ISRIC SoilGrids values are global statistical estimates at 250m grid resolution. NPK nutrient deficiency
            calculations are strictly suppressed until physical laboratory soil test records are uploaded by the farmer.
          </p>
        </div>
      </div>

      {/* Main Soil Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Effective Soil Profile */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <span>Active Field Soil Profile</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                soilData?.has_lab_test
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {soilData?.data_source_used}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[11px]">Soil pH (H2O)</span>
              <div className="text-2xl font-bold text-emerald-400">{soilData?.effective_ph ?? "--"}</div>
              <div className="text-[11px] text-zinc-400 font-medium">{soilData?.ph_category}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[11px]">Soil Texture Class</span>
              <div className="text-2xl font-bold text-white">{soilData?.effective_texture ?? "--"}</div>
              <div className="text-[11px] text-zinc-400">USDA Classification</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[11px]">Organic Carbon (SOC)</span>
              <div className="text-2xl font-bold text-white">
                {soilData?.organic_carbon_pct ?? "--"} <span className="text-xs font-normal text-zinc-400">%</span>
              </div>
              <div className="text-[11px] text-emerald-400">High Organic Content</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[11px]">Assessment Completeness</span>
              <div className="text-2xl font-bold text-cyan-400">{soilData?.assessment_completeness_pct ?? "--"}%</div>
              <div className="text-[11px] text-zinc-400">
                {soilData?.has_lab_test ? "Verified by Lab" : "Modelled Baseline"}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Agronomic Recommendation:</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">{soilData?.ph_recommendation}</p>
          </div>
        </div>

        {/* NPK Status & Missing Tests Inspector */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Nutrient Telemetry (NPK)</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                soilData?.has_lab_test
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-amber-950 text-amber-400 border border-amber-800/60"
              }`}
            >
              {soilData?.npk_status.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <span className="text-zinc-500 font-bold">Nitrogen (N)</span>
              <div className="text-lg font-bold text-white">
                {soilData?.npk_status.available_n_kg_ha != null
                  ? `${soilData.npk_status.available_n_kg_ha} kg/ha`
                  : "--"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <span className="text-zinc-500 font-bold">Phosphorus (P)</span>
              <div className="text-lg font-bold text-white">
                {soilData?.npk_status.available_p_kg_ha != null
                  ? `${soilData.npk_status.available_p_kg_ha} kg/ha`
                  : "--"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <span className="text-zinc-500 font-bold">Potassium (K)</span>
              <div className="text-lg font-bold text-white">
                {soilData?.npk_status.available_k_kg_ha != null
                  ? `${soilData.npk_status.available_k_kg_ha} kg/ha`
                  : "--"}
              </div>
            </div>
          </div>

          {soilData?.npk_status.warning ? (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{soilData.npk_status.warning}</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Physical soil nutrient measurements verified against Krishi Bhavan soil test standards.</span>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-300">Actionable Soil Tasks:</span>
            <ul className="space-y-1 text-zinc-400 text-[11px] list-disc list-inside">
              {soilData?.suggested_actions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Lab Soil Test Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-lg text-white">Record Laboratory Soil Test</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLabTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Soil pH (H2O) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="10.0"
                    required
                    value={phInput}
                    onChange={(e) => setPhInput(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Soil Texture</label>
                  <select
                    value={textureInput}
                    onChange={(e) => setTextureInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Clay Loam">Clay Loam (Laterite)</option>
                    <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Loam">Loam</option>
                    <option value="Clay">Clay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Available N (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    value={nInput}
                    onChange={(e) => setNInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Available P (kg/ha)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pInput}
                    onChange={(e) => setPInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Available K (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    value={kInput}
                    onChange={(e) => setKInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Organic Carbon (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ocInput}
                    onChange={(e) => setOcInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Testing Lab Name</label>
                  <input
                    type="text"
                    value={labNameInput}
                    onChange={(e) => setLabNameInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition shadow-lg shadow-emerald-950"
                >
                  {submitting ? "Saving..." : "Save Test Results"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
