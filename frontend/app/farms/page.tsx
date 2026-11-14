"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const FarmMap = dynamic(() => import("@/components/FarmMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
      Loading MapLibre GL Engine...
    </div>
  ),
});
import {
  fetchFarms,
  loginDemoUser,
  createFarm,
  deleteFarm,
  validateGeoJSON,
  Farm,
  User,
} from "@/lib/api";
import {
  MapPin,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  Compass,
  X,
  Droplets,
  Calendar,
} from "lucide-react";

export default function FarmsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [farmerId, setFarmerId] = useState<number>(1);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Drawing States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [farmName, setFarmName] = useState("");
  const [locationName, setLocationName] = useState("Kanjirappally, Kottayam, Kerala");
  const [currentCrop, setCurrentCrop] = useState("Robusta Banana");
  const [plantingDate, setPlantingDate] = useState("2026-06-15");
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("2027-04-20");
  const [irrigationAvailable, setIrrigationAvailable] = useState(true);
  const [farmingPriorities, setFarmingPriorities] = useState("Soil Health & Moisture Retention");
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState<any>(null);
  const [boundaryAreaHa, setBoundaryAreaHa] = useState<number>(0);
  const [boundaryAreaAc, setBoundaryAreaAc] = useState<number>(0);

  // Switch demo farmer
  const switchFarmer = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      setFarmerId(id);
      const authData = await loginDemoUser(id);
      setCurrentUser(authData.user);
      setToken(authData.access_token);
      const farmList = await fetchFarms(authData.access_token);
      setFarms(farmList);
      setSelectedFarm(farmList[0] || null);
    } catch (err: any) {
      setError(err.message || "Failed to load farmer account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    switchFarmer(1);
  }, []);

  const handlePolygonDrawn = (geojson: any, ha: number, ac: number) => {
    setBoundaryGeoJSON(geojson);
    setBoundaryAreaHa(ha);
    setBoundaryAreaAc(ac);
    setIsDrawingMode(false);
    setIsRegisterModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const val = await validateGeoJSON(parsed);
      if (val.is_valid && val.cleaned_geojson) {
        setBoundaryGeoJSON(val.cleaned_geojson);
        setBoundaryAreaHa(val.area_hectares || 0);
        setBoundaryAreaAc(val.area_acres || 0);
        alert(`Valid GeoJSON uploaded! Area: ${val.area_hectares} ha (${val.area_acres} acres)`);
      } else {
        alert(`Invalid GeoJSON: ${val.error}`);
      }
    } catch (err: any) {
      alert(`Error reading file: ${err.message}`);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boundaryGeoJSON) {
      alert("Please draw a boundary polygon or upload a valid GeoJSON file.");
      return;
    }

    setSubmitting(true);
    try {
      const newFarm = await createFarm(
        {
          farm_name: farmName,
          location_name: locationName,
          current_crop: currentCrop,
          planting_date: plantingDate,
          expected_harvest_date: expectedHarvestDate,
          irrigation_available: irrigationAvailable,
          farming_priorities: farmingPriorities,
          boundary_geojson: boundaryGeoJSON,
        },
        token
      );

      setFarms([newFarm, ...farms]);
      setSelectedFarm(newFarm);
      setIsRegisterModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm("Are you sure you want to delete this farm?")) return;
    try {
      await deleteFarm(farmId, token);
      const remaining = farms.filter((f) => f.id !== farmId);
      setFarms(remaining);
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(remaining[0] || null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFarmName("");
    setBoundaryGeoJSON(null);
    setBoundaryAreaHa(0);
    setBoundaryAreaAc(0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Per-User Multi-Tenant Switcher */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Logged in Farmer Account</div>
            <div className="font-bold text-sm text-zinc-100">{currentUser?.name || "Loading..."}</div>
            <div className="text-[11px] text-emerald-400 font-mono">{currentUser?.email}</div>
          </div>
        </div>

        {/* Multi-User Switcher Buttons to test isolation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 hidden md:inline">Test User Isolation:</span>
          <button
            onClick={() => switchFarmer(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              farmerId === 1
                ? "bg-emerald-500 text-zinc-950 font-semibold"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Farmer 1 (Kanjirappally)
          </button>
          <button
            onClick={() => switchFarmer(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              farmerId === 2
                ? "bg-emerald-500 text-zinc-950 font-semibold"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Farmer 2 (Wayanad)
          </button>
        </div>
      </div>

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Phase 1 • Farm Management</div>
          <h1 className="text-2xl font-bold text-white mt-1">Registered Farms & Boundaries</h1>
          <p className="text-sm text-zinc-400">
            PostgreSQL/PostGIS polygon boundaries with geodesic area calculations and MapLibre GL visualization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              if (!isDrawingMode) {
                alert("Drawing mode activated: Click points on the map to trace your field boundary!");
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              isDrawingMode
                ? "bg-amber-500 text-zinc-950"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isDrawingMode ? "Exit Drawing" : "Draw Boundary on Map"}</span>
          </button>

          <button
            onClick={() => {
              setIsRegisterModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Register Farm</span>
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>Interactive Map (MapLibre GL JS) • Click any polygon to inspect farm details</span>
          {isDrawingMode && <span className="text-emerald-400 font-bold animate-pulse">Drawing mode active</span>}
        </div>
        <FarmMap
          farms={farms}
          selectedFarm={selectedFarm}
          onSelectFarm={(f) => setSelectedFarm(f)}
          isDrawingMode={isDrawingMode}
          onPolygonCreated={handlePolygonDrawn}
        />
      </div>

      {/* Farm List & Selected Farm Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left: Farm Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Farms for {currentUser?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {farms.length}
            </span>
          </h2>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Loading registered farms...</div>
          ) : farms.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-sm">
              No farms registered for this farmer yet. Click <strong>Register Farm</strong> or <strong>Draw Boundary</strong> to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farms.map((farm) => {
                const isSelected = selectedFarm?.id === farm.id;
                return (
                  <div
                    key={farm.id}
                    onClick={() => setSelectedFarm(farm)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? "bg-zinc-900/90 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-zinc-100">{farm.farm_name}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="truncate max-w-[200px]">{farm.location_name}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFarm(farm.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
                        title="Delete farm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500">Geodesic Area</div>
                        <div className="font-bold text-emerald-400 mt-0.5">
                          {farm.total_area_hectares} ha
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500">Current Crop</div>
                        <div className="font-semibold text-zinc-200 mt-0.5 truncate">
                          {farm.current_crop || "None"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                      <span>Coordinates: {farm.latitude.toFixed(3)}°N, {farm.longitude.toFixed(3)}°E</span>
                      <span className="text-emerald-400 font-medium">PostGIS Poly</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Farm Detailed Inspector */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Field Dossier</h2>
          {selectedFarm ? (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {selectedFarm.id}
                </span>
                <h3 className="text-lg font-bold text-zinc-100 mt-2">{selectedFarm.farm_name}</h3>
                <p className="text-zinc-400 mt-1">{selectedFarm.location_name}</p>
              </div>

              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Total Hectares:</span>
                  <span className="font-bold text-emerald-400">{selectedFarm.total_area_hectares} ha</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Total Acres:</span>
                  <span className="font-bold text-zinc-200">{selectedFarm.total_area_acres} acres</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Current Crop:</span>
                  <span className="font-semibold text-zinc-200">{selectedFarm.current_crop || "Unspecified"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Planting Window:</span>
                  <span className="text-zinc-300">{selectedFarm.planting_date || "Not set"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400">Irrigation:</span>
                  <span className="text-emerald-400 font-medium">
                    {selectedFarm.irrigation_available ? "Installed & Functional" : "Rainfed Only"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Priority:</span>
                  <span className="text-zinc-200">{selectedFarm.farming_priorities}</span>
                </div>
              </div>

              {selectedFarm.fields && selectedFarm.fields.length > 0 && (
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <div className="font-semibold text-zinc-300">Field Blocks ({selectedFarm.fields.length}):</div>
                  {selectedFarm.fields.map((f) => (
                    <div key={f.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-medium text-zinc-200">
                        <span>{f.field_name}</span>
                        <span className="text-emerald-400">{f.area_hectares} ha</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">{f.current_crop} • {f.notes}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-xs">
              Select a farm from the list or map to view its boundary details.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Farm Registration */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-lg text-white">Register New Agricultural Farm</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kanjirappally Rubber & Cocoa Plot"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Current Crop</label>
                  <input
                    type="text"
                    value={currentCrop}
                    onChange={(e) => setCurrentCrop(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Farming Priorities</label>
                  <select
                    value={farmingPriorities}
                    onChange={(e) => setFarmingPriorities(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Soil Health & Moisture Retention">Soil Health & Moisture</option>
                    <option value="Water Efficiency Priority">Water Efficiency</option>
                    <option value="Balanced Crop Productivity">Balanced Productivity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Planting Date</label>
                  <input
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Expected Harvest</label>
                  <input
                    type="date"
                    value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="irrigation"
                  checked={irrigationAvailable}
                  onChange={(e) => setIrrigationAvailable(e.target.checked)}
                  className="rounded border-zinc-800 text-emerald-500"
                />
                <label htmlFor="irrigation" className="text-zinc-300">
                  Irrigation infrastructure available on field (drip/sprinkler/borewell)
                </label>
              </div>

              {/* Boundary Status / Upload */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Boundary Status:</span>
                  {boundaryGeoJSON ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{boundaryAreaHa} ha ({boundaryAreaAc} acres)</span>
                    </span>
                  ) : (
                    <span className="text-amber-400">Boundary Required</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setIsDrawingMode(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  >
                    Draw on Map
                  </button>
                  <label className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-center cursor-pointer">
                    <input type="file" accept=".geojson,.json" onChange={handleFileUpload} className="hidden" />
                    Upload GeoJSON
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition shadow-lg shadow-emerald-950"
                >
                  {submitting ? "Saving..." : "Save Farm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
