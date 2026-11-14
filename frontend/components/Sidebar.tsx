"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Satellite,
  FlaskConical,
  Mountain,
  Binary,
  RotateCcw,
  Bot,
  CalendarCheck,
  FileText,
  Sprout,
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "My Farms", href: "/farms", icon: MapPin },
  { name: "Earth Intelligence", href: "/earth-intelligence", icon: Satellite },
  { name: "Soil Intelligence", href: "/soil", icon: FlaskConical },
  { name: "Terrain & Drainage", href: "/terrain", icon: Mountain },
  { name: "Digital Twin", href: "/digital-twin", icon: Binary },
  { name: "Crop Rotation Planner", href: "/rotation", icon: RotateCcw },
  { name: "AI Farm Assistant", href: "/assistant", icon: Bot },
  { name: "Tasks & Reminders", href: "/tasks", icon: CalendarCheck },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 min-h-screen text-zinc-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-zinc-100 tracking-tight flex items-center gap-1.5">
            FieldShift <span className="text-emerald-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">AI</span>
          </h1>
          <p className="text-[11px] text-zinc-400">NASA Space Apps 2026</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Focus region badge */}
      <div className="p-4 border-t border-zinc-800/80">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span>Pilot Region</span>
            <span className="text-emerald-400 font-medium">Active</span>
          </div>
          <div className="font-semibold text-zinc-200">Kerala, India</div>
          <div className="text-[11px] text-zinc-400 mt-1">Tropical Monsoon / Agro-ecological zones</div>
        </div>
      </div>
    </aside>
  );
}
