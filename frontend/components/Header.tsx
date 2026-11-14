"use client";

import BackendStatus from "./BackendStatus";
import { useAuth } from "@/context/AuthContext";
import { Bell, Sparkles, User, MapPin, ChevronDown } from "lucide-react";

export default function Header() {
  const { farmerId, user, farms, selectedFarm, switchFarmer, selectFarm, isBackendOnline } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NASA Earth Observation Engine</span>
          <span className="sm:hidden">FieldShift AI</span>
        </div>

        {/* Global Active Farm Selector */}
        {farms.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => {
                const f = farms.find((item) => item.id === e.target.value);
                if (f) selectFarm(f);
              }}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
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

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Farmer Switcher */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
          <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={farmerId}
            onChange={(e) => switchFarmer(parseInt(e.target.value, 10))}
            className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs"
            title="Switch demo farmer account"
          >
            <option value={1} className="bg-zinc-900 text-zinc-200">
              Thomas Anil (Kanjirappally)
            </option>
            <option value={2} className="bg-zinc-900 text-zinc-200">
              Ananya Nair (Wayanad)
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
