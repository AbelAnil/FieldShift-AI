"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Satellite,
  Bot,
  Menu,
} from "lucide-react";
import { useUI } from "@/context/UIContext";

const quickNavItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "My Farms", href: "/farms", icon: MapPin },
  { name: "Earth Intel", href: "/earth-intelligence", icon: Satellite },
  { name: "AI Assistant", href: "/assistant", icon: Bot },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { openMobileSidebar } = useUI();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-950/95 backdrop-blur border-t border-zinc-800/80 flex items-stretch h-16 safe-b">
      {quickNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive
                ? "text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}
            />
            <span className="leading-none">{item.name}</span>
          </Link>
        );
      })}

      {/* More button — opens the full sidebar drawer */}
      <button
        onClick={openMobileSidebar}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Open full navigation"
      >
        <Menu className="w-5 h-5" />
        <span className="leading-none">More</span>
      </button>
    </nav>
  );
}
