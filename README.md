# 🌱 FieldShift AI

> **NASA Space Apps Challenge 2026** — *Field Shift: Adapting Farms with NASA Data*  
> **Team:** ChungusReloaded (Solo Development)  
> **Initial Pilot Region:** Kerala, India (Global Scope via Region Packs)  
> **Documentation Version:** 3.2 Consolidated Final Plan  

FieldShift AI is an agricultural decision-support platform that transforms NASA Earth observations into actionable farm decisions. For each registered field, it creates a farm-level predictive **digital twin** combining satellite observations, soil intelligence, terrain hydrology, and crop knowledge. It powers weighted crop suitability scoring, three multi-year crop rotation strategies (Soil Health, Water Efficiency, and Balanced), what-if stress simulation, a conversational AI Farm Assistant with deterministic tool-calling, condition-triggered tasks, exportable farm decision dossiers, and a Carbon Credit Readiness & Filing Assistant.

```text
NASA Earth Data → Environmental Analysis → Farm Digital Twin → Crop Suitability → Rotation Optimization → AI Guidance → Actionable Farm Tasks → Carbon Credit Readiness
```

---

## 🏆 Implementation Roadmap & Status (v3.2)

| Phase | Module | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | **App Foundation** | ✅ Complete | FastAPI backend (`:8000`), Next.js 16 App Router (`:3000`), Dark Theme layout shell |
| **Phase 1** | **Farm Maps & Auth** | ✅ Complete | MapLibre GL JS polygon drawing, WGS84 geodesic area calculation, JWT auth, multi-tenant data isolation |
| **Phase 2** | **NASA Earth Data Engine** | ✅ Complete | NASA GPM IMERG rainfall, NASA POWER agroclimatology, NASA SMAP L4 moisture, Landsat/Sentinel NDVI & NDMI |
| **Phase 3 & 4** | **Soil, Terrain & Crops** | ✅ Complete | ISRIC SoilGrids baseline + lab test intake, NASADEM elevation & TWI drainage, 12 Kerala crops, 5-factor suitability engine |
| **Phase 5 & 6** | **Rotation & Digital Twin** | ✅ Complete | 3-strategy multi-year crop rotation planner (Soil Health, Water, Balanced), Predictive Digital Twin & What-If stress simulator |
| **Phase 7** | **AI Farm Assistant** | ✅ Complete | Conversational farm advisor with telemetry tool-calling, KAU/ICAR grounding, zero paid API dependencies |
| **Phase 8** | **Tasks & Decision Dossiers** | ✅ Complete | Condition-based alert engine, interactive task manager, printable comprehensive markdown farm decision dossiers |
| **Phase 9** | **Carbon Credit Module** | ✅ Complete | Honest eligibility screener, conservative yield & revenue range model, evidence ledger, FPO aggregator pack |
| **Phase 10** | **Deployment & Edge Readiness** | 🚀 Ready | Local-first architecture, SQLite default / PostgreSQL-ready, low-power Raspberry Pi edge evaluation |

---

## 🏗️ Architecture & Technology Stack

- **Architecture:** Modular Monolith (FastAPI backend + Next.js frontend + SQLite/PostgreSQL)
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons, MapLibre GL JS, Recharts
- **Backend:** Python 3.11, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy ORM
- **Data Integrations:**
  - **Precipitation:** NASA GPM IMERG v07 (0.1° gridded daily & 7-day cumulative)
  - **Climate:** NASA POWER Agroclimatology (T2M air temp, surface solar irradiance, relative humidity)
  - **Soil Moisture:** NASA SMAP L4 Enhanced Global (9 km surface & rootzone moisture)
  - **Vegetation Vigor:** Landsat 8/9 OLI-2 & Sentinel-2 MSI (10m–30m NDVI & NDMI)
  - **Elevation & Slope:** NASADEM / SRTM 30m digital elevation model
  - **Soil Baseline:** ISRIC SoilGrids 250m + physical Krishi Bhavan lab test calibration
  - **Agronomic Knowledge:** Kerala Agricultural University (KAU) Package of Practices & ICAR
  - **Carbon Standards:** Verra VCS (VM0042), Gold Standard (GS-SOC), UNFCCC CDM (AMS-III.AU)
- **Local Development:** Windows Laptop • Local-first, zero paid API dependencies

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 20+** (or 24+) & **npm** installed
- **Git** installed

### 2. Backend Setup (FastAPI at `:8000`)
```bash
# 1. Open a terminal in the project root
cd FieldShift

# 2. Activate Python virtual environment
# Windows (PowerShell):
.\backend\venv\Scripts\Activate.ps1
# Linux/macOS:
source backend/venv/bin/activate

# 3. Seed demo farms and baseline knowledge
python scripts/seed_demo_data.py

# 4. Start the FastAPI server
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Documentation will be live at `http://localhost:8000/docs`.*

### 3. Frontend Setup (Next.js at `:3000`)
```bash
# 1. Open a second terminal in the project root
cd FieldShift/frontend

# 2. Start the development server
npm run dev
```
*Frontend application will be live at `http://localhost:3000`.*

### 4. Running Backend Automated Test Suite
From the `backend/` directory with venv active:
```bash
python -m pytest -v
```
All 7 test suites will execute and pass:
- `tests/test_assistant.py` (AI Farm Assistant & Tool Calling)
- `tests/test_carbon.py` (Carbon Eligibility, Yields & Evidence)
- `tests/test_environment.py` (NASA GPM, POWER, SMAP, NDVI/NDMI)
- `tests/test_farms_auth.py` (Farm Registration, Geodesic Area & Multi-Tenant Isolation)
- `tests/test_rotation_digital_twin.py` (Rotation Optimizer & What-If Simulator)
- `tests/test_soil_terrain_crops.py` (SoilGrids, Lab Tests, NASADEM & Crop Suitability)
- `tests/test_tasks_reports.py` (Condition Alerts, Task CRUD & Decision Dossiers)

---

## 🔒 Scientific Safeguards & Integrity

1. **No Hallucinated Fertilizers:** Synthetic N-P-K nutrient recommendations are strictly suppressed until a certified physical soil test from a Krishi Bhavan laboratory is entered.
2. **Honest Carbon Credit Modeling:** FieldShift AI does not issue carbon credits. Projections are displayed as conservative low/expected/high ranges with aggregator fee deductions, acknowledging that smallholders (1-3 acres) require collective FPO pooling.
3. **Multi-Tenant Isolation:** Per-user authorization checks strictly prevent cross-tenant field inspection (HTTP 403 Forbidden).
4. **Data Provenance:** Every satellite observation is tagged with its spatial resolution, temporal cadence, sensor name, and scientific limitations.

---

## 👥 Authors
- **Team:** ChungusReloaded (Solo Development)
- **Competition:** NASA Space Apps Challenge 2026
