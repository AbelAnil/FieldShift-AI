# 🌱 FieldShift AI

> **NASA Space Apps Challenge 2026** — *Field Shift: Adapting Farms with NASA Data*  
> **Team:** ChungusReloaded (Solo Development)  
> **Initial Pilot Region:** Kerala, India  
> **Documentation Version:** 3.0 Consolidated Final Plan  

FieldShift AI is an agricultural decision-support platform that transforms NASA Earth observations into actionable farm decisions. For each registered field, it creates a farm-level predictive **digital twin** combining satellite observations, soil intelligence, terrain hydrology, and crop knowledge. It powers crop suitability scoring, three multi-year crop rotation strategies (Soil Health, Water Efficiency, and Balanced), what-if simulation, and a context-aware AI Farm Assistant.

```text
NASA Earth Data → Environmental Analysis → Farm Digital Twin → Crop Suitability → Rotation Optimization → AI Guidance → Actionable Farm Tasks
```

---

## 🏗️ Architecture & Technology Stack

- **Architecture:** Modular Monolith (FastAPI backend + Next.js frontend + PostgreSQL/PostGIS)
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, MapLibre GL JS, Terra Draw, Recharts
- **Backend:** Python 3.11, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy
- **Data Integrations:** NASA GPM IMERG, NASA SMAP, NASA POWER, Landsat 8/9, ISRIC SoilGrids, NASADEM
- **Local Development:** Windows Laptop (Lenovo LOQ) • Local-first, zero paid API dependencies

---

## 🚀 Quickstart Guide (Phase 0: Foundation Application)

Follow these steps to run FieldShift AI locally from a fresh clone.

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 24+** & **npm 11+** installed
- **Git** installed

### 2. Backend Setup (FastAPI at `:8000`)
```bash
# 1. Navigate to the project root
cd FieldShift

# 2. Create the Python virtual environment
python -m venv backend/venv

# 3. Activate the virtual environment
# Windows (PowerShell):
.\backend\venv\Scripts\Activate.ps1
# Windows (cmd):
.\backend\venv\Scripts\activate.bat
# Linux/macOS:
source backend/venv/bin/activate

# 4. Install backend dependencies
pip install -r backend/requirements.txt

# 5. Start the FastAPI development server
# (Ensure PYTHONPATH includes backend)
$env:PYTHONPATH="backend"    # In PowerShell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Telemetry Endpoint: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Frontend Setup (Next.js at `:3000`)
Open a second terminal window:
```bash
cd FieldShift/frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open your browser at **[http://localhost:3000](http://localhost:3000)**. The dashboard will automatically poll the backend at `:8000/api/health` and display the live **"Backend Online"** green indicator in the header.

---

## 🗺️ Phased Roadmap Status

| Phase | Milestone | Status | Deliverable |
|---|---|:---:|---|
| **Phase 0** | **Foundation Application** | ✅ **COMPLETE** | Working Next.js shell + FastAPI backend with live `/api/health` connectivity |
| **Phase 1** | **Database, Farm Registration & Map Boundaries** | ⏳ *Next* | PostgreSQL + PostGIS, SQLAlchemy ORM, MapLibre GL polygon field drawing |
| **Phase 2** | **NASA Earth Observation Engine** | 📋 *Queued* | GPM rainfall totals, NASA POWER climate, Landsat/Sentinel NDVI & NDMI |
| **Phase 3** | **Soil & Terrain Intelligence** | 📋 *Queued* | Farmer soil test entry, SoilGrids estimates, NASADEM slope & drainage |
| **Phase 4** | **Crop Knowledge & Suitability Engine** | 📋 *Queued* | Kerala crop database (10-15 crops) & transparent weighted scoring |
| **Phase 5** | **Crop Rotation Optimization** | 📋 *Queued* | Multi-year strategy optimizer (Soil Health, Water Efficiency, Balanced) |
| **Phase 6** | **Predictive Farm Digital Twin** | 📋 *Queued* | State snapshots, risk indicators, and what-if simulation engine |
| **Phase 7** | **AI Farm Assistant** | 📋 *Queued* | Tool-connected conversational agent with agronomic guardrails |
| **Phase 8** | **Tasks, Reminders & Reports** | 📋 *Queued* | Condition-based activity triggers & compliance PDF dossiers |
| **Phase 9** | **Deployment & Portability** | 📋 *Queued* | Docker Compose & Raspberry Pi deployment evaluation |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system specification.
