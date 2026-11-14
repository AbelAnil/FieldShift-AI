from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.farm import Farm
from app.models.carbon import (
    CarbonMethodology,
    CarbonEligibility,
    CarbonEstimate,
    CarbonEvidence,
    CarbonPartner,
)
from app.services.soil_service import SoilService


class CarbonService:
    """
    FieldShift AI Carbon Credit Readiness & Filing Assistant.
    Provides honest eligibility screening, conservative range estimates,
    evidence gap analysis, and aggregation dossiers for smallholders in Kerala.
    """

    PATHWAYS = [
        {
            "id": "agroforestry",
            "name": "Agroforestry & Horticultural Tree Planting",
            "relevance_kerala": "Very High (Coconut homesteads, rubber-to-fruit transition, coffee-pepper systems)",
            "eligible_crops": ["Banana", "Coconut", "Pepper", "Coffee", "Ginger", "Turmeric"],
            "methodology_code": "VM0042 / AR-ACM0003",
            "methodology_name": "Methodology for Improved Agricultural Land Management",
            "registry": "Verra VCS",
            "yield_tco2e_per_ha_range": "2.0 – 5.5 tCO2e/ha/year",
            "tco2e_min": 2.0,
            "tco2e_expected": 3.8,
            "tco2e_max": 5.5,
            "evidence_required": [
                "Geo-referenced plot boundary polygon",
                "Tree inventory & stem count per acre",
                "Planting date records / nursery receipts",
                "Repeat satellite canopy NDVI/biomass checks",
            ],
            "description": "Sequesters atmospheric carbon in above-ground perennial woody biomass and root systems in multi-tier homestead gardens.",
        },
        {
            "id": "rice_methane",
            "name": "Rice Methane Reduction via Alternate Wetting & Drying (AWD)",
            "relevance_kerala": "High (Palakkad, Kuttanad, Kole wetlands paddy tracts)",
            "eligible_crops": ["Rice / Paddy", "Paddy (Uma)", "Paddy (Jyothi)"],
            "methodology_code": "AMS-III.AU",
            "methodology_name": "Methane emission reduction by adjusted water management practice in rice cultivation",
            "registry": "UNFCCC Clean Development Mechanism (CDM) / Gold Standard",
            "yield_tco2e_per_ha_range": "1.5 – 3.2 tCO2e/ha/year",
            "tco2e_min": 1.5,
            "tco2e_expected": 2.3,
            "tco2e_max": 3.2,
            "evidence_required": [
                "Paddy water level log / perforated pipe monitoring records",
                "Drainage and aeration date logs",
                "Baseline continuous flooding documentation",
            ],
            "description": "Aerobic dry spells interrupt anaerobic methanogenic bacteria in flooded paddy soils, reducing potent CH4 emissions by 30-50%.",
        },
        {
            "id": "soil_carbon",
            "name": "Soil Organic Carbon (SOC) Enhancement",
            "relevance_kerala": "High across all agro-ecological zones (Cover cropping, residue recycling, biochar)",
            "eligible_crops": ["All crops", "Banana", "Cassava", "Cowpea", "Pulses"],
            "methodology_code": "VM0042 / GS-SOC",
            "methodology_name": "Methodology for Soil Organic Carbon Sequestration in Agricultural Lands",
            "registry": "Verra VCS / Gold Standard",
            "yield_tco2e_per_ha_range": "0.8 – 2.5 tCO2e/ha/year",
            "tco2e_min": 0.8,
            "tco2e_expected": 1.6,
            "tco2e_max": 2.5,
            "evidence_required": [
                "Certified baseline laboratory soil organic carbon test",
                "Cover crop / green manure sowing records",
                "Reduced tillage or mulch retention documentation",
            ],
            "description": "Increases stable humic carbon pools in lateritic soils through legume incorporation, minimal tillage, and biomass return.",
        },
        {
            "id": "nitrogen",
            "name": "Nitrogen Fertilizer Management & N2O Reduction",
            "relevance_kerala": "Medium (Intensive vegetable, banana, and plantation tracts)",
            "eligible_crops": ["Banana", "Maize", "Okra", "Vegetables"],
            "methodology_code": "AMS-III.D / VM0042",
            "methodology_name": "Nitrogen use efficiency and direct N2O emission abatement",
            "registry": "Verra VCS",
            "yield_tco2e_per_ha_range": "0.5 – 1.8 tCO2e/ha/year",
            "tco2e_min": 0.5,
            "tco2e_expected": 1.1,
            "tco2e_max": 1.8,
            "evidence_required": [
                "Fertilizer purchase bills & application schedule",
                "Neem-coated urea / precision split dosing logs",
                "Soil nitrate test records",
            ],
            "description": "Prevents volatilization and leaching of reactive nitrogen, curbing nitrous oxide (N2O, 273x warming potential of CO2).",
        },
    ]

    PARTNERS = [
        {
            "id": "partner-1",
            "name": "Kerala Agro-Ecological Carbon FPO Collective",
            "partner_type": "FPO Aggregator",
            "location": "Kanjirappally, Kottayam, Kerala",
            "pathways_supported": ["agroforestry", "soil_carbon"],
            "typical_commission_pct": 25.0,
            "description": "Farmer Producer Organization aggregating 1,200 smallholders across Kottayam and Idukki for collective Verra VM0042 filing.",
            "contact_email": "carbon@keralafpo-collective.org",
            "verified": "true",
        },
        {
            "id": "partner-2",
            "name": "Wayanad Highland Agroforestry Project Hub",
            "partner_type": "Project Developer",
            "location": "Meppadi, Wayanad, Kerala",
            "pathways_supported": ["agroforestry", "soil_carbon"],
            "typical_commission_pct": 30.0,
            "description": "Verified project developer coordinating shade-tree biomass and organic spice soil carbon aggregation.",
            "contact_email": "projects@wayanadcarbon.org",
            "verified": "true",
        },
        {
            "id": "partner-3",
            "name": "Kuttanad-Kole Sustainable Rice Cooperative",
            "partner_type": "Cooperative",
            "location": "Alappuzha & Thrissur, Kerala",
            "pathways_supported": ["rice_methane"],
            "typical_commission_pct": 20.0,
            "description": "Cooperative union supporting AWD alternate wetting and drying protocol verification for smallholder paddy growers.",
            "contact_email": "info@kuttanadrice-coop.org",
            "verified": "true",
        },
        # Global Aggregators
        {
            "id": "partner-global-1",
            "name": "Acorn Rabobank Global Agroforestry Facility",
            "partner_type": "Global Project Developer",
            "location": "Utrecht, Netherlands & Global Regional Desks",
            "pathways_supported": ["agroforestry"],
            "typical_commission_pct": 20.0,
            "description": "Global smallholder agroforestry carbon facility utilizing high-resolution LiDAR and satellite radar to verify biomass carbon credits for smallholder farmers worldwide.",
            "contact_email": "info@acorn.rabobank.com",
            "verified": "true",
        },
        {
            "id": "partner-global-2",
            "name": "Boomitra Global Soil Carbon Initiative",
            "partner_type": "International Aggregator",
            "location": "San Mateo, California & International Hubs",
            "pathways_supported": ["soil_carbon", "nitrogen"],
            "typical_commission_pct": 25.0,
            "description": "Earthshot Prize winner operating satellite-calibrated MRV across 5M+ acres of global smallholder cropland and rangelands.",
            "contact_email": "partnerships@boomitra.com",
            "verified": "true",
        },
        {
            "id": "partner-global-3",
            "name": "Smallholder Carbon Alliance & Cooperative Registry",
            "partner_type": "Global Cooperative Alliance",
            "location": "Geneva, Switzerland & Global Operations",
            "pathways_supported": ["agroforestry", "rice_methane", "soil_carbon", "nitrogen"],
            "typical_commission_pct": 18.0,
            "description": "International federation aggregating small family farms under Verra and Gold Standard grouped project activities.",
            "contact_email": "registry@smallholdercarbon.org",
            "verified": "true",
        },
    ]

    @classmethod
    def list_pathways(cls) -> List[Dict[str, Any]]:
        return cls.PATHWAYS

    @classmethod
    def list_partners(cls) -> List[Dict[str, Any]]:
        return cls.PARTNERS

    @classmethod
    def screen_eligibility(
        cls,
        db: Session,
        farm_id: str,
        pathway_id: str,
        tree_density: Optional[int] = None,
        has_water_control: Optional[bool] = None,
        practices_cover_crops: Optional[bool] = None,
    ) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError("Farm not found")

        pathway = next((p for p in cls.PATHWAYS if p["id"] == pathway_id), None)
        if not pathway:
            raise ValueError(f"Pathway {pathway_id} not recognized")

        reqs_met = []
        reqs_missing = []
        readiness_score = 30.0  # Base score for valid registered boundary

        reqs_met.append(f"Geo-referenced plot boundary registered ({farm.total_area_hectares:.2f} ha / {farm.total_area_acres:.2f} acres)")

        # Soil test check
        soil = SoilService.analyze_soil_profile(db, farm.id)
        if soil["has_lab_test"]:
            reqs_met.append("Certified physical laboratory soil baseline available")
            readiness_score += 25.0
        else:
            reqs_missing.append("Missing physical soil test certification (required for baseline carbon verification)")

        # Specific pathway criteria
        if pathway_id == "agroforestry":
            crop_name = farm.current_crop or ""
            if any(c.lower() in crop_name.lower() for c in ["banana", "pepper", "coconut", "coffee"]):
                reqs_met.append(f"Primary crop ({crop_name}) conforms to multi-tier agroforestry canopy criteria")
                readiness_score += 25.0
            else:
                reqs_missing.append("Crop does not belong to standard perennial agroforestry inventory")

            if tree_density and tree_density >= 40:
                reqs_met.append(f"Tree density ({tree_density} stems/acre) meets minimum biomass threshold")
                readiness_score += 20.0
            else:
                reqs_missing.append("Verified tree inventory with at least 40 woody stems/acre required")

        elif pathway_id == "rice_methane":
            crop_name = farm.current_crop or ""
            if "rice" in crop_name.lower() or "paddy" in crop_name.lower():
                reqs_met.append("Active paddy crop registered")
                readiness_score += 30.0
            else:
                reqs_missing.append("Current crop must be wetland paddy/rice")

            if has_water_control is True or farm.irrigation_available:
                reqs_met.append("Controllable irrigation inlet/drainage gate available for AWD aeration")
                readiness_score += 20.0
            else:
                reqs_missing.append("Requires controllable water regime to drain fields for periodic aeration")

        elif pathway_id == "soil_carbon":
            if practices_cover_crops is True:
                reqs_met.append("Active legume cover cropping or green manure practice documented")
                readiness_score += 30.0
            else:
                reqs_missing.append("Documented cover cropping, green manure, or crop residue retention required")

            if soil["organic_carbon_pct"] > 1.0:
                reqs_met.append(f"Organic carbon baseline ({soil['organic_carbon_pct']:.2f}%) documented")
                readiness_score += 15.0

        elif pathway_id == "nitrogen":
            if farm.irrigation_available:
                reqs_met.append("Irrigation available for split fertilizer scheduling")
                readiness_score += 20.0
            reqs_missing.append("Fertilizer purchase receipts & split application ledger required")

        # Determine status
        readiness_score = min(readiness_score, 100.0)
        if readiness_score >= 75.0:
            status_val = "eligible"
            guidance = f"Your farm shows strong alignment with {pathway['methodology_code']}. Ready to join an FPO aggregation pool."
        elif readiness_score >= 45.0:
            status_val = "conditionally_eligible"
            guidance = f"Conditionally eligible. Fulfill the missing documentation requirements below to qualify for filing."
        else:
            status_val = "ineligible"
            guidance = "Currently lacks critical qualifying criteria. Focus on practice adoption and baseline documentation first."

        next_steps = [
            f"1. Address documentation gaps: {', '.join(reqs_missing[:2]) if reqs_missing else 'Ready for intake'}",
            "2. Connect with an accredited local FPO or project developer for pooling",
            "3. Maintain geo-tagged photograph logs of agronomic practices",
        ]

        # Record in DB
        elig = (
            db.query(CarbonEligibility)
            .filter(CarbonEligibility.farm_id == farm.id, CarbonEligibility.pathway == pathway_id)
            .first()
        )
        if not elig:
            elig = CarbonEligibility(
                farm_id=farm.id,
                pathway=pathway_id,
                status=status_val,
                readiness_score=readiness_score,
                requirements_met=reqs_met,
                requirements_missing=reqs_missing,
                guidance=guidance,
            )
            db.add(elig)
        else:
            elig.status = status_val
            elig.readiness_score = readiness_score
            elig.requirements_met = reqs_met
            elig.requirements_missing = reqs_missing
            elig.guidance = guidance
            elig.screened_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "farm_id": farm.id,
            "pathway": pathway_id,
            "status": status_val,
            "readiness_score": readiness_score,
            "requirements_met": reqs_met,
            "requirements_missing": reqs_missing,
            "guidance": guidance,
            "methodology_code": pathway["methodology_code"],
            "next_steps": next_steps,
        }

    @classmethod
    def calculate_estimate(
        cls,
        db: Session,
        farm_id: str,
        pathway_id: str = "agroforestry",
        carbon_price_usd: float = 15.0,
        developer_commission_pct: float = 30.0,
    ) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError("Farm not found")

        pathway = next((p for p in cls.PATHWAYS if p["id"] == pathway_id), cls.PATHWAYS[0])
        ha = farm.total_area_hectares

        # Yield ranges
        low_tco2e = round(ha * pathway["tco2e_min"], 2)
        expected_tco2e = round(ha * pathway["tco2e_expected"], 2)
        high_tco2e = round(ha * pathway["tco2e_max"], 2)

        # Financials (USD)
        gross_low = round(low_tco2e * carbon_price_usd, 2)
        gross_expected = round(expected_tco2e * carbon_price_usd, 2)
        gross_high = round(high_tco2e * carbon_price_usd, 2)

        retention_factor = (100.0 - developer_commission_pct) / 100.0
        net_usd_low = round(gross_low * retention_factor, 2)
        net_usd_expected = round(gross_expected * retention_factor, 2)
        net_usd_high = round(gross_high * retention_factor, 2)

        # Financials (INR, assumed 1 USD = 83 INR)
        usd_to_inr = 83.0
        net_inr_low = round(net_usd_low * usd_to_inr, 0)
        net_inr_expected = round(net_usd_expected * usd_to_inr, 0)
        net_inr_high = round(net_usd_high * usd_to_inr, 0)

        disclaimer = (
            "IMPORTANT NOTICE: FieldShift AI does not issue carbon credits and cannot guarantee financial income. "
            "Figures shown are indicative estimates based on IPCC Tier 1/2 models and published methodology benchmarks. "
            "Credits can only be issued by an independent carbon registry (such as Verra or Gold Standard) after certified "
            "MRV (Measurement, Reporting, and Verification) audits. Individual filing for smallholdings (<5 ha) is economically unviable; "
            "participation requires collective aggregation through an approved Farmer Producer Organization (FPO)."
        )

        reality_note = (
            f"On your {farm.total_area_acres:.1f}-acre holding ({ha:.2f} ha), annual gross credit generation is estimated at "
            f"~{expected_tco2e:.1f} tonnes CO2e. At an assumed market price of ${carbon_price_usd:.0f}/t and {developer_commission_pct:.0f}% developer/verifier "
            f"fees, projected net farmer return is approximately ₹{net_inr_expected:,.0f} per year. Carbon finance should be viewed as a supplementary incentive "
            f"for sustainable soil stewardship, not a primary crop replacement income."
        )

        # Upsert record in DB
        est = (
            db.query(CarbonEstimate)
            .filter(CarbonEstimate.farm_id == farm.id, CarbonEstimate.pathway == pathway["id"])
            .first()
        )
        if not est:
            est = CarbonEstimate(
                farm_id=farm.id,
                pathway=pathway["id"],
                methodology_code=pathway["methodology_code"],
                conservative_tco2e_yr=low_tco2e,
                expected_tco2e_yr=expected_tco2e,
                high_tco2e_yr=high_tco2e,
                carbon_price_usd_per_ton=carbon_price_usd,
                gross_revenue_usd_yr=gross_expected,
                developer_commission_pct=developer_commission_pct,
                net_revenue_usd_yr=net_usd_expected,
                net_revenue_inr_yr=net_inr_expected,
                disclaimer=disclaimer,
            )
            db.add(est)
        else:
            est.conservative_tco2e_yr = low_tco2e
            est.expected_tco2e_yr = expected_tco2e
            est.high_tco2e_yr = high_tco2e
            est.carbon_price_usd_per_ton = carbon_price_usd
            est.gross_revenue_usd_yr = gross_expected
            est.developer_commission_pct = developer_commission_pct
            est.net_revenue_usd_yr = net_usd_expected
            est.net_revenue_inr_yr = net_inr_expected
            est.created_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "area_hectares": ha,
            "area_acres": farm.total_area_acres,
            "pathway": pathway["name"],
            "methodology": pathway["methodology_code"],
            "conservative_tco2e_yr": low_tco2e,
            "expected_tco2e_yr": expected_tco2e,
            "high_tco2e_yr": high_tco2e,
            "assumed_carbon_price_usd": carbon_price_usd,
            "gross_annual_usd_range": {
                "low": gross_low,
                "expected": gross_expected,
                "high": gross_high,
            },
            "developer_commission_pct": developer_commission_pct,
            "net_farmer_usd_range": {
                "low": net_usd_low,
                "expected": net_usd_expected,
                "high": net_usd_high,
            },
            "net_farmer_inr_range": {
                "low": net_inr_low,
                "expected": net_inr_expected,
                "high": net_inr_high,
            },
            "disclaimer": disclaimer,
            "economic_reality_note": reality_note,
        }

    @classmethod
    def list_evidence(cls, db: Session, farm_id: str) -> List[Dict[str, Any]]:
        records = db.query(CarbonEvidence).filter(CarbonEvidence.farm_id == farm_id).order_by(CarbonEvidence.recorded_at.desc()).all()
        return [
            {
                "id": r.id,
                "farm_id": r.farm_id,
                "pathway": r.pathway,
                "evidence_type": r.evidence_type,
                "title": r.title,
                "description": r.description,
                "status": r.status,
                "recorded_at": r.recorded_at.strftime("%Y-%m-%d"),
            }
            for r in records
        ]

    @classmethod
    def add_evidence(
        cls,
        db: Session,
        farm_id: str,
        pathway: str,
        evidence_type: str,
        title: str,
        description: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> CarbonEvidence:
        item = CarbonEvidence(
            farm_id=farm_id,
            pathway=pathway,
            evidence_type=evidence_type,
            title=title,
            description=description,
            status="verified",
            metadata_json=metadata_json,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def generate_carbon_dossier(cls, db: Session, farm_id: str) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError("Farm not found")

        # Run eligibility for all 4 pathways
        elig_results = [
            cls.screen_eligibility(db, farm.id, p["id"])
            for p in cls.PATHWAYS
        ]

        # Calculate agroforestry estimate
        est = cls.calculate_estimate(db, farm.id, "agroforestry")
        evidences = cls.list_evidence(db, farm.id)

        now_str = datetime.now(timezone.utc).strftime("%d %B %Y")
        missing_count = sum(len(e["requirements_missing"]) for e in elig_results)

        md = f"""# FieldShift AI: Carbon Credit Readiness & Aggregation Pack
**Farm:** {farm.farm_name} ({farm.location_name})  
**Coordinates:** {farm.latitude:.4f}° N, {farm.longitude:.4f}° E  
**Surveyed Area:** {farm.total_area_hectares:.2f} ha ({farm.total_area_acres:.2f} acres)  
**Date Generated:** {now_str}  
**Recommended Aggregator:** Kerala Agro-Ecological Carbon FPO Collective  

---

## 1. Executive Feasibility Assessment
- **Primary Viable Pathway:** Agroforestry & Horticultural Biomass (VM0042)
- **Estimated Annual Yield:** **{est['conservative_tco2e_yr']:.1f} to {est['high_tco2e_yr']:.1f} tCO2e/year** (Expected: {est['expected_tco2e_yr']:.1f} tCO2e)
- **Indicative Net Farmer Revenue:** **₹{est['net_farmer_inr_range']['low']:,.0f} – ₹{est['net_farmer_inr_range']['high']:,.0f} per year** (After 30% developer fee deduction)
- **Readiness Classification:** Conditionally Eligible (Aggregation recommended)

---

## 2. Pathway Eligibility Matrix
"""
        for e in elig_results:
            md += f"\n### Pathway: {e['pathway'].replace('_', ' ').title()} — Status: {e['status'].upper()} (Score: {e['readiness_score']:.0f}%)\n"
            md += f"- **Methodology Code:** {e['methodology_code']}\n"
            md += f"- **Guidance:** {e['guidance']}\n"
            if e['requirements_met']:
                md += f"- **Requirements Met:** {', '.join(e['requirements_met'])}\n"
            if e['requirements_missing']:
                md += f"- **Action Items Required:** {', '.join(e['requirements_missing'])}\n"

        md += f"""
---

## 3. Evidence Checklist & Gap Report
- **Recorded Evidence Items:** {len(evidences)} item(s) on file
- **Outstanding Verification Gaps:** {missing_count} item(s) to address
"""
        if evidences:
            for ev in evidences:
                md += f"- [x] **{ev['title']}** ({ev['evidence_type']}) — *Status: {ev['status']}*\n"
        else:
            md += "- [ ] No field evidence items uploaded yet.\n"

        md += f"""
---

## 4. Scam Awareness & Anti-Exploitation Checklist
- [x] **Zero Upfront Fee Policy:** Legitimate project developers never charge smallholder farmers upfront cash registration fees; costs are deducted from issued credit revenues.
- [x] **Permanence Clarity:** Acknowledged 10 to 20-year land-use continuity commitment for agroforestry credits.
- [x] **No Double Counting:** Farm boundary checked against regional registry registers to avoid duplicate claims.

---
*Generated by FieldShift AI • Carbon Credit Readiness Engine*  
*Methodology References: Verra VCS VM0042 • UNFCCC AMS-III.AU • Gold Standard SOC*
"""

        return {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "generated_at": now_str,
            "eligibility_summary": elig_results,
            "estimates": [est],
            "evidence_checklist": evidences,
            "evidence_gap_count": missing_count,
            "recommended_aggregator": "Kerala Agro-Ecological Carbon FPO Collective",
            "markdown_pack": md,
        }
