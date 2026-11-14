"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export type AreaUnit = "acres" | "hectares" | "cents";
export type UILanguage = "en" | "ml";

export interface FormattedArea {
  formatted: string;
  value: number;
  unit: string;
  unitLabel: string;
}

interface UIContextType {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;

  // Local Units Toggle (acres, hectares, Kerala cents)
  areaUnit: AreaUnit;
  setAreaUnit: (unit: AreaUnit) => void;
  cycleAreaUnit: () => void;
  formatArea: (hectares: number, acres?: number) => FormattedArea;

  // Global UI Language Switcher (English / Malayalam)
  uiLanguage: UILanguage;
  setUILanguage: (lang: UILanguage) => void;
  toggleUILanguage: () => void;
  t: (key: string, defaultText?: string) => string;

  // Active Context Grounding
  selectedFarmId: string | null;
  setSelectedFarmId: (id: string | null) => void;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
}

const UI_DICTIONARY: Record<string, Record<UILanguage, string>> = {
  // Navigation
  "nav.overview": { en: "Overview", ml: "അവലോകനം (Overview)" },
  "nav.my_farms": { en: "My Farms", ml: "എന്റെ കൃഷിയിടങ്ങൾ (My Farms)" },
  "nav.earth_intel": { en: "Earth Intelligence", ml: "ഭൗമ കാലാവസ്ഥ (Earth Data)" },
  "nav.soil_intel": { en: "Soil Intelligence", ml: "മണ്ണ് ഗുണമേന്മ (Soil Intel)" },
  "nav.terrain": { en: "Terrain & Drainage", ml: "ഭൂപ്രകൃതിയും ഡ്രെയിനേജും (Terrain)" },
  "nav.digital_twin": { en: "Digital Twin", ml: "ഡിജിറ്റൽ ഇരട്ട മാതൃക (Digital Twin)" },
  "nav.rotation": { en: "Crop Rotation Planner", ml: "വിള പരിക്രമണ പ്ലാനർ (Rotation)" },
  "nav.assistant": { en: "AI Farm Assistant", ml: "എഐ കാർഷിക ഉപദേശകൻ (AI Assistant)" },
  "nav.tasks": { en: "Tasks & Reminders", ml: "കൃഷി ജോലികൾ (Tasks)" },
  "nav.carbon": { en: "Carbon Credits", ml: "കാർബൺ ക്രെഡിറ്റ് (Carbon Credits)" },
  "nav.integrated_farming": { en: "Integrated Farming", ml: "സംയോജിത കൃഷി (Integrated Farming)" },
  "nav.reports": { en: "Farm Dossier Reports", ml: "ഫാം റിപ്പോർട്ടുകൾ (Reports)" },
  "nav.attribution": { en: "Scientific Attribution", ml: "ഡാറ്റാ കടപ്പാടുകൾ (Attribution)" },

  // Actions
  "btn.load_demo": { en: "Load Demo Farm", ml: "ഡെമോ ഫാം ലോഡ് ചെയ്യുക" },
  "btn.reset_demo": { en: "Reset Demo", ml: "ഡെമോ പുനഃസജ്ജീകരിക്കുക" },
  "btn.simulate": { en: "Run What-If Simulation", ml: "സാഹചര്യ സിമുലേഷൻ നടത്തുക" },
  "btn.add_farm": { en: "Register Farm", ml: "പുതിയ കൃഷിയിടം ചേർക്കുക" },

  // Badges & Status
  "status.live": { en: "Live Satellite Feed", ml: "ലൈവ് ഉപഗ്രഹ വിവരങ്ങൾ" },
  "status.cached": { en: "Cached Telemetry", ml: "സംഭരിച്ച ഉപഗ്രഹ വിവരങ്ങൾ" },
  "status.sample": { en: "Regional Model", ml: "പ്രാദേശിക മാതൃക" },
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>("acres");
  const [uiLanguage, setUILanguageState] = useState<UILanguage>("en");
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const pathname = usePathname();

  // Load saved preferences from localStorage if present
  useEffect(() => {
    try {
      const savedUnit = localStorage.getItem("fieldshift_area_unit") as AreaUnit;
      if (savedUnit && ["acres", "hectares", "cents"].includes(savedUnit)) {
        setAreaUnitState(savedUnit);
      }
      const savedLang = localStorage.getItem("fieldshift_ui_lang") as UILanguage;
      if (savedLang && ["en", "ml"].includes(savedLang)) {
        setUILanguageState(savedLang);
      }
    } catch {}
  }, []);

  const setAreaUnit = (unit: AreaUnit) => {
    setAreaUnitState(unit);
    try {
      localStorage.setItem("fieldshift_area_unit", unit);
    } catch {}
  };

  const cycleAreaUnit = () => {
    const next: Record<AreaUnit, AreaUnit> = {
      acres: "cents",
      cents: "hectares",
      hectares: "acres",
    };
    setAreaUnit(next[areaUnit]);
  };

  const setUILanguage = (lang: UILanguage) => {
    setUILanguageState(lang);
    try {
      localStorage.setItem("fieldshift_ui_lang", lang);
    } catch {}
  };

  const toggleUILanguage = () => {
    setUILanguage(uiLanguage === "en" ? "ml" : "en");
  };

  const t = (key: string, defaultText?: string): string => {
    const entry = UI_DICTIONARY[key];
    if (entry && entry[uiLanguage]) {
      return entry[uiLanguage];
    }
    return defaultText || key;
  };

  /**
   * Converts hectares/acres to the currently active unit:
   * - Hectares: direct or acres / 2.471
   * - Acres: direct or ha * 2.47105
   * - Cents (Kerala traditional measure: 100 cents = 1 acre, 1 ha = 247.1 cents)
   */
  const formatArea = (hectares: number, acres?: number): FormattedArea => {
    const safeHa = Number(hectares) || 0;
    const safeAc = acres !== undefined ? Number(acres) : safeHa * 2.47105;

    switch (areaUnit) {
      case "hectares":
        return {
          value: Number(safeHa.toFixed(2)),
          unit: "ha",
          unitLabel: "Hectares",
          formatted: `${safeHa.toFixed(2)} ha`,
        };
      case "cents": {
        const cents = safeAc * 100.0;
        return {
          value: Number(cents.toFixed(1)),
          unit: "cents",
          unitLabel: "Kerala Cents (100 ct = 1 ac)",
          formatted: `${cents.toFixed(1)} cents`,
        };
      }
      case "acres":
      default:
        return {
          value: Number(safeAc.toFixed(2)),
          unit: "ac",
          unitLabel: "Acres",
          formatted: `${safeAc.toFixed(2)} acres`,
        };
    }
  };

  // Automatically close mobile sidebar whenever route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  return (
    <UIContext.Provider
      value={{
        isMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        toggleMobileSidebar,
        areaUnit,
        setAreaUnit,
        cycleAreaUnit,
        formatArea,
        uiLanguage,
        setUILanguage,
        toggleUILanguage,
        t,
        selectedFarmId,
        setSelectedFarmId,
        selectedFieldId,
        setSelectedFieldId,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
