# FieldShift AI: Technical Architecture and Implementation Plan

**Project:** FieldShift AI  
**Challenge:** Field Shift: Adapting Farms with NASA Data  
**Competition:** NASA Space Apps Challenge 2026  
**Team:** ChungusReloaded  
**Development Approach:** Solo development  
**Initial Deployment Region:** Kerala, India  
**Initial Environment:** Local development on Windows (Lenovo LOQ)  

---

## 1. Project Overview

FieldShift AI is a predictive agricultural decision-support platform that integrates NASA Earth observations, geospatial analysis, soil intelligence, terrain hydrology, crop rotation optimization, and artificial intelligence to assist farmers in adapting their agricultural practices to climate and environmental changes.

The platform creates a farm-level digital twin synthesizing:
- NASA Earth observations (GPM IMERG, SMAP, Landsat 8/9, MODIS, NASADEM, NASA POWER, GEDI)
- Supplementary Earth observation datasets (Copernicus Sentinel-2, ISRIC SoilGrids, Copernicus DEM)
- Soil properties (farmer lab test records + SoilGrids modelled profiles)
- Terrain hydrology (DEM elevation, slope, flow direction/accumulation, potential water accumulation)
- Crop knowledge base (Kerala-adapted crops with botanical, phenological, water, soil, and nutrient specs)
- Multi-objective crop rotation optimization engine (Soil Health, Water Efficiency, Balanced)
- Context-aware AI Farm Assistant with tool calling and deterministic safeguards
- Farm task reminders and what-if simulation scenarios

---

## 2. System Architecture

```text
                    FARMER
                       │
                       ▼
              NEXT.JS WEB DASHBOARD (TypeScript, Tailwind, shadcn/ui, MapLibre GL)
                       │
                       ▼
                  FASTAPI BACKEND
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   FARM SERVICE   DATA SERVICE   USER SERVICE
                       │
             ┌─────────┴─────────┐
             ▼         ▼         ▼
           NASA     SATELLITE   SOIL DATA
           DATA      IMAGERY    PROVIDERS
             │         │         │
             └─────────┬─────────┘
                       │
                       ▼
              GEOSPATIAL ENGINE (GeoPandas, Rasterio, WhiteboxTools, PySheds)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   VEGETATION      TERRAIN         CLIMATE
   ANALYSIS        ANALYSIS        ANALYSIS
        │              │              │
        └──────────────┬──────────────┘
                       │
                       ▼
                DIGITAL TWIN (State Snapshots, What-if Simulations)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   CROP SUITABILITY  ROTATION     PREDICTION
      ENGINE         ENGINE       ENGINE
        │              │              │
        └──────────────┬──────────────┘
                       │
                       ▼
                AI FARM ASSISTANT (LLM Tool Calling + Guardrails)
                       │
              ┌────────┴────────┐
              ▼                 ▼
          FARM ADVICE       TASK MANAGER
                                │
                                ▼
                         FARM REMINDERS
                                │
                                ▼
                         WEB DASHBOARD
```

---

## 3. Technology Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Terra Draw, Recharts
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, GeoPandas, Rasterio, GDAL, WhiteboxTools, PySheds, NumPy, Pandas, SciPy, OR-Tools, APScheduler
- **Database:** PostgreSQL + PostGIS (with SQLite / GeoJSON file-based fallback for initial rapid local boot)
- **AI Assistant:** Provider-agnostic LLM interface with function/tool calling and rule-based fallback
- **Data Integrations:** NASA POWER API, NASA Earthdata / GPM IMERG / SMAP, Google Earth Engine, ISRIC SoilGrids REST API

---

## 4. Key Roadmap Phases

- **Phase 0: Environment & Core Setup** (FastAPI backend skeleton, Next.js app, virtual environment, git setup)
- **Phase 1: Database & Farm Management** (Farm registration, boundary mapping, GeoJSON storage)
- **Phase 2: NASA Data Integration** (NASA POWER API, GPM IMERG rainfall, SMAP regional moisture, Landsat/Sentinel vegetation indices)
- **Phase 3: Soil & Terrain Intelligence** (SoilGrids REST API, farmer soil inputs, NASADEM elevation, slope, flow accumulation, drainage risks)
- **Phase 4: Crop Knowledge Database & Suitability Engine** (Kerala crop profiles, multi-factor suitability scoring, missing-data transparency)
- **Phase 5: Crop Rotation Optimization Engine** (OR-Tools / constraint optimizer for Soil Health, Water Efficiency, and Balanced strategies)
- **Phase 6: Farm Digital Twin & What-If Simulation** (Aggregated farm state, historical snapshots, what-if parameter modification)
- **Phase 7: AI Farm Assistant & Tasks** (Tool-augmented conversational agent, guardrails, reminder generator)
- **Phase 8: Polish, Demonstration Farm & Presentation** (Demonstration scenario with sample Kerala farm in Kanjirappally/Wayanad/Palakkad)
