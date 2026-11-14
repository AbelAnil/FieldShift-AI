# FieldShift AI: Technical Architecture and Phased Implementation Plan

**Project:** FieldShift AI  
**Challenge:** NASA Space Apps Challenge 2026, Field Shift: Adapting Farms with NASA Data  
**Team:** ChungusReloaded (solo development)  
**Initial Region:** Kerala, India  
**Development Environment:** Windows laptop (local-first)  
**Future Hosting:** Raspberry Pi, subject to hardware evaluation  
**Document Version:** 3.0, consolidated final plan  
**Date:** 14 November 2026  

---

## 1. Executive Summary

FieldShift AI is an agricultural decision-support platform that turns NASA Earth observations into practical farm decisions. For each registered field it builds a digital twin combining satellite data, soil information, terrain, crop knowledge and farmer records. On top of that twin it provides crop suitability scoring, three alternative crop rotation strategies, what-if simulation, an AI farm assistant and farmer-approved reminders.

### Core Workflow
```text
NASA Earth Data → Environmental Analysis → Farm Digital Twin → Crop Suitability → Rotation Optimization → AI Guidance → Actionable Farm Tasks
```

### Staged Build Sequence
| Stage | Focus |
|---|---|
| **Now (Phase 0)** | Next.js, FastAPI, local development, basic working application |
| **Next (Phase 1)** | PostgreSQL + PostGIS, farm registration, map boundaries |
| **Then (Phases 2–5)** | NASA data, soil analysis, crop suitability, rotation (terrain follows) |
| **Later (Phases 6–8)** | Digital twin predictions, AI assistant, reminders |
| **Finally (Phase 9)** | Raspberry Pi deployment testing |

---

## 2. System Architecture & Tech Stack

- **Architecture:** Modular monolith (FastAPI backend + Next.js frontend + PostgreSQL/PostGIS)
- **Frontend Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Terra Draw, Recharts
- **Backend Framework:** Python 3.11, FastAPI, Pydantic v2, Uvicorn
- **Database:** PostgreSQL + PostGIS (SQLAlchemy ORM + Alembic)
- **Geospatial & Analytics:** GeoPandas, Rasterio, GDAL, WhiteboxTools, PySheds, NumPy, Pandas, SciPy, OR-Tools
- **AI Assistant:** Provider-independent LLM interface (hosted free tier / Ollama) with tool-calling and deterministic fallback

---

## 3. Implementation Roadmap

### Phase 0: Foundation Application (NOW)
- FastAPI backend with CORS, environment configuration, `/api/health`.
- Next.js 15 App Router frontend with responsive layout and navigation shell.
- Verified frontend-to-backend communication.
- Documented quickstart in README for reproducible setup.

### Phase 1: Database, Farm Registration & Map Boundaries (NEXT)
- PostgreSQL + PostGIS schema and migrations (Alembic).
- Farm registration and field management.
- MapLibre GL JS + Terra Draw interactive boundary editor.
- GeoJSON upload validation & area computation.

### Phases 2–5: Data and Decision Engines (THEN)
- **Phase 2 (Earth Observation):** GPM IMERG rainfall, NASA POWER climate, Landsat/MODIS/Sentinel-2 vegetation indices, SMAP soil moisture context.
- **Phase 3 (Soil & Terrain):** Farmer soil test records + SoilGrids modelled estimates; NASADEM elevation, slope, flow accumulation, water accumulation risk.
- **Phase 4 (Crop Intelligence):** Kerala crop database (10–15 crops) with multi-factor suitability scoring and missing-data transparency.
- **Phase 5 (Rotation Optimization):** Three constraint-driven rotation strategies: Soil Health Priority, Water Efficiency Priority, and Balanced Strategy.

### Phases 6–8: Intelligence Layer (LATER)
- **Phase 6 (Digital Twin):** Field state snapshots, environmental risk indicators, what-if simulator.
- **Phase 7 (AI Farm Assistant):** Tool-connected conversational assistant with strict agricultural safeguards.
- **Phase 8 (Tasks & Reports):** Condition-based reminder triggers, user approval workflow, downloadable reports.

### Phase 9: Deployment & Portability (FINALLY)
- Docker Compose configuration, backup/restore procedures, Raspberry Pi evaluation.
