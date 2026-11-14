"use client";

import {
  Scale,
  ExternalLink,
  ShieldCheck,
  Database,
  MapPin,
  Satellite,
  FlaskConical,
  BookOpen,
  Award,
} from "lucide-react";

interface AttributionEntry {
  category: string;
  sourceName: string;
  provider: string;
  license: string;
  url: string;
  usageDescription: string;
  mandatoryNotice?: string;
}

const ATTRIBUTION_REGISTRY: AttributionEntry[] = [
  {
    category: "Satellite Earth Observations",
    sourceName: "NASA GPM IMERG (Integrated Multi-satellitE Retrievals for GPM)",
    provider: "NASA Precipitation Processing System (PPS) / Goddard Space Flight Center",
    license: "NASA Open Data Policy (Public Domain / Free & Open)",
    url: "https://gpm.nasa.gov/data/imerg",
    usageDescription:
      "Provides daily precipitation estimates, 7-day cumulative rainfall series, heavy rainfall event detection (>40mm/day), and climate risk alerts across farm boundaries at 0.1° (~10 km) resolution.",
    mandatoryNotice: "Data provided by the NASA Global Precipitation Measurement (GPM) mission.",
  },
  {
    category: "Satellite Earth Observations",
    sourceName: "NASA POWER (Prediction of Worldwide Energy Resources)",
    provider: "NASA Langley Research Center",
    license: "NASA Open Data Policy (Free & Open Access)",
    url: "https://power.larc.nasa.gov",
    usageDescription:
      "Supplies daily agroclimatology telemetry: 2-meter air temperature (T2M max/min/mean), surface solar irradiance (ALLSKY_SFC_SW_DWN), and relative humidity (RH2M) for growing degree day modeling and 30-year climatological normal baselines.",
  },
  {
    category: "Satellite Earth Observations",
    sourceName: "NASA SMAP (Soil Moisture Active Passive) L4 Global Enhanced",
    provider: "NASA Jet Propulsion Laboratory (JPL) & GSFC",
    license: "NASA Open Data Policy",
    url: "https://smap.jpl.nasa.gov",
    usageDescription:
      "Provides coarse regional surface (0–5 cm) and root-zone (0–100 cm) soil moisture context (~9 km gridded product) to evaluate landscape-scale wetness and drought anomalies.",
    mandatoryNotice: "SMAP data used as a regional context indicator, not as an in-situ farm sensor.",
  },
  {
    category: "Multispectral Canopy Imagery",
    sourceName: "Landsat 8/9 OLI-2 & Sentinel-2 MSI (Copernicus)",
    provider: "NASA / USGS & European Space Agency (ESA Copernicus Program)",
    license: "Open Access (USGS Public Domain / Copernicus Open Access Policy)",
    url: "https://landsat.gsfc.nasa.gov",
    usageDescription:
      "Multi-spectral surface reflectance utilized to calculate NDVI (Normalized Difference Vegetation Index) for canopy vigor and NDMI (Normalized Difference Moisture Index) for crop canopy hydration.",
  },
  {
    category: "Global Soil Grids",
    sourceName: "ISRIC SoilGrids 250m v2.0",
    provider: "ISRIC — World Soil Information (Wageningen, Netherlands)",
    license: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://www.isric.org/explore/soilgrids",
    usageDescription:
      "Provides high-resolution (250m) machine-learned predictions of soil pH in water, soil organic carbon (SOC g/kg), sand/silt/clay fractions, bulk density, and cation exchange capacity (CEC) at 0–30 cm depth intervals as a baseline before physical farmer soil tests are registered.",
    mandatoryNotice:
      "SoilGrids 250m is a global automated digital soil mapping product developed by ISRIC — World Soil Information. Licensed under CC BY 4.0.",
  },
  {
    category: "Mapping & Geospatial Basemaps",
    sourceName: "OpenStreetMap (OSM) & CARTO Dark Matter",
    provider: "OpenStreetMap Contributors & CARTO",
    license: "Open Data Commons Open Database License (ODbL) / CC BY 3.0",
    url: "https://www.openstreetmap.org",
    usageDescription:
      "Provides basemap tiles, roads, waterbodies, and administrative boundaries for farm field delineation and regional cartography.",
    mandatoryNotice: "© OpenStreetMap contributors. Basemap tiles courtesy of CARTO.",
  },
  {
    category: "Client-Side Vector Engine",
    sourceName: "MapLibre GL JS & Terra Draw",
    provider: "MapLibre Organization & Open Source Contributors",
    license: "BSD 3-Clause License & MIT License",
    url: "https://maplibre.org",
    usageDescription:
      "Powers browser-based WebGL/WebGPU hardware-accelerated interactive polygon boundary drawing, field segmentation, contour visualization, and centroid calculation.",
  },
  {
    category: "Agronomic Standards & Extension Research",
    sourceName: "Kerala Agricultural University (KAU) — Package of Practices (POP)",
    provider: "Kerala Agricultural University, Vellanikkara, Thrissur",
    license: "Public Government Agricultural Extension Research (India)",
    url: "http://celkau.in",
    usageDescription:
      "Provides authoritative crop calendars, monsoon planting windows (Virippu, Mundakan, Puncha), crop water requirements, companion planting guidelines, and pest interruption sequences tailored to Kerala's agro-ecological zones.",
  },
  {
    category: "Agronomic Standards & Extension Research",
    sourceName: "ICAR (Indian Council of Agricultural Research) & FAO EcoCrop",
    provider: "ICAR-CTCRI / ICAR-IISR & Food and Agriculture Organization (FAO)",
    license: "Open Agricultural Knowledge & Global Research Databases",
    url: "https://icar.org.in",
    usageDescription:
      "Crop temperature ranges, soil pH tolerances, root depth profiles, and biological nitrogen fixation coefficients (+40 to +50 kg N/ha for Vigna unguiculata cowpea / green gram) used by the suitability evaluation engine.",
  },
];

export default function AttributionPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Scale className="w-4 h-4" />
          <span>Scientific Transparency & Open Science Governance</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Scientific Data Attribution & Open Licensure</h1>
        <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
          FieldShift is engineered on open-access Earth observations, global digital soil mapping, open-source cartography, and peer-reviewed agronomic research. We gratefully credit the scientific missions and data repositories powering this platform.
        </p>
      </div>

      {/* Core Principles Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <Satellite className="w-4 h-4" />
            <span>NASA Open Data Policy</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All satellite data (GPM, POWER, SMAP, Landsat) accessed without cost per NASA's free and open data sharing policy.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
            <FlaskConical className="w-4 h-4" />
            <span>ISRIC SoilGrids CC BY 4.0</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Soil physical & chemical estimations explicitly cited and credited under Creative Commons Attribution 4.0 International.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>Local Agronomic Rigor</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Rotation models and seasonal calendars grounded in Kerala Agricultural University (KAU) and ICAR published guidelines.
          </p>
        </div>
      </div>

      {/* Attribution Table / Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Complete Data Source & Software Registry</span>
        </h2>

        <div className="space-y-4">
          {ATTRIBUTION_REGISTRY.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 hover:border-zinc-700 transition shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-base text-white mt-1.5">{item.sourceName}</h3>
                  <p className="text-xs text-zinc-400">{item.provider}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.license}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-zinc-200">Platform Utilization:</strong> {item.usageDescription}
              </p>

              {item.mandatoryNotice && (
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
                  📌 {item.mandatoryNotice}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
