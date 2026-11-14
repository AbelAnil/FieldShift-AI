"use client";

import { useState } from "react";
import BackendStatus from "./BackendStatus";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { loadDemoFarm, resetDemoFarm } from "@/lib/api";
import { Bell, Sparkles, User, MapPin, Menu, Loader2, RotateCcw } from "lucide-react";

export default function Header() {
  const { farmerId, user, farms, selectedFarm, switchFarmer, selectFarm, isBackendOnline } = useAuth();
  const { openMobileSidebar, areaUnit, cycleAreaUnit, uiLanguage, toggleUILanguage } = useUI();
  const [demoLoading, setDemoLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const unitAbbrev: Record<string, string> = { acres: "ac", cents: "ct", hectares: "ha" };

  const handleLoadDemo = async () => {
    try {
      setDemoLoading(true);
      const token = (user as any)?.token || "";
      await loadDemoFarm(token);
      window.location.reload();
    } catch (err) {
      console.error("Failed to load demo farm:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset demo farm back to fresh benchmark state?")) return;
    try {
      setResetLoading(true);
      const token = (user as any)?.token || "";
      await resetDemoFarm(token);
      window.location.reload();
    } catch (err) {
      console.error("Failed to reset demo farm:", err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={openMobileSidebar}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 transition shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full shrink-0">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">NASA Earth Observation Engine</span>
          <span className="sm:hidden text-[11px] font-semibold">FieldShift AI</span>
        </div>

        {/* Global Active Farm Selector (Desktop) */}
        {farms.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => {
                const f = farms.find((item) => item.id === e.target.value);
                if (f) selectFarm(f);
              }}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-zinc-900 text-zinc-200">
                  {f.farm_name} ({f.total_area_acres} ac)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Demo Farm & Reset Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={handleLoadDemo}
            disabled={demoLoading || resetLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-600/50 hover:bg-emerald-950/60 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Load pre-seeded 2.1-acre demo farm"
          >
            {demoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>🌱</span>
            )}
            <span>Demo Farm</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={resetLoading || demoLoading}
            className="p-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:bg-zinc-900 transition disabled:opacity-50"
            title="Reset demo farm to original state"
          >
            {resetLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Units Toggle Pill */}
        <button
          onClick={cycleAreaUnit}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 hover:bg-zinc-700/80 hover:text-white transition"
          title={`Area unit: ${areaUnit}. Click to cycle.`}
        >
          {unitAbbrev[areaUnit] || "ac"}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleUILanguage}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 hover:bg-zinc-700/80 hover:text-white transition"
          title="Toggle language"
        >
          {uiLanguage === "en" ? "EN" : "മല"}
        </button>

        {/* Farmer Switcher */}
        <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
          <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={farmerId}
            onChange={(e) => switchFarmer(parseInt(e.target.value, 10))}
            className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs max-w-[100px] sm:max-w-none truncate"
            title="Switch demo farmer account"
          >
            <option value={1} className="bg-zinc-900 text-zinc-200">
              Thomas (Kanjirappally)
            </option>
            <option value={2} className="bg-zinc-900 text-zinc-200">
              Ananya (Wayanad)
            </option>
          </select>
        </div>

        <BackendStatus />

        <button
          className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          title="Notifications & Tasks"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>
    </header>
  );
}
