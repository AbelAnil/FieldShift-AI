"use client";

import BackendStatus from "./BackendStatus";
import { Bell, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NASA Earth Observation Engine</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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

