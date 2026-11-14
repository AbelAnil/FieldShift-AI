# 🌱 FieldShift AI

> **NASA Space Apps Challenge 2026** — *Field Shift: Adapting Farms with NASA Data*  
> **Team:** ChungusReloaded (Solo Development)  
> **Pilot Region:** Kerala, India (Global Scope via Region Packs)

FieldShift AI is an agricultural decision-support platform that transforms NASA Earth observations into actionable farm decisions. For each registered field, it creates a farm-level predictive **digital twin** combining satellite observations, soil intelligence, terrain hydrology, and crop knowledge — powering weighted crop suitability scoring, multi-year crop rotation optimization, what-if stress simulation, a multilingual conversational AI Farm Assistant, condition-triggered tasks, exportable farm decision dossiers, and a Carbon Credit Readiness & Filing Assistant.

```text
NASA Earth Data → Environmental Analysis → Farm Digital Twin → Crop Suitability
    → Rotation Optimization → AI Guidance → Actionable Farm Tasks → Carbon Credits
```

---

## 🏆 Implementation Roadmap & Status

| Phase | Module | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | App Foundation | ✅ Complete | FastAPI backend (`:8000`), Next.js 16 App Router (`:3000`), Dark Theme layout shell |
| **Phase 1** | Farm Maps & Auth | ✅ Complete | MapLibre GL JS polygon drawing, WGS84 geodesic area, JWT auth, multi-tenant isolation |
| **Phase 2** | NASA Earth Data Engine | ✅ Complete | GPM IMERG rainfall, POWER agroclimatology, SMAP L4 moisture, Landsat/Sentinel NDVI & NDMI |
| **Phase 3 & 4** | Soil, Terrain & Crops | ✅ Complete | SoilGrids baseline + lab test intake, NASADEM elevation & TWI drainage, 18 crops, 5-factor suitability |
| **Phase 5 & 6** | Rotation & Digital Twin | ✅ Complete | 3-strategy multi-year rotation planner, Predictive Digital Twin & What-If stress simulator |
| **Phase 7** | AI Farm Assistant | ✅ Complete | Multilingual conversational advisor with STT/TTS, topic sessions, KAU/ICAR tool-calling |
| **Phase 8** | Tasks & Decision Dossiers | ✅ Complete | Condition-based alert engine, interactive task manager, printable markdown farm dossiers |
| **Phase 9** | Carbon Credit Module | ✅ Complete | Eligibility screener, conservative yield model, evidence ledger, FPO aggregator packs |
| **Phase 10** | Integrated Farming System (IFS) | 🚀 Specified | Livestock (THI index), Farm Pond Fish, Rice-Duck/Poultry, and Beekeeping (+25% pollination) |
| **Phase 11** | Deployment & Edge Readiness | 🚀 Ready | Local-first architecture, SQLite default / PostgreSQL-ready, Raspberry Pi edge evaluation |

---

## 📑 Feature Guide

### 🗺️ Farm Registration & Interactive Maps

- **Interactive polygon drawing** on MapLibre GL JS for field boundary delineation
- **WGS84 geodesic area calculation** for accurate field sizing
- **Multi-tenant JWT authentication** with per-user data isolation (HTTP 403 cross-tenant protection)
- Multi-farm support — register and switch between multiple fields

### 🛰️ NASA Earth Observation Engine

Five integrated NASA data pipelines provide real-time and historical Earth observations:

| Data Source | Spatial Res. | Cadence | Variables |
|---|---|---|---|
| **NASA GPM IMERG v07** | 0.1° (~10 km) | Daily + 7-day cumulative | Precipitation (mm/day) |
| **NASA POWER Agroclimatology** | 0.5° (~50 km) | Daily / Monthly | T2M air temperature, solar irradiance, relative humidity |
| **NASA SMAP L4** | 9 km | Daily | Surface & rootzone soil moisture |
| **Landsat 8/9 OLI-2 & Sentinel-2 MSI** | 10–30 m | 5–16 days | NDVI (vegetation vigor), NDMI (moisture stress) |
| **NASADEM / SRTM** | 30 m | Static DEM | Elevation, slope, Topographic Wetness Index (TWI) |

### 🧪 Soil Intelligence

