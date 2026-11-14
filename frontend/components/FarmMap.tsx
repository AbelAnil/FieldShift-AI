"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Farm, validateGeoJSON } from "@/lib/api";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}
import { MapPin, Navigation, Compass, Layers, Check, RefreshCw, Undo2, Trash2, MousePointerClick, Search, X as XIcon, Loader2 } from "lucide-react";

interface FarmMapProps {
  farms: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  isDrawingMode?: boolean;
  onPolygonCreated?: (geojson: any, areaHa: number, areaAc: number) => void;
}

const GLOBAL_PRESETS = [
  { name: "Kerala (India)", coords: [76.7865, 9.5542] as [number, number], zoom: 14 },
  { name: "Iowa Corn Belt (USA)", coords: [-93.5, 42.0] as [number, number], zoom: 12 },
  { name: "Cerrado (Brazil)", coords: [-55.5, -12.5] as [number, number], zoom: 12 },
  { name: "Pampas (Argentina)", coords: [-60.5, -34.0] as [number, number], zoom: 12 },
  { name: "Rift Valley (Kenya)", coords: [36.0, -0.3] as [number, number], zoom: 12 },
  { name: "Andalucia (Spain)", coords: [-4.5, 37.4] as [number, number], zoom: 12 },
  { name: "Punjab (India)", coords: [75.8, 30.9] as [number, number], zoom: 12 },
  { name: "Wayanad (India)", coords: [76.13, 11.685] as [number, number], zoom: 14 },
];

/**
 * Spherical polygon area calculation in hectares
 */
function computePolygonAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const radius = 6378137; // WGS84 authalic radius
  let total = 0;
  const rad = (deg: number) => (deg * Math.PI) / 180;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    total += (rad(p2[0]) - rad(p1[0])) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
  }
  const areaSqMeters = Math.abs((total * radius * radius) / 2.0);
  return Number((areaSqMeters / 10000).toFixed(2));
}

