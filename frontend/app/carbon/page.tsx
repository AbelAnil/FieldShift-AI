"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  ShieldCheck,
  Trees,
  Droplets,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Plus,
  RefreshCw,
  Building2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Info,
  Calendar,
  X,
} from "lucide-react";
import {
  loginDemoUser,
  fetchFarms,
  Farm,
  CarbonPathway,
  CarbonPartner,
  EligibilityResult,
  CarbonEstimateData,
  CarbonEvidenceItem,
  fetchCarbonPathways,
  fetchCarbonPartners,
  screenCarbonEligibility,
  fetchCarbonEstimate,
  fetchCarbonEvidence,
  recordCarbonEvidence,
  fetchCarbonDossier,
} from "@/lib/api";

export default function CarbonCreditsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [token, setToken] = useState<string>("");
  const [pathways, setPathways] = useState<CarbonPathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string>("agroforestry");
  const [partners, setPartners] = useState<CarbonPartner[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [estimate, setEstimate] = useState<CarbonEstimateData | null>(null);
  const [evidenceList, setEvidenceList] = useState<CarbonEvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screener inputs
  const [treeDensity, setTreeDensity] = useState<number>(50);
  const [hasWaterControl, setHasWaterControl] = useState<boolean>(true);
  const [practicesCoverCrops, setPracticesCoverCrops] = useState<boolean>(true);

  // Financial sliders
  const [carbonPrice, setCarbonPrice] = useState<number>(15.0);
  const [commissionPct, setCommissionPct] = useState<number>(30.0);

  // New evidence form
  const [evType, setEvType] = useState<string>("planting_record");
  const [evTitle, setEvTitle] = useState<string>("");
  const [evDesc, setEvDesc] = useState<string>("");

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const auth = await loginDemoUser(1);
        setToken(auth.access_token);

        const [farmsList, pathwaysList, partnersList] = await Promise.all([
          fetchFarms(auth.access_token),
          fetchCarbonPathways(),
          fetchCarbonPartners(),
        ]);

        setFarms(farmsList);
        setPathways(pathwaysList);
        setPartners(partnersList);

        if (farmsList.length > 0) {
          const defaultFarm = farmsList[0];
          setSelectedFarm(defaultFarm);
          await loadFarmCarbonContext(defaultFarm.id, "agroforestry", auth.access_token, 15.0, 30.0);
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize carbon module");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  async function loadFarmCarbonContext(
    farmId: string,
    pathwayId: string,
    userToken: string,
    price: number,
    commission: number,
  ) {
    try {
      setError(null);
      // Run screening & estimate in parallel
      const [eligRes, estRes, evRes] = await Promise.all([
        screenCarbonEligibility(
          {
            farm_id: farmId,
            pathway: pathwayId,
            tree_density_per_acre: treeDensity,
            has_water_regime_control: hasWaterControl,
            practices_mulching_or_cover_crops: practicesCoverCrops,
          },
          userToken,
        ),
        fetchCarbonEstimate(farmId, userToken, pathwayId, price, commission),
        fetchCarbonEvidence(farmId, userToken),
      ]);

      setEligibility(eligRes);
      setEstimate(estRes);
      setEvidenceList(evRes);
    } catch (err: any) {
      setError(err.message || "Failed to load farm carbon data");
    }
  }

  const handleSelectFarm = async (farmId: string) => {
    const found = farms.find((f) => f.id === farmId);
    if (!found) return;
    setSelectedFarm(found);
    await loadFarmCarbonContext(found.id, selectedPathway, token, carbonPrice, commissionPct);
  };

  const handleSelectPathway = async (pathwayId: string) => {
    setSelectedPathway(pathwayId);
    if (selectedFarm) {
      await loadFarmCarbonContext(selectedFarm.id, pathwayId, token, carbonPrice, commissionPct);
    }
  };

  const handleRunScreening = async () => {
    if (!selectedFarm) return;
    try {
      setIsScreening(true);
      const [eligRes, estRes] = await Promise.all([
        screenCarbonEligibility(
          {
            farm_id: selectedFarm.id,
            pathway: selectedPathway,
            tree_density_per_acre: treeDensity,
            has_water_regime_control: hasWaterControl,
            practices_mulching_or_cover_crops: practicesCoverCrops,
          },
          token,
        ),
        fetchCarbonEstimate(selectedFarm.id, token, selectedPathway, carbonPrice, commissionPct),
      ]);
      setEligibility(eligRes);
      setEstimate(estRes);
    } catch (err: any) {
      setError(err.message || "Screening failed");
    } finally {
      setIsScreening(false);
    }
  };

  const handleSliderChange = async (price: number, comm: number) => {
    setCarbonPrice(price);
    setCommissionPct(comm);
    if (selectedFarm) {
      try {
        const est = await fetchCarbonEstimate(selectedFarm.id, token, selectedPathway, price, comm);
        setEstimate(est);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !selectedFarm) return;

    try {
      const recorded = await recordCarbonEvidence(
        selectedFarm.id,
        {
          pathway: selectedPathway,
          evidence_type: evType,
          title: evTitle.trim(),
          description: evDesc.trim() || undefined,
        },
        token,
      );
      setEvidenceList((prev) => [recorded, ...prev]);
      setIsEvidenceModalOpen(false);
      setEvTitle("");
      setEvDesc("");
    } catch (err: any) {
      setError(err.message || "Failed to record evidence");
    }
  };

  const handleExportDossier = async () => {
    if (!selectedFarm) return;
    try {
      const dossier = await fetchCarbonDossier(selectedFarm.id, token);
      const blob = new Blob([dossier.markdown_pack], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Carbon_Readiness_Dossier_${selectedFarm.farm_name.replace(/\s+/g, "_")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export dossier");
    }
  };

  const getPathwayIcon = (id: string) => {
    switch (id) {
      case "agroforestry":
        return <Trees className="w-5 h-5 text-emerald-400" />;
      case "rice_methane":
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case "soil_carbon":
        return <Layers className="w-5 h-5 text-amber-400" />;
      case "nitrogen":
        return <Zap className="w-5 h-5 text-purple-400" />;
      default:
        return <Coins className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 9 • Carbon Intelligence</div>
          <h1 className="text-2xl font-bold text-white mt-1">Carbon Credit Readiness & Filing Assistant</h1>
          <p className="text-sm text-zinc-400">
            Eligibility screening, realistic yield modeling, and aggregation packaging for Kerala agricultural holdings.
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
                  {f.farm_name} ({f.location_name})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleExportDossier}
            disabled={!selectedFarm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-950/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Aggregation Pack</span>
          </button>
        </div>
      </div>

      {/* Honest Scope & Safeguards Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Non-Guaranteed Indicative Estimates:</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              FieldShift AI does not issue carbon credits. Smallholdings in Kerala generate small volumes; viable filing requires collective aggregation via FPOs. Estimates reflect conservative IPCC and Verra methodology yields.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span>Standards: Verra VM0042 • UNFCCC CDM</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Pathway Selection Grid */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Candidate Practice Pathways (Kerala-Specific)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {pathways.map((p) => {
            const isSelected = selectedPathway === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPathway(p.id)}
                className={`text-left p-4 rounded-2xl border transition duration-150 flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-zinc-900 border-emerald-500 shadow-md shadow-emerald-950/30"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700">
                    {getPathwayIcon(p.id)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {p.methodology_code.split(" / ")[0]}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-zinc-100">{p.name}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Yield:</span>
                  <span className="text-emerald-400 font-semibold">{p.yield_tco2e_per_ha_range}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Eligibility Screener + Financial Yield Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Eligibility & Readiness Screener */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-base">Methodology Eligibility Screener</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluates {selectedFarm?.farm_name} against {selectedPathway.replace("_", " ")} criteria.
                </p>
              </div>

              {eligibility && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">
                      {eligibility.readiness_score.toFixed(0)}%
                    </div>
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Readiness Score</div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-xl uppercase font-mono border ${
                      eligibility.status === "eligible"
                        ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                        : eligibility.status === "conditionally_eligible"
                        ? "bg-amber-950/80 border-amber-800 text-amber-300"
                        : "bg-red-950/80 border-red-800 text-red-300"
                    }`}
                  >
                    {eligibility.status.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>

            {/* Screener Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
              {selectedPathway === "agroforestry" && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Tree Density (stems/acre)</label>
                  <input
                    type="number"
                    value={treeDensity}
                    onChange={(e) => setTreeDensity(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {selectedPathway === "rice_methane" && (
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Water Inlet Control</label>
                  <button
                    onClick={() => setHasWaterControl(!hasWaterControl)}
                    className={`w-full py-1.5 px-3 rounded-xl font-medium transition ${
                      hasWaterControl
                        ? "bg-cyan-950 border border-cyan-800 text-cyan-300"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {hasWaterControl ? "Inlet/Drain Gate Active" : "Uncontrolled Inflow"}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Cover Crops / Mulching</label>
                <button
                  onClick={() => setPracticesCoverCrops(!practicesCoverCrops)}
                  className={`w-full py-1.5 px-3 rounded-xl font-medium transition ${
                    practicesCoverCrops
                      ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                  }`}
                >
                  {practicesCoverCrops ? "Active Cover Cropping" : "Clean Cultivation"}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunScreening}
                  disabled={isScreening}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isScreening ? "animate-spin" : ""}`} />
                  <span>Re-Screen</span>
                </button>
              </div>
            </div>

            {/* Checklist Results */}
            {eligibility && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                  <div className="font-semibold text-emerald-400 mb-0.5">Methodology Guidance:</div>
                  <p className="leading-relaxed">{eligibility.guidance}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Requirements Met */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Requirements Satisfied ({eligibility.requirements_met.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {eligibility.requirements_met.map((req, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-zinc-300 flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">•</span>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements Missing */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Action Items to Qualify ({eligibility.requirements_missing.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {eligibility.requirements_missing.length > 0 ? (
                        eligibility.requirements_missing.map((req, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-zinc-300 flex items-start gap-2">
                            <span className="text-amber-400 font-bold shrink-0">•</span>
                            <span>{req}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 rounded-xl bg-zinc-900 text-zinc-500 text-[11px]">
                          All primary criteria satisfied. Ready for FPO aggregator intake.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Registry & Gap Analysis */}
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Carbon Evidence Ledger</h3>
                <p className="text-xs text-zinc-400">Auditable proof repository required by third-party MRV verifiers.</p>
              </div>

              <button
                onClick={() => setIsEvidenceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Evidence</span>
              </button>
            </div>

            <div className="space-y-2">
              {evidenceList.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-950 border border-zinc-800">
                  No evidence uploaded yet. Add nursery purchase receipts, geotagged photos, or soil certificates.
                </div>
              ) : (
                evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">{ev.title}</div>
                      {ev.description && <div className="text-[11px] text-zinc-400 mt-0.5">{ev.description}</div>}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
                        <span className="uppercase">{ev.evidence_type.replace("_", " ")}</span>
                        <span>•</span>
                        <span>Recorded: {ev.recorded_at}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold uppercase">
                      {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Indicative Financial Yield & Aggregator Directory */}
        <div className="lg:col-span-5 space-y-6">
          {/* Yield & Revenue Card */}
          {estimate && (
            <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 space-y-5">
              <div className="border-b border-zinc-800 pb-3">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                  IPCC Tier 1/2 Benchmark Model
                </div>
                <h3 className="font-bold text-white text-base mt-0.5">Indicative Yield & Revenue Range</h3>
                <p className="text-xs text-zinc-400">
                  For {estimate.area_acres.toFixed(1)} acres ({estimate.area_hectares.toFixed(2)} ha)
                </p>
              </div>

              {/* Conservative / Expected / High Yield Tiles */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Conservative</div>
                  <div className="text-base font-bold text-zinc-300 mt-1">
                    {estimate.conservative_tco2e_yr.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">tCO2e/yr</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 shadow-sm">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Expected</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {estimate.expected_tco2e_yr.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">tCO2e/yr</div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">High Potential</div>
                  <div className="text-base font-bold text-zinc-300 mt-1">
                    {estimate.high_tco2e_yr.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">tCO2e/yr</div>
                </div>
              </div>

              {/* Sliders for Simulation */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between text-zinc-300 font-medium mb-1">
                    <span>Assumed Voluntary Market Price:</span>
                    <span className="font-mono text-emerald-400 font-bold">${carbonPrice.toFixed(0)} / ton</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="1"
                    value={carbonPrice}
                    onChange={(e) => handleSliderChange(parseFloat(e.target.value), commissionPct)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>$10/t (Base)</span>
                    <span>$20/t (Premium)</span>
                    <span>$35/t (High Removal)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-zinc-300 font-medium mb-1">
                    <span>FPO / Aggregator Fee Share:</span>
                    <span className="font-mono text-amber-400 font-bold">{commissionPct.toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="45"
                    step="5"
                    value={commissionPct}
                    onChange={(e) => handleSliderChange(carbonPrice, parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>20% (Co-op)</span>
                    <span>30% (Standard FPO)</span>
                    <span>45% (Full MRV Developer)</span>
                  </div>
                </div>
              </div>

              {/* Net Farmer Revenue Range in INR */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-800/80 space-y-2">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                  Projected Net Annual Return (Farmer Share)
                </div>
                <div className="text-2xl font-bold text-white">
                  ₹{estimate.net_farmer_inr_range.low.toLocaleString()} – ₹{estimate.net_farmer_inr_range.high.toLocaleString()}
                  <span className="text-xs text-zinc-400 font-normal"> / year</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Expected: ₹{estimate.net_farmer_inr_range.expected.toLocaleString()} / year (after {commissionPct}% fee)
                </div>
              </div>

              {/* Economic Reality Callout */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                <p>{estimate.economic_reality_note}</p>
              </div>
            </div>
          )}

          {/* Aggregator Directory */}
          <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Accredited Aggregators for Kerala</span>
            </div>

            <div className="space-y-3">
              {partners.map((pt) => (
                <div
                  key={pt.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{pt.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {pt.partner_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{pt.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                    <span>{pt.location}</span>
                    <span className="text-emerald-400">Fee: {pt.typical_commission_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Evidence Item */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Record Carbon Evidence Document</h3>
              <button onClick={() => setIsEvidenceModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Evidence Type</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="planting_record">Planting Date / Tree Stem Count</option>
                  <option value="soil_test">Physical Soil Lab Certificate (SOC %)</option>
                  <option value="geotagged_photo">Geotagged Photo of Mulch / Trees</option>
                  <option value="water_log">AWD Paddy Aeration & Drainage Log</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="e.g. Krishi Bhavan certified soil carbon test report"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description & Metadata</label>
                <textarea
                  rows={3}
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="Sample depth, test date, laboratory name, or species inventory details..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!evTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold transition"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
