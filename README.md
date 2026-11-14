# 🌱 FieldShift AI

> **NASA Space Apps Challenge 2026** — *Field Shift: Adapting Farms with NASA Data*  
> **Team:** ChungusReloaded  
> **Focus Region:** Kerala, India  

FieldShift AI is an intelligent agricultural decision-support platform that combines NASA Earth observations, geospatial analysis, soil intelligence, terrain hydrology, and predictive modeling into a **farm-level digital twin**. It helps farmers adapt their practices to climate volatility through crop suitability analysis, multi-objective crop rotation optimization, and a context-aware AI Farm Assistant.

---

## 🚀 Key Capabilities

- 🛰️ **NASA Earth Observation Integration:** GPM IMERG rainfall monitoring, SMAP soil moisture context, NASA POWER meteorology, and Landsat 8/9 / Sentinel-2 vegetation indices (NDVI, NDMI).
- 🧪 **Soil Intelligence:** Blends farmer laboratory soil test inputs with ISRIC SoilGrids modelled global estimations.
- ⛰️ **Terrain & Drainage Hydrology:** DEM-based slope, flow direction, flow accumulation, and depression analysis for preliminary waterlogging risk assessment.
- 🌾 **Crop Knowledge Engine:** Tailored database for Kerala crops (Rice, Banana, Cassava, Maize, Pulses, Spices) with phenological and agro-climatic boundaries.
- 🔄 **Crop Rotation Optimization:** Constraint-based engine producing 3 distinct multi-year strategies:
  1. *Soil Health Priority* (legume integration, nitrogen fixation, crop family diversity)
  2. *Water Efficiency Priority* (drought resilience, seasonal rainfall alignment)
  3. *Balanced Strategy* (market feasibility + soil conservation)
- 🤖 **Context-Aware AI Farm Assistant:** Tool-calling assistant grounded strictly in calculated farm telemetry and validated agronomic guidance with zero hallucination.
- 📋 **Intelligent Tasks & Reminders:** Converts agro-climatic triggers and rotation milestones into actionable farm checklists.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Recharts
- **Backend:** Python FastAPI, Pydantic v2, SQLAlchemy, GeoPandas, Rasterio, WhiteboxTools, PySheds, SciPy / OR-Tools
- **Database:** PostgreSQL with PostGIS (with SQLite / GeoJSON dev adapter)
- **APIs:** NASA POWER API, NASA Earthdata, ISRIC SoilGrids REST API, Google Earth Engine

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural specification.

---

## 📂 Project Structure

```text
FieldShift/
├── frontend/             # Next.js web application
├── backend/              # FastAPI modular backend
│   └── app/
│       ├── api/          # REST route handlers
│       ├── services/     # NASA, Soil, Terrain, Rotation & AI services
│       ├── models/       # Database & ORM models
│       ├── schemas/      # Pydantic schemas
│       └── core/         # Config and DB connections
├── data/
│   ├── crops/            # Kerala crop agronomic profiles
│   ├── sample_farms/     # Reference demonstration farms
│   └── raw/              # Cached rasters & observations
├── docs/                 # Documentation and research notes
└── scripts/              # Setup and data seed scripts
```