- **ISRIC SoilGrids 250m** baseline: pH, organic carbon, clay/silt/sand fractions, CEC, bulk density (6 depth layers: 0–5cm to 60–100cm)
- **Krishi Bhavan certified lab test calibration**: Physical soil test results override satellite estimates when available
- Safeguard: **No synthetic N-P-K nutrient recommendations without a verified physical lab test**

### 🌾 Crop Knowledge Base & Suitability Engine

- **18 regional and global crops** with full agronomy profiles (Kerala varieties + global staples)
- **5-factor weighted suitability scoring:**
  1. Climate compatibility (temperature, humidity, rainfall)
  2. Soil compatibility (pH, organic carbon, texture)
  3. Water demand vs. available precipitation & moisture
  4. Terrain suitability (slope, drainage, elevation)
  5. Growth period feasibility (season length, solar radiation)
- Each crop scored 0–100 with detailed factor breakdown

### 🔄 Multi-Year Crop Rotation Optimizer

Three optimized strategies computed for each farm:

| Strategy | Focus | Key Benefit |
|---|---|---|
| **Strategy A** | Soil Health | Maximizes organic carbon recovery, legume nitrogen fixation |
| **Strategy B** | Water Efficiency | Minimizes irrigation demand, matches rainfall patterns |
| **Strategy C** | Balanced | Best overall score across all sustainability factors |

- Family rotation rules prevent monoculture and pest buildup
- Legume nitrogen fixation tracking across rotation steps
- Multi-year sequences with seasonal timing and duration

### 🧬 Predictive Digital Twin & What-If Simulator

- **Virtual farm replica** synthesizing all telemetry (NASA weather, soil, vegetation, terrain)
- **What-If stress scenarios:**
  - 🌵 Drought: -30% rainfall
  - 🌊 Flood: +50% rainfall
  - 🌡️ Heat stress: +2°C temperature
  - Custom percentage perturbations from natural language (e.g., "what if rainfall drops by 40%?")
- Simulates impact on crop yield, water stress, and soil health

### 🤖 AI Farm Assistant

A conversational farm advisor powered by deterministic tool-calling against live farm telemetry:

**Core Intelligence:**
- Rule-based dispatching engine — never fabricates recommendations
- KAU (Kerala Agricultural University) & ICAR Package of Practices grounding
- Integrated Pest Management (IPM) diagnosis with bio-control recommendations (Trichoderma, Beauveria bassiana, neem oil, Bordeaux mixture)
- Crop agronomy packages for 7+ crops with detailed practice schedules
- What-If scenario simulation triggered from natural language queries
- Optional **Google Gemini LLM** pass-through (set `GEMINI_API_KEY`) with graceful fallback to local engine

**Multilingual Support:**

| Language | Code | Voice (STT/TTS) |
|---|---|---|
| English | `en` | `en-IN` |
| മലയാളം (Malayalam) | `ml` | `ml-IN` |
| हिन्दी (Hindi) | `hi` | `hi-IN` |
| தமிழ் (Tamil) | `ta` | `ta-IN` |
| Español (Spanish) | `es` | `es-ES` |

- **Voice Transcription (STT):** Web Speech API with per-language recognition, visual recording indicator
- **Audio Read Aloud (TTS):** Web Speech Synthesis for assistant responses in selected language

**Multi-Session Topic Controls:**
- Create, switch, and delete conversation topics/sessions per farm
- Message history persisted per session with message count and timestamps
- Quick topic chips: 🪲 Pests & Diseases, 🔄 Crop Rotation, 🧪 Soil Health & Liming, 🌧️ NASA Weather & Rain, ⚡ What-If Drought Sim, 💰 Carbon Credits

### ✅ Condition-Triggered Task Manager

- Automatic alert generation from environmental threshold breaches
- Interactive task board with priority levels (high / medium / low)
- Task categories: soil, weather, crop, drainage, general
- Status tracking: pending, completed, dismissed, postponed

### 📋 Farm Decision Dossier Export

- Comprehensive printable markdown report
- Consolidates all farm data: NASA observations, soil analysis, crop suitability, rotation plan, digital twin state, active tasks, and carbon readiness

### 🌿 Carbon Credit Readiness & Filing Assistant

- **Honest eligibility screening** against international standards:
  - Verra VCS (VM0042)
  - Gold Standard (GS-SOC)
  - UNFCCC CDM (AMS-III.AU)
