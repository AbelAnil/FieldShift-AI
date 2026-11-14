"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Farm, validateGeoJSON } from "@/lib/api";
import { MapPin, Navigation, Compass, Layers, Check, RefreshCw } from "lucide-react";

interface FarmMapProps {
  farms: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  isDrawingMode?: boolean;
  onPolygonCreated?: (geojson: any, areaHa: number, areaAc: number) => void;
}

const KERALA_PRESETS = [
  { name: "Kanjirappally", coords: [76.7865, 9.5542] as [number, number], zoom: 14 },
  { name: "Wayanad", coords: [76.13, 11.685] as [number, number], zoom: 14 },
  { name: "Palakkad", coords: [76.6548, 10.7867] as [number, number], zoom: 13 },
  { name: "Kuttanad", coords: [76.435, 9.498] as [number, number], zoom: 13 },
];

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
  const [calculatedArea, setCalculatedArea] = useState<{ ha: number; ac: number } | null>(null);
  const [calculating, setCalculating] = useState(false);

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
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Update layers when farms or selectedFarm change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    updateMapLayers(map.current, farms, selectedFarm);
  }, [farms, selectedFarm]);

  // Click handler for drawing
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingMode) return;

      const newPt: [number, number] = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))];
      const updatedPts = [...drawingPoints, newPt];
      setDrawingPoints(updatedPts);
      updateDrawingLayer(updatedPts);

      if (updatedPts.length >= 3) {
        setCalculating(true);
        try {
          const closedCoords = [...updatedPts, updatedPts[0]];
          const testGeo = {
            type: "Polygon",
            coordinates: [closedCoords],
          };
          const val = await validateGeoJSON(testGeo);
          if (val.is_valid && val.area_hectares && val.area_acres) {
            setCalculatedArea({ ha: val.area_hectares, ac: val.area_acres });
          }
        } catch (err) {
          console.error("Area preview calculation failed", err);
        } finally {
          setCalculating(false);
        }
      }
    };

    map.current.on("click", handleMapClick);
    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [isDrawingMode, drawingPoints]);

  const updateDrawingLayer = (pts: [number, number][]) => {
    if (!map.current) return;
    const currentMap = map.current;

    // Feature collection of points and polygon
    const lineCoords = pts.length >= 2 ? pts : [];
    const polyCoords = pts.length >= 3 ? [...pts, pts[0]] : [];

    const drawData = {
      type: "FeatureCollection",
      features: [
        ...(polyCoords.length > 0
          ? [
              {
                type: "Feature",
                geometry: { type: "Polygon", coordinates: [polyCoords] },
                properties: {},
              },
            ]
          : []),
        ...(lineCoords.length > 0
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: lineCoords },
                properties: {},
              },
            ]
          : []),
        ...pts.map((pt) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: pt },
          properties: {},
        })),
      ],
    };

    const source = currentMap.getSource("draw-source") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(drawData as any);
    } else {
      currentMap.addSource("draw-source", {
        type: "geojson",
        data: drawData as any,
      });

      currentMap.addLayer({
        id: "draw-poly",
        type: "fill",
        source: "draw-source",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.35,
        },
      });

      currentMap.addLayer({
        id: "draw-lines",
        type: "line",
        source: "draw-source",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#10b981",
          "line-width": 2.5,
          "line-dasharray": [2, 2],
        },
      });

      currentMap.addLayer({
        id: "draw-points",
        type: "circle",
        source: "draw-source",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#059669",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }
  };

  const finishDrawing = () => {
    if (drawingPoints.length < 3) return;
    const closed = [...drawingPoints, drawingPoints[0]];
    const geo = {
      type: "Polygon",
      coordinates: [closed],
    };
    if (onPolygonCreated && calculatedArea) {
      onPolygonCreated(geo, calculatedArea.ha, calculatedArea.ac);
    }
  };

  const clearDrawing = () => {
    setDrawingPoints([]);
    setCalculatedArea(null);
    updateDrawingLayer([]);
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
        if (e.features && e.features[0] && onSelectFarm) {
          const clickedId = e.features[0].properties?.id;
          const matched = farmList.find((f) => f.id === clickedId);
          if (matched) {
            onSelectFarm(matched);
          }
        }
      });

      // Cursor change on hover
      currentMap.on("mouseenter", "farms-fill", () => {
        currentMap.getCanvas().style.cursor = "pointer";
      });
      currentMap.on("mouseleave", "farms-fill", () => {
        currentMap.getCanvas().style.cursor = "";
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
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
      {/* MapLibre Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Kerala District Presets */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 bg-zinc-900/90 backdrop-blur p-1.5 rounded-xl border border-zinc-800 shadow-md">
        <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 flex items-center gap-1">
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>Kerala:</span>
        </span>
        {KERALA_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => flyToPreset(preset.coords, preset.zoom)}
            className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Drawing Toolbar Overlay */}
      {isDrawingMode && (
        <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/95 backdrop-blur p-4 rounded-2xl border border-emerald-500/40 shadow-xl max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Polygon Drawing Mode
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">{drawingPoints.length} vertices</span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-tight">
            Click points on the map to trace your field boundary. Need at least 3 points to calculate area.
          </p>

          {calculatedArea && (
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="text-zinc-400 text-[10px]">Estimated Boundary Area:</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                {calculatedArea.ha} Hectares{" "}
                <span className="text-zinc-400 font-normal text-xs">({calculatedArea.ac} Acres)</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={finishDrawing}
              disabled={drawingPoints.length < 3}
              className={`flex-1 py-1.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                drawingPoints.length >= 3
                  ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Boundary</span>
            </button>
            <button
              onClick={clearDrawing}
              className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
