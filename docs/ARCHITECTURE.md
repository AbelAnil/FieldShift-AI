# FieldShift AI: Technical Architecture and Phased Implementation Plan

**Project:** FieldShift AI  
**Challenge:** NASA Space Apps Challenge 2026, Field Shift: Adapting Farms with NASA Data  
**Team:** ChungusReloaded (solo development)  
**Initial Region:** Kerala, India (Global Scope via Region Packs)  
**Development Environment:** Windows laptop (local-first)  
**Future Hosting:** Raspberry Pi, subject to hardware evaluation  
**Document Version:** 3.2, consolidated plan with Carbon Credit Readiness Module  
**Date:** 14 November 2026  

---

## 1. Executive Summary

FieldShift AI is an agricultural decision-support platform that transforms NASA Earth observations and local farm knowledge into practical farming decisions. For each registered field, it constructs a multi-layer predictive digital twin combining satellite precipitation, microclimate, soil intelligence, terrain hydrology, crop phenology, and farmer records. On top of that twin, it provides weighted crop suitability scoring, algorithmic multi-year crop rotation optimization, what-if stress simulation, an AI farm assistant, automated condition-based tasks, and a Carbon Credit Readiness & Filing Assistant.

### Core Workflow
```text
NASA Earth Data → Environmental Analysis → Farm Digital Twin → Crop Suitability → Rotation Optimization → AI Guidance → Actionable Farm Tasks → Carbon Credit Readiness
```

### Staged Build Sequence
| Stage | Phase | Focus | Status |
|---|---|---|---|
| **Now** | **Phase 0** | Next.js 16, FastAPI, local development, basic working application | Completed |
| **Next** | **Phase 1** | PostgreSQL/SQLite + PostGIS, farm registration, map boundaries, multi-tenant isolation | Completed |
| **Then** | **Phase 2** | NASA Earth Observation Engine (GPM IMERG, NASA POWER, SMAP, Landsat/Sentinel NDVI/NDMI) | Completed |
| **Then** | **Phase 3 & 4** | Soil Intelligence (SoilGrids + lab tests), Terrain Hydrology (NASADEM), Kerala Crop DB (12 crops), Weighted Suitability Engine | Completed |
| **Then** | **Phase 5 & 6** | Multi-Year Crop Rotation Optimizer & Predictive Digital Twin with What-If Stress Simulator | Completed |
| **Later** | **Phase 7** | AI Farm Assistant with deterministic tool calling and KAU/ICAR grounding | Completed |
| **Later** | **Phase 8** | Smart Tasks & Reminders, Condition Alert Engine & Farm Decision Dossiers | Completed |
| **Later** | **Phase 9** | Carbon Credit Readiness & Filing Assistant (Methodologies, Aggregation, Evidence Packs) | In Progress |
| **Finally**| **Phase 10** | Raspberry Pi edge deployment, resource optimization, offline readiness | Planned |

---

## 2. System Architecture & Tech Stack

- **Architecture:** Modular monolith (FastAPI backend + Next.js frontend + SQLite/PostgreSQL)
- **Frontend Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS, MapLibre GL JS, Terra Draw, Recharts, Lucide React
- **Backend Framework:** Python 3.11, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy ORM
- **Database:** SQLite (development default) / PostgreSQL + PostGIS (production-ready)
- **Geospatial & Analytics:** Shapely, NumPy, Pandas, Geodesic spherical geometry, WhiteboxTools / PySheds compatible
- **AI Assistant:** Provider-independent engine featuring deterministic tool-calling against live farm telemetry
- **Carbon Engine:** Rule-based eligibility screening, IPCC Tier 1/2 indicative yield ranges, Verra/Gold Standard methodology alignment, aggregation packaging

---

## 3. Carbon Credit Module (Phase 9 Specification)

### 3.1 Honest Positioning
- FieldShift AI **does not issue carbon credits** (credits are issued by registries like Verra or Gold Standard after independent validation/verification).
- FieldShift AI **does not guarantee income**; all financial projections are displayed as conservative low/expected/high ranges with fee deductions.
- Smallholders (1-3 acres in Kerala) require **aggregation** via FPOs or project developers to achieve economic viability.

### 3.2 Candidate Kerala Pathways
1. **Agroforestry & Tree Planting:** Coconut, intercropped pepper, fruit trees, shaded coffee/tea.
2. **Rice Methane Abatement:** Alternate Wetting and Drying (AWD).
3. **Soil Organic Carbon (SOC) Improvement:** Cover cropping, residue retention, reduced tillage, green manuring.
4. **Nitrogen Fertilizer Optimization:** Precision split application preventing N2O volatilization.

### 3.3 Core Capabilities
- **Eligibility Screening:** Evaluates farm area, current crop, irrigation, and practices against approved methodologies.
- **Indicative Yield & Revenue Calculator:** Computes tCO2e/ha/year, gross credit value ($10-$30/t), developer/verifier commission (25-40%), and farmer net return range.
- **Evidence Registry & Gap Report:** Tracks geo-tagged photos, planting dates, soil test certificates, and AWD water depth logs.
- **Aggregation Partner Directory:** Connects smallholders with verified FPOs, cooperatives, and carbon developers.
- **Submission Dossier Export:** Prepares complete evidence packages formatted for project developer intake.