- Conservative yield & revenue range modeling (low / expected / high)
- Aggregator fee deductions transparently shown
- Evidence ledger tracking for audit readiness
- **FPO (Farmer Producer Organization) aggregation packs** for smallholders (1–3 acres) who need collective pooling

### 🐄 Integrated Farming System (IFS) — Livestock, Aquaculture & Beekeeping

- **Dairy & Cattle Husbandry Engine:**
  - Manure-to-biogas bio-slurry loop yielding 3.5–4.5 tons of Farm Yard Manure (FYM)/year per cow, displacing 60–80% of synthetic NPK.
  - **NASA POWER Livestock Heat Stress Monitor (THI):** Real-time Temperature-Humidity Index calculation alerting farmers to heat stress ($THI \ge 74$) to protect milk yield and animal welfare.
  - Bund fodder grass sizing (Hybrid Napier CO-5) along boundaries without consuming arable food crop acreage.
- **Farm Pond Rainwater Catchment & Aquaculture:**
  - Sizes rainwater retention basins using live NASA GPM IMERG 30-day precipitation (>1.4 million liters harvested per 2 acres).
  - Species modeling: Composite Carp culture (Catla, Rohu, Mrigal), Pearlspot (*Karimeen*), and GIFT Tilapia.
  - Pokkali organic rice-fish/prawn rotation modeling for floodplains and coastal wetlands.
- **Poultry & Duck Mutualism:**
  - Rice-Duck biological pest control: ducks feed on brown planthoppers, leaf folders, and weeds while aerating root water.
  - Deep-litter poultry manure providing high-phosphorus organic top-dressing for banana and black pepper.
- **Apiculture (Bee Farming) & Pollination Synergy:**
  - Indian Honey Bee (*Apis cerana*) and Stingless Bee (*Tetragonula iridipennis* / *Cheruthen*).
  - Cross-pollination multiplier: **+20% to +35% fruit/seed set** on nutmeg, cashew, coffee, coconut, and vegetables.
  - High-value medicinal honey revenue modeling (₹1,500–₹2,500/kg).

### 📱 Mobile-First Responsive UI

- Fully responsive across desktop and phone screens
- Collapsible session sidebar → mobile slide-over drawer
- 44px minimum touch targets for all interactive elements
- Mobile keyboard safe-area padding (`env(safe-area-inset-bottom)`)
- Touch-friendly quick topic chips and voice input

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                  │
│  App Router · TypeScript · Tailwind CSS · MapLibre GL   │
│  Lucide Icons · Recharts · Web Speech API (STT/TTS)     │
├─────────────────────────────────────────────────────────┤
│                    FastAPI Backend                       │
│  Python 3.11 · Pydantic v2 · SQLAlchemy ORM · Uvicorn   │
├───────┬───────┬───────┬───────┬───────┬─────────────────┤
│  NASA │ Soil  │ Crop  │ AI    │ Carbon│  Digital Twin   │
│  GPM  │ Grids │ Engine│ Asst. │ Credit│  Simulator      │
│ POWER │ Lab   │ Rotn. │ IPM   │ FPO   │  What-If        │
│ SMAP  │ Tests │ Suit. │ STT   │ Verra │  Scenarios      │
│ NDVI  │       │       │ TTS   │ GS    │                 │
├───────┴───────┴───────┴───────┴───────┴─────────────────┤
│           SQLite (default) / PostgreSQL                  │
└─────────────────────────────────────────────────────────┘
```

**Key Design Principles:**
- **Local-first:** Zero paid API dependencies by default
- **Deterministic grounding:** Tool-calling against verified data, never hallucinated recommendations
- **Multi-tenant isolation:** Per-user authorization with strict cross-tenant prevention
- **Data provenance:** Every observation tagged with spatial resolution, sensor, and limitations
- **Edge-ready:** Runs on low-power hardware (Raspberry Pi evaluated)

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** & **npm**
- **Git**

### 1. Backend Setup (FastAPI at `:8000`)

```bash
# Clone and enter the project
cd FieldShift

# Activate Python virtual environment
# Windows (PowerShell):
.\backend\venv\Scripts\Activate.ps1
# Linux/macOS:
source backend/venv/bin/activate

# Install dependencies (if needed)
pip install -r backend/requirements.txt

# Seed demo farms and baseline knowledge
python scripts/seed_demo_data.py

# Start the FastAPI server
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API documentation: `http://localhost:8000/docs`