export default function FarmMap({
  farms,
  selectedFarm,
  onSelectFarm,
  isDrawingMode = false,
  onPolygonCreated,
}: FarmMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const mousePosRef = useRef<[number, number] | null>(null);
  const drawingPointsRef = useRef<[number, number][]>([]);
  const [calculatedArea, setCalculatedArea] = useState<{ ha: number; ac: number } | null>(null);
  const [previewArea, setPreviewArea] = useState<{ ha: number; ac: number } | null>(null);

  // ── Geocoding search state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        setSearchResults(data);
        setSearchOpen(data.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSearchSelect = (result: { display_name: string; lat: string; lon: string }) => {
    if (!map.current) return;
    map.current.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    });
    setSearchQuery(result.display_name.split(",").slice(0, 2).join(", "));
    setSearchResults([]);
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    searchInputRef.current?.focus();
  };

  // Sync refs for event listeners
  drawingPointsRef.current = drawingPoints;
  mousePosRef.current = mousePos;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter: [number, number] = selectedFarm
      ? [selectedFarm.longitude, selectedFarm.latitude]
      : farms.length > 0
        ? [farms[0].longitude, farms[0].latitude]
        : [76.7865, 9.5542]; // Kanjirappally default

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: initialCenter,
      zoom: selectedFarm || farms.length > 0 ? 14 : 12,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstance.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    mapInstance.on("load", () => {
      map.current = mapInstance;
      updateMapLayers(mapInstance, farms, selectedFarm);
      initDrawLayers(mapInstance);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Update cursor when drawing mode changes
  useEffect(() => {
    if (!map.current) return;
    map.current.getCanvas().style.cursor = isDrawingMode ? "crosshair" : "";
    if (!isDrawingMode) {
      // Clear drawing preview when exiting drawing mode
      setDrawingPoints([]);
      setMousePos(null);
      setCalculatedArea(null);
      setPreviewArea(null);
      updateDrawingLayer([], null);
    }
  }, [isDrawingMode]);

  // Update layers when farms or selectedFarm change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    updateMapLayers(map.current, farms, selectedFarm);
  }, [farms, selectedFarm]);

  // Initialize Drawing Layer Sources and Styling
  const initDrawLayers = (currentMap: maplibregl.Map) => {
    if (currentMap.getSource("draw-source")) return;

    currentMap.addSource("draw-source", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // 1. Dynamic Preview Polygon Fill (as mouse moves)
    currentMap.addLayer({
      id: "draw-preview-poly",
      type: "fill",
      source: "draw-source",
      filter: ["==", ["get", "type"], "preview-poly"],
      paint: {
        "fill-color": "#10b981",
        "fill-opacity": 0.2,
      },
    });

    // 2. Placed Polygon Fill
    currentMap.addLayer({
      id: "draw-placed-poly",
      type: "fill",
      source: "draw-source",
      filter: ["==", ["get", "type"], "placed-poly"],
      paint: {
        "fill-color": "#059669",
        "fill-opacity": 0.35,
      },
    });

    // 3. Dynamic Preview Rubberband Lines
    currentMap.addLayer({
      id: "draw-preview-lines",
      type: "line",
      source: "draw-source",
      filter: ["==", ["get", "type"], "preview-line"],
      paint: {
        "line-color": "#34d399",
        "line-width": 2.5,
        "line-dasharray": [2, 2],
      },
    });

    // 4. Placed Polygon Edges
    currentMap.addLayer({
      id: "draw-placed-lines",
      type: "line",
      source: "draw-source",
      filter: ["==", ["get", "type"], "placed-line"],
      paint: {
        "line-color": "#10b981",
        "line-width": 3,
      },
    });

    // 5. Vertex Halo Ring
    currentMap.addLayer({
      id: "draw-vertices-halo",
      type: "circle",
      source: "draw-source",
      filter: ["==", ["get", "type"], "vertex"],
      paint: {
        "circle-radius": ["case", ["get", "isFirst"], 12, 9],
        "circle-color": ["case", ["get", "isFirst"], "#f59e0b", "#10b981"],
        "circle-opacity": 0.35,
      },
    });

    // 6. Placed Vertices (Solid Dots)
    currentMap.addLayer({
      id: "draw-vertices",
      type: "circle",
      source: "draw-source",
      filter: ["==", ["get", "type"], "vertex"],
      paint: {
        "circle-radius": ["case", ["get", "isFirst"], 7, 5.5],
        "circle-color": ["case", ["get", "isFirst"], "#f59e0b", "#059669"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });

    // 7. Vertex Number Labels (V1, V2, V3...)
    currentMap.addLayer({
      id: "draw-vertex-labels",
      type: "symbol",
      source: "draw-source",
      filter: ["==", ["get", "type"], "vertex"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-offset": [0, -1.3],
        "text-anchor": "bottom",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#09090b",
        "text-halo-width": 2,
      },
    });

    // 8. Hover Cursor Node
    currentMap.addLayer({
      id: "draw-cursor-node",
      type: "circle",
      source: "draw-source",
      filter: ["==", ["get", "type"], "cursor-node"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#34d399",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  };

  // Update Drawing Layer Geometry
  const updateDrawingLayer = useCallback((pts: [number, number][], currentMouse: [number, number] | null) => {
    if (!map.current) return;
    const currentMap = map.current;
    const source = currentMap.getSource("draw-source") as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: any[] = [];

    // Placed polygon fill (if >= 3 vertices)
    if (pts.length >= 3) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...pts, pts[0]]],
        },
        properties: { type: "placed-poly" },
      });
    }

    // Dynamic Preview Polygon (if mouse active and >= 2 vertices)
    if (currentMouse && pts.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...pts, currentMouse, pts[0]]],
        },
        properties: { type: "preview-poly" },
      });
    }

    // Placed boundary lines between placed points
    if (pts.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: pts.length >= 3 ? [...pts, pts[0]] : pts,
        },
        properties: { type: "placed-line" },
      });
    }

    // Dynamic Rubberband Preview Lines to cursor
    if (currentMouse && pts.length >= 1) {
      const lastPt = pts[pts.length - 1];
      // Line from last placed point to cursor
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [lastPt, currentMouse],
        },
        properties: { type: "preview-line" },
      });

      // Line from cursor back to first point (to preview closure)
      if (pts.length >= 2) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [currentMouse, pts[0]],
          },
          properties: { type: "preview-line" },
        });
      }

      // Cursor node indicator
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: currentMouse,
        },
        properties: { type: "cursor-node" },
      });
    }

    // Placed Vertices with labels
    pts.forEach((pt, index) => {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: pt,
        },
        properties: {
          type: "vertex",
          index: index + 1,
          isFirst: index === 0,
          label: index === 0 ? "Start (V1)" : `V${index + 1}`,
        },
      });
    });

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, []);

  // Map Click Handler for Drawing
  useEffect(() => {
    if (!map.current) return;
    const currentMap = map.current;

    const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingMode) return;

      const newPt: [number, number] = [
        Number(e.lngLat.lng.toFixed(6)),
        Number(e.lngLat.lat.toFixed(6)),
      ];

      const currentPts = drawingPointsRef.current;

      // Check if clicking close to first point (to auto-close polygon)
      if (currentPts.length >= 3) {
        const firstPt = currentPts[0];
        const distDeg = Math.hypot(newPt[0] - firstPt[0], newPt[1] - firstPt[1]);
        if (distDeg < 0.00035) {
          // Snap closed & finish
          finishDrawing(currentPts);
          return;
        }
      }

      const updatedPts = [...currentPts, newPt];
      setDrawingPoints(updatedPts);
      updateDrawingLayer(updatedPts, mousePosRef.current);

      // Compute local fast area immediately
      if (updatedPts.length >= 3) {
        const ha = computePolygonAreaHa(updatedPts);
        const ac = Number((ha * 2.47105).toFixed(2));
        setCalculatedArea({ ha, ac });

        // Trigger background authoritative validation
        try {
          const testGeo = {
            type: "Polygon",
            coordinates: [[...updatedPts, updatedPts[0]]],
          };
          const val = await validateGeoJSON(testGeo);
          if (val.is_valid && val.area_hectares && val.area_acres) {
            setCalculatedArea({ ha: val.area_hectares, ac: val.area_acres });
          }
        } catch {
          // fallback to local calculation
        }
      } else {
        setCalculatedArea(null);
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingMode || drawingPointsRef.current.length === 0) return;
      const cur: [number, number] = [
        Number(e.lngLat.lng.toFixed(6)),
        Number(e.lngLat.lat.toFixed(6)),
      ];
      setMousePos(cur);
      updateDrawingLayer(drawingPointsRef.current, cur);

      // Compute live preview area while hovering
      if (drawingPointsRef.current.length >= 2) {
        const previewCoords = [...drawingPointsRef.current, cur];
        const ha = computePolygonAreaHa(previewCoords);
        const ac = Number((ha * 2.47105).toFixed(2));
        setPreviewArea({ ha, ac });
      }
    };

    const handleMouseLeave = () => {
      if (!isDrawingMode) return;
      setMousePos(null);
      updateDrawingLayer(drawingPointsRef.current, null);
      setPreviewArea(null);
    };

    currentMap.on("click", handleMapClick);
    currentMap.on("mousemove", handleMouseMove);
    currentMap.on("mouseout", handleMouseLeave);

    return () => {
      currentMap.off("click", handleMapClick);
      currentMap.off("mousemove", handleMouseMove);
      currentMap.off("mouseout", handleMouseLeave);
    };
  }, [isDrawingMode, updateDrawingLayer]);

  // Keyboard shortcuts (Escape to clear, Backspace/Ctrl+Z to undo, Enter to save)
  useEffect(() => {
    if (!isDrawingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || (e.ctrlKey && e.key === "z")) {
        undoLastPoint();
      } else if (e.key === "Escape") {
        clearDrawing();
      } else if (e.key === "Enter" && drawingPointsRef.current.length >= 3) {
        finishDrawing(drawingPointsRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawingMode]);

  const undoLastPoint = () => {
    if (drawingPoints.length === 0) return;
    const updated = drawingPoints.slice(0, -1);
    setDrawingPoints(updated);
    updateDrawingLayer(updated, mousePosRef.current);

    if (updated.length >= 3) {
      const ha = computePolygonAreaHa(updated);
      const ac = Number((ha * 2.47105).toFixed(2));
      setCalculatedArea({ ha, ac });
    } else {
      setCalculatedArea(null);
    }
  };

  const finishDrawing = (pts = drawingPoints) => {
    if (pts.length < 3) return;
    const closed = [...pts, pts[0]];
    const geo = {
      type: "Polygon",
      coordinates: [closed],
    };
    const ha = calculatedArea ? calculatedArea.ha : computePolygonAreaHa(pts);
    const ac = calculatedArea ? calculatedArea.ac : Number((ha * 2.47105).toFixed(2));

    if (onPolygonCreated) {
      onPolygonCreated(geo, ha, ac);
    }
  };

  const clearDrawing = () => {
    setDrawingPoints([]);
    setMousePos(null);
    setCalculatedArea(null);
    setPreviewArea(null);
    updateDrawingLayer([], null);
  };

  const updateMapLayers = (currentMap: maplibregl.Map, farmList: Farm[], selected?: Farm | null) => {
    const geojsonFeatures = farmList
      .filter((f) => f.boundary_geojson)
      .map((f) => ({
        type: "Feature",
        id: f.id,
        geometry: f.boundary_geojson,
        properties: {
          id: f.id,
          name: f.farm_name,
          location: f.location_name,
          area_ha: f.total_area_hectares,
          area_ac: f.total_area_acres,
          crop: f.current_crop || "Unspecified",
          isSelected: selected?.id === f.id,
        },
      }));

    const sourceData = {
      type: "FeatureCollection",
      features: geojsonFeatures,
    };

    const source = currentMap.getSource("farms-source") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(sourceData as any);
    } else {
      currentMap.addSource("farms-source", {
        type: "geojson",
        data: sourceData as any,
      });

      // Farm Fill Layer
      currentMap.addLayer({
        id: "farms-fill",
        type: "fill",
        source: "farms-source",
        paint: {
          "fill-color": [
            "case",
            ["get", "isSelected"],
            "#059669", // Vibrant Emerald for selected
            "#0d9488", // Teal for normal
          ],
          "fill-opacity": [
            "case",
            ["get", "isSelected"],
            0.5,
            0.3,
          ],
        },
      });

      // Farm Outline Layer
      currentMap.addLayer({
        id: "farms-outline",
        type: "line",
        source: "farms-source",
        paint: {
          "line-color": [
            "case",
            ["get", "isSelected"],
            "#10b981",
            "#14b8a6",
          ],
          "line-width": [
            "case",
            ["get", "isSelected"],
            3,
            2,
          ],
        },
      });

      // Farm Click event
      currentMap.on("click", "farms-fill", (e) => {
        if (e.features && e.features[0] && onSelectFarm && !isDrawingMode) {
          const clickedId = e.features[0].properties?.id;
          const matched = farmList.find((f) => f.id === clickedId);
          if (matched) {
            onSelectFarm(matched);
          }
        }
      });

      // Cursor change on hover
      currentMap.on("mouseenter", "farms-fill", () => {
        if (!isDrawingMode) {
          currentMap.getCanvas().style.cursor = "pointer";
        }
      });
      currentMap.on("mouseleave", "farms-fill", () => {
        if (!isDrawingMode) {
          currentMap.getCanvas().style.cursor = "";
        }
      });
    }

    // Fly to selected farm if present
    if (selected) {
      currentMap.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 15,
        speed: 1.2,
      });
    }
  };

  const flyToPreset = (coords: [number, number], zoom: number) => {
    if (map.current) {
      map.current.flyTo({
        center: coords,
        zoom: zoom,
        speed: 1.4,
      });
    }
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
      {/* MapLibre Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Banner: Drawing Mode Guidance Bar */}
      {isDrawingMode && (
        <div className="absolute top-14 sm:top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 backdrop-blur border border-emerald-500/50 shadow-2xl text-xs text-white max-w-[90vw]">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 shrink-0">Drawing:</span>
          <span className="text-zinc-300 hidden sm:inline">
            Click map to place boundary vertices. Rubberband lines & preview area appear in real-time.
          </span>
          <span className="text-zinc-300 sm:hidden text-[11px]">Tap map to add boundary points.</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-emerald-300 shrink-0">
            {drawingPoints.length} {drawingPoints.length === 1 ? "pt" : "pts"}
          </span>
        </div>
      )}

      {/* ── Map Search Bar + Region Presets ── */}
      <div className="absolute top-3 left-3 right-14 z-10 flex flex-col gap-1.5 max-w-xs sm:max-w-sm">
        {/* Geocoding Search Input */}
        <div className="relative flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur rounded-xl border border-zinc-700 shadow-md px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="Search location…"
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none min-w-0"
          />
          {searchLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />}
          {searchQuery && !searchLoading && (
            <button onClick={clearSearch} className="text-zinc-500 hover:text-zinc-200 shrink-0 transition">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="bg-zinc-900/98 backdrop-blur border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSearchSelect(r)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition flex items-start gap-2 border-b border-zinc-800/60 last:border-0"
              >
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Region Presets */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur rounded-xl border border-zinc-800 shadow px-2 py-1">
          <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx) && GLOBAL_PRESETS[idx]) {
                flyToPreset(GLOBAL_PRESETS[idx].coords, GLOBAL_PRESETS[idx].zoom);
              }
            }}
            defaultValue="0"
            className="bg-transparent text-zinc-300 text-[11px] font-medium focus:outline-none cursor-pointer flex-1 min-w-0"
          >
            {GLOBAL_PRESETS.map((preset, idx) => (
              <option key={preset.name} value={idx} className="bg-zinc-900 text-zinc-200">
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drawing Toolbar Overlay */}
      {isDrawingMode && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto z-20 bg-zinc-900/95 backdrop-blur p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl sm:max-w-sm w-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Field Boundary Preview
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {drawingPoints.length < 3 ? `Need ${3 - drawingPoints.length} more` : "Ready to Save"}
            </span>
          </div>

          {/* Real-time area preview display */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{calculatedArea ? "Calculated Field Area:" : "Live Cursor Preview Area:"}</span>
              <span className="text-emerald-400 font-medium font-mono">WGS84 Geodesic</span>
            </div>
            <div className="font-bold text-emerald-400 text-base">
              {calculatedArea ? (
                <>
                  {calculatedArea.ha} <span className="text-xs font-normal text-zinc-300">ha</span>{" "}
                  <span className="text-zinc-500 font-normal text-xs">({calculatedArea.ac} acres)</span>
                </>
              ) : previewArea && drawingPoints.length >= 2 ? (
                <>
                  {previewArea.ha} <span className="text-xs font-normal text-zinc-400">ha</span>{" "}
                  <span className="text-zinc-500 font-normal text-xs">({previewArea.ac} acres preview)</span>
                </>
              ) : (
                <span className="text-zinc-500 text-xs font-normal">
                  {drawingPoints.length === 0
                    ? "Click any location on map to start"
                    : drawingPoints.length === 1
                      ? "Click 2nd point to draw first boundary edge"
                      : "Click 3rd point to enclose polygon area"}
                </span>
              )}
            </div>
          </div>

          {/* Quick tips */}
          <div className="text-[11px] text-zinc-400 space-y-1 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span><b className="text-amber-400">Start (V1)</b>: Click near starting vertex or Enter to close.</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>Green dashed lines show dynamic rubberband line to cursor.</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => finishDrawing()}
              disabled={drawingPoints.length < 3}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${drawingPoints.length >= 3
                  ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/50"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
            >
              <Check className="w-4 h-4" />
              <span>Save Boundary</span>
            </button>

            <button
              onClick={undoLastPoint}
              disabled={drawingPoints.length === 0}
              title="Undo last vertex (Backspace)"
              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Undo</span>
            </button>

            <button
              onClick={clearDrawing}
              disabled={drawingPoints.length === 0}
              title="Clear all points (Escape)"
              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