### 2. Frontend Setup (Next.js at `:3000`)

```bash
cd FieldShift/frontend

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

Application: `http://localhost:3000`

### 3. Running the Test Suite

From the project root with venv active:

```bash
cd backend
python -m pytest -v
```

All 7 test suites pass:

| Test Suite | Coverage |
|---|---|
| `test_assistant.py` | AI Farm Assistant & Tool Calling |
| `test_carbon.py` | Carbon Eligibility, Yields & Evidence |
| `test_environment.py` | NASA GPM, POWER, SMAP, NDVI/NDMI |
| `test_farms_auth.py` | Farm Registration, Geodesic Area & Multi-Tenant Isolation |
| `test_rotation_digital_twin.py` | Rotation Optimizer & What-If Simulator |
| `test_soil_terrain_crops.py` | SoilGrids, Lab Tests, NASADEM & Crop Suitability |
| `test_tasks_reports.py` | Condition Alerts, Task CRUD & Decision Dossiers |

---

## ⚙️ Environment Variables (Optional)

| Variable | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini LLM for enhanced AI Assistant responses | Not set (local engine used) |

> **Note:** FieldShift AI is fully functional without any external API keys. The Gemini integration is an optional enhancement that gracefully falls back to the local deterministic engine.

---

## 🔒 Scientific Safeguards & Integrity

1. **No Hallucinated Fertilizers:** Synthetic N-P-K nutrient recommendations are strictly suppressed until a certified physical soil test from a Krishi Bhavan laboratory is entered.
2. **Honest Carbon Credit Modeling:** FieldShift AI does not issue carbon credits. Projections are displayed as conservative low/expected/high ranges with aggregator fee deductions, acknowledging that smallholders (1–3 acres) require collective FPO pooling.
3. **Multi-Tenant Isolation:** Per-user authorization checks strictly prevent cross-tenant field inspection (HTTP 403 Forbidden).
4. **Data Provenance:** Every satellite observation is tagged with its spatial resolution, temporal cadence, sensor name, and scientific limitations.
5. **Deterministic AI Grounding:** The AI Farm Assistant uses rule-based tool-calling against live telemetry. It never fabricates agronomic data.

---

## 📂 Project Structure

```
FieldShift/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route handlers
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Core business logic
│   │       ├── ai_assistant_service.py    # Multilingual AI + IPM + tool dispatch
│   │       ├── carbon_service.py          # Carbon credit eligibility & modeling
│   │       ├── crop_service.py            # 18-crop knowledge base & suitability
│   │       ├── digital_twin_service.py    # Farm virtual replica & simulation
│   │       ├── nasa_power_service.py      # NASA POWER agroclimatology
│   │       ├── report_service.py          # Decision dossier generation
│   │       ├── rotation_optimizer.py      # 3-strategy rotation planner
│   │       ├── smap_service.py            # NASA SMAP L4 soil moisture
│   │       ├── soil_service.py            # SoilGrids + lab test calibration
│   │       ├── task_service.py            # Condition-triggered task engine
│   │       ├── terrain_service.py         # NASADEM elevation & TWI
│   │       └── vegetation_service.py      # Landsat/Sentinel NDVI/NDMI
│   └── tests/                   # 7 comprehensive test suites
├── frontend/
│   ├── app/                     # Next.js 16 App Router pages
│   │   ├── assistant/           # AI Farm Assistant (multilingual, STT/TTS)
│   │   ├── carbon/              # Carbon Credit Readiness
│   │   ├── digital-twin/        # Predictive Digital Twin
│   │   ├── earth-intelligence/  # NASA Earth Observations
│   │   ├── farms/               # Farm Registration & Maps
│   │   ├── reports/             # Decision Dossier Export
│   │   ├── rotation/            # Crop Rotation Optimizer
│   │   ├── soil/                # Soil Intelligence
│   │   ├── tasks/               # Task Manager
│   │   └── terrain/             # Terrain & Drainage Analysis
│   ├── components/              # Shared UI components
│   ├── context/                 # React context (Auth)
│   └── lib/                     # API client & utilities
├── scripts/                     # Seed data & utilities
└── docs/                        # Architecture documentation
```

---

## 👥 Authors

- **Team:** ChungusReloaded (Solo Development)
- **Competition:** NASA Space Apps Challenge 2026
