import re
import os
import json
from typing import Dict, Any, List, Tuple, Optional
import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.farm import Farm
from app.models.task import Task
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.services.digital_twin_service import DigitalTwinService
from app.services.soil_service import SoilService
from app.services.crop_service import CropService
from app.services.rotation_optimizer import RotationOptimizer
from app.services.carbon_service import CarbonService

settings = get_settings()

# Comprehensive Crop Agronomy & Pest Knowledge Base grounded in Kerala Agricultural University (KAU) & ICAR
CROP_AGRONOMY_KB = {
    "banana": {
        "crop_name": "Banana (Nendran / Robusta / Poovan)",
        "scientific_name": "Musa paradisiaca",
        "family": "Musaceae",
        "varieties": "Nendran (Nedunendran, Zanzibar), Robusta, Grand Naine, Palayamkodan, Poovan, Rasthali",
        "planting_window": "August-September (Onam crop) or March-April (Summer irrigated)",
        "spacing": "2.0 m x 2.0 m for Nendran (2,500 plants/ha); 2.4 m x 2.4 m for Robusta",
        "water_requirement": "1,200 – 1,600 mm total (15-20 litres/plant/day via drip in summer)",
        "soil_pref": "Deep, well-drained fertile loam; pH 6.0 – 7.5. Avoid heavy waterlogged clays.",
        "fertilizer_schedule": (
            "Per plant: 10-15 kg well-decomposed Farm Yard Manure (FYM) at planting. "
            "Basal NPK: 200g N, 200g P₂O₅, 400g K₂O per plant split across 2nd, 3rd, 4th, and 5th months. "
            "Note: NPK application requires certified soil test verification."
        ),
        "key_pests": [
            {
                "pest": "Pseudostem Weevil (Odoiporus longicollis)",
                "symptoms": "Pinhead holes on pseudostem with jelly-like exudation; yellowing of outer leaves.",
                "management": "Inject entomopathogenic fungus Beauveria bassiana (20g/L) into bore holes, maintain clean field sanitation, or insert carbaryl/swabbing."
            },
            {
                "pest": "Rhizome Weevil (Cosmopolites sordidus)",
                "symptoms": "Larval tunneling in corm, stunted growth, premature toppling in wind.",
                "management": "Dip suckers in hot water (50°C for 10 min) before planting; apply neem cake (500g/pit) and Trichoderma viride."
            },
            {
                "pest": "Banana Aphid (Pentalonia nigronervosa)",
                "symptoms": "Colonies in leaf crown axils; primary insect vector for Bunchy Top Virus.",
                "management": "Spray 2% neem oil emulsion or azadirachtin 10,000 ppm in leaf axils. Eradicate virus-infected plants immediately."
            }
        ],
        "key_diseases": [
            {
                "disease": "Sigatoka Leaf Spot (Mycosphaerella musicola)",
                "symptoms": "Spindle-shaped yellow-brown spots with grey centers on leaves; drying of leaf canopy.",
                "management": "Spray 1% Bordeaux mixture or Propiconazole (1 ml/L) with wetting agent; cut and burn heavily infected lower leaves."
            },
            {
                "disease": "Panama Wilt (Fusarium oxysporum f. sp. cubense)",
                "symptoms": "Vascular yellowing of lower leaves, splitting of pseudostem base, internal vascular browning.",
                "management": "Grow tolerant varieties (Robusta / Grand Naine); raise soil pH above 6.5 with agricultural lime; apply Trichoderma harzianum (50g/pit) with organic compost. Avoid waterlogging."
            }
        ]
    },
    "cassava": {
        "crop_name": "Cassava / Tapioca",
        "scientific_name": "Manihot esculenta",
        "family": "Euphorbiaceae",
        "varieties": "M4, H-165, H-226, Sree Padmanabha, Sree Pavithra, Sree Suvarna",
        "planting_window": "May-June (South-West monsoon) or September-October (North-East monsoon)",
        "spacing": "90 cm x 90 cm on mounds or ridges (12,345 plants/ha)",
        "water_requirement": "800 – 1,000 mm. Highly drought-tolerant once established; sensitive to waterlogging.",
        "soil_pref": "Well-drained lateritic or sandy loam soils; tolerant of acidic soils (pH 4.8 – 6.8).",
        "fertilizer_schedule": (
            "Basal FYM: 12.5 tonnes/ha. NPK: 100:50:100 kg/ha for hybrids. Apply full P and half N & K at planting, "
            "remaining N & K at 45-60 days with weeding and earthing up."
        ),
        "key_pests": [
            {
                "pest": "Whitefly (Bemisia tabaci)",
                "symptoms": "Vector transmitting Indian Cassava Mosaic Virus (ICMV); sooty mold on honeydew.",
                "management": "Install yellow sticky traps (15/ha); spray 2% neem oil or fish oil rosin soap (25g/L)."
            },
            {
                "pest": "Red Spider Mite (Tetranychus urticae)",
                "symptoms": "Dusty leaf undersides, chlorotic mottling, and premature leaf drop during dry spells.",
                "management": "Spray cold water jet or wettable sulfur (2g/L) during peak summer."
            }
        ],
        "key_diseases": [
            {
                "disease": "Cassava Mosaic Disease (CMD)",
                "symptoms": "Severe leaf distortion, yellow mosaic mottling, reduced tuber size.",
                "management": "Use certified virus-free setts from ICAR-CTCRI; rogue and destroy infected plants during first 60 days."
            },
            {
                "disease": "Tuber Rot (Phytophthora & Pythium)",
                "symptoms": "Soft, foul-smelling rot of underground tubers during prolonged waterlogging.",
                "management": "Ensure elevated ridge/mound planting and clear furrow drainage."
            }
        ]
    },
    "ginger": {
        "crop_name": "Ginger (Varada / Rio de Janeiro)",
        "scientific_name": "Zingiber officinale",
        "family": "Zingiberaceae",
        "varieties": "Varada, Rejatha, Mahima, Rio de Janeiro, Maran",
        "planting_window": "First fortnight of April with summer pre-monsoon showers",
        "spacing": "20 cm x 25 cm on raised beds (1 m width, 15 cm height, 50 cm furrow)",
        "water_requirement": "1,500 – 2,000 mm. Requires continuous moisture but zero stagnation.",
        "soil_pref": "Rich humus-rich sandy loam or laterite; pH 5.5 – 6.5. Excellent drainage mandatory.",
        "fertilizer_schedule": (
            "FYM or compost: 25-30 tonnes/ha. Seed rhizome rate: 1,500 – 1,800 kg/ha. "
            "Heavy mulching: 1st mulch at planting (12 t/ha green leaves), 2nd at 45 days (5 t/ha), 3rd at 90 days (5 t/ha)."
        ),
        "key_pests": [
            {
                "pest": "Shoot Borer (Conogethes punctiferalis)",
                "symptoms": "Bore holes on central pseudostem with frass; yellowing and death of central shoot ('dead heart').",
                "management": "Spray Bacillus thuringiensis (Bt, 2g/L) or neem seed kernel extract (NSKE 5%) at 15-day intervals."
            }
        ],
        "key_diseases": [
            {
                "disease": "Soft Rot / Rhizome Rot (Pythium aphanidermatum)",
                "symptoms": "Water-soaked lesions at pseudostem base; yellowing of lower leaves; decaying rhizome with foul odor.",
                "management": "Seed rhizome treatment with Trichoderma harzianum; drench raised beds with copper oxychloride (0.25%) or biological Trichoderma-enriched FYM. Avoid water stagnation."
            },
            {
                "disease": "Bacterial Wilt (Ralstonia solanacearum)",
                "symptoms": "Bronzing of leaf margins, rapid wilting without initial yellowing; white bacterial stream from cut stem in water.",
                "management": "Solarize seedbeds with 0.1 mm clear polythene for 30 days before planting; treat seed with Streptocycline (200 ppm)."
            }
        ]
    },
    "turmeric": {
        "crop_name": "Turmeric (Prabha / Prathibha / Alleppey Supreme)",
        "scientific_name": "Curcuma longa",
        "family": "Zingiberaceae",
        "varieties": "Prathibha (Curcumin > 6.2%), Prabha, Kanthi, Kedaram, Alleppey Supreme",
        "planting_window": "April – May with summer showers",
        "spacing": "25 cm x 25 cm on raised beds",
        "water_requirement": "1,200 – 1,800 mm. Highly responsive to organic mulching.",
        "soil_pref": "Well-drained loose loamy or alluvial soil; pH 5.5 – 7.5.",
        "fertilizer_schedule": "30-40 tonnes/ha FYM + green leaf mulch. Nitrogen-fixing intercrops highly beneficial.",
        "key_pests": [
            {
                "pest": "Shoot Borer",
                "symptoms": "Bored holes on pseudostem.",
                "management": "Spray neem oil (2%) or Bacillus thuringiensis."
            }
        ],
        "key_diseases": [
            {
                "disease": "Leaf Blotch (Taphrina maculans) & Leaf Spot (Colletotrichum capsici)",
                "symptoms": "Reddish-brown oval spots on both leaf surfaces; drying leaves.",
                "management": "Spray 1% Bordeaux mixture or Mancozeb (2g/L)."
            }
        ]
    },
    "rice": {
        "crop_name": "Rice / Paddy (Uma / Jyothi / Prathyasha)",
        "scientific_name": "Oryza sativa",
        "family": "Poaceae",
        "varieties": "Uma (MO 16), Jyothi (PTB 39), Prathyasha, Kanchana, Vytilla (saline tolerant)",
        "planting_window": "Virippu (Autumn/Kharif, May-June), Mundakan (Winter/Rabi, Sept-Oct), Puncha (Summer, Dec-Jan)",
        "spacing": "15 cm x 10 cm or 20 cm x 10 cm (transplanted); broadcast or drum seeded",
        "water_requirement": "1,200 – 1,500 mm. Alternate Wetting and Drying (AWD) reduces water use by 30% and curbs methane.",
        "soil_pref": "Clayey and silty clay lowland soils with puddle layer; pH 5.0 – 6.5.",
        "fertilizer_schedule": "Basal 5 tonnes FYM/ha. Split urea application based on leaf color chart (LCC).",
        "key_pests": [
            {
                "pest": "Brown Planthopper (Nilaparvata lugens)",
                "symptoms": "'Hopper burn' circular dry patches in field; sap sucking at base of tillers.",
                "management": "Adopt AWD water management (drain field for 3-4 days); avoid excess synthetic urea; spray neem extract."
            },
            {
                "pest": "Yellow Stem Borer (Scirpophaga incertulas)",
                "symptoms": "'Dead heart' in vegetative stage and 'white earhead' during panicle emergence.",
                "management": "Install pheromone traps (12/ha); release egg parasitoid Trichogramma japonicum (100,000/ha)."
            }
        ],
        "key_diseases": [
            {
                "disease": "Rice Blast (Magnaporthe oryzae)",
                "symptoms": "Spindle-shaped eye lesions with grey centers on leaves; neck rot resulting in empty panicles.",
                "management": "Foliar spray of Pseudomonas fluorescens (20g/L) at heading; avoid late heavy nitrogen dosing."
            },
            {
                "disease": "Sheath Blight (Rhizoctonia solani)",
                "symptoms": "Serpentine water-soaked lesions on leaf sheath near water line.",
                "management": "Spray Trichoderma or Validamycin (2ml/L); maintain proper plant spacing."
            }
        ]
    },
    "pepper": {
        "crop_name": "Black Pepper",
        "scientific_name": "Piper nigrum",
        "family": "Piperaceae",
        "varieties": "Panniyur 1 to 5, Karimunda, Thevam, Girimunda",
        "planting_window": "May-June on living standard trees (Erythrina, Silver oak, Garuga)",
        "spacing": "3 m x 3 m on standard trees",
        "water_requirement": "1,800 – 2,500 mm. Sensitive to dry periods during berry setting.",
        "soil_pref": "Well-drained red laterite rich in organic humus; pH 5.5 – 6.5.",
        "fertilizer_schedule": "Apply 10 kg FYM + 1 kg neem cake per vine annually with pre-monsoon showers.",
        "key_pests": [
            {
                "pest": "Pollu Beetle (Longitarsus nigripennis)",
                "symptoms": "Grubs bore into young berries causing hollowing ('pollu') and spike dropping.",
                "management": "Spray neem oil 2% or quinalphos (0.05%) in July and October."
            }
        ],
        "key_diseases": [
            {
                "disease": "Quick Wilt / Foot Rot (Phytophthora capsici)",
                "symptoms": "Sudden wilting of entire vine during monsoons; black rotting at collar region and roots.",
                "management": "Apply 1% Bordeaux mixture spray to canopy and Trichoderma harzianum (50g/vine in FYM) to soil in May/June and August/September. Clear base drainage."
            }
        ]
    },
    "cowpea": {
        "crop_name": "Cowpea (Lobia / Payar)",
        "scientific_name": "Vigna unguiculata",
        "family": "Fabaceae",
        "varieties": "Kanakamoni, Anaswara, Lola, Bhagyalakshmi, Sharika",
        "planting_window": "May-June, September-October, or January-February (Summer irrigated)",
        "spacing": "30 cm x 15 cm for grain/bush types; 45 cm x 30 cm for trailing types",
        "water_requirement": "350 – 500 mm. Excellent low-water legume; fixes 45-65 kg N/ha.",
        "soil_pref": "Adaptable to wide soil types; pH 5.5 – 7.2.",
        "fertilizer_schedule": "Inoculate seeds with Rhizobium culture (20g/kg). 20 kg N, 40 kg P₂O₅, 20 kg K₂O/ha.",
        "key_pests": [
            {
                "pest": "Pod Borer & Aphids",
                "symptoms": "Damaged pods with entry holes; curling of tender shoot tips.",
                "management": "Spray 2% neem oil emulsion or Beauveria bassiana."
            }
        ],
        "key_diseases": [
            {
                "disease": "Anthracnose & Collar Rot",
                "symptoms": "Sunken dark lesions on pods and stem base.",
                "management": "Seed treatment with Trichoderma viride (4g/kg)."
            }
        ]
    }
}


class AIAssistantService:
    """
    FieldShift AI Agricultural Decision-Support Assistant.
    Provider-independent engine featuring:
    - Zero paid API dependencies (runs locally, intelligently, and deterministically).
    - Optional Gemini API / OpenAI LLM pass-through if GEMINI_API_KEY is configured in .env.
    - Deep telemetry tool-calling pattern across farm twin, soil, weather, terrain, and rotation.
    - Scientific grounding in Kerala Agricultural University (KAU) Package of Practices & ICAR guidelines.
    """

    @classmethod
    async def process_query(
        cls,
        db: Session,
        farm_id: str,
        user_id: str,
        user_message: str,
        session_id: str = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise ValueError(f"Farm with ID {farm_id} not found.")

        # Detect script-based language override
        if re.search(r"[\u0D00-\u0D7F]", user_message):
            language = "ml"
        elif re.search(r"[\u0900-\u097F]", user_message):
            language = "hi"
        elif re.search(r"[\u0B80-\u0BFF]", user_message):
            language = "ta"

        # 1. Resolve or create chat session
        if not session_id:
            session = ChatSession(
                farm_id=farm.id,
                user_id=user_id,
                title=user_message[:40] + ("..." if len(user_message) > 40 else ""),
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        else:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                session = ChatSession(farm_id=farm.id, user_id=user_id, title="Farm Session")
                db.add(session)
                db.commit()
                db.refresh(session)
                session_id = session.id

        # 2. Record User Message
        user_record = ChatMessage(
            session_id=session_id,
            sender="user",
            content=user_message,
        )
        db.add(user_record)
        db.commit()

        # 3. Fetch past session turns for context memory
        recent_history = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(6)
            .all()
        )
        recent_history.reverse()

        # 4. Telemetry Tool Dispatching based on query intent
        msg_lower = user_message.lower().strip()
        tools_executed: List[Dict[str, str]] = []
        citations: List[str] = [
            "Kerala Agricultural University (KAU) Package of Practices: Crops 2024",
            "NASA Earth Science Data Systems (GPM IMERG, NASA POWER, SMAP)",
        ]

        # Always pull digital twin baseline context
        twin_data = await DigitalTwinService.get_or_create_twin(db, farm)
        tools_executed.append({
            "tool_name": "get_farm_digital_twin",
            "description": f"Retrieved digital twin telemetry for {farm.farm_name}",
            "summary_result": f"Risk: {twin_data['risk_assessment']['overall_risk_score']}/100 ({twin_data['risk_assessment']['risk_level']}), Area: {twin_data['area']['hectares']} ha, Current Crop: {twin_data['crop_state']['current_crop']}",
        })

        # 5. Check if external LLM API (e.g. Gemini) is configured
        gemini_api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if gemini_api_key and len(gemini_api_key.strip()) > 10:
            llm_reply = await cls._try_call_gemini_llm(
                api_key=gemini_api_key.strip(),
                farm=farm,
                user_msg=user_message,
                twin=twin_data,
                history=recent_history,
                tools_executed=tools_executed,
                language=language,
            )
            if llm_reply:
                reply, follow_ups = llm_reply
                return cls._save_and_return(
                    db=db,
                    session_id=session_id,
                    reply=reply,
                    tools_executed=tools_executed,
                    citations=citations,
                    follow_ups=follow_ups,
                )

        # 6. Execute Expert Local Grounded Engine with localization
        reply, follow_ups = cls._generate_grounded_response(
            db=db,
            farm=farm,
            msg=msg_lower,
            twin=twin_data,
            history=recent_history,
            tools_executed=tools_executed,
            citations=citations,
            language=language,
        )

        return cls._save_and_return(
            db=db,
            session_id=session_id,
            reply=reply,
            tools_executed=tools_executed,
            citations=citations,
            follow_ups=follow_ups,
        )

    @classmethod
    def _save_and_return(
        cls,
        db: Session,
        session_id: str,
        reply: str,
        tools_executed: List[Dict[str, str]],
        citations: List[str],
        follow_ups: List[str],
    ) -> Dict[str, Any]:
        assistant_record = ChatMessage(
            session_id=session_id,
            sender="assistant",
            content=reply,
            tools_called=tools_executed,
            citations=citations,
        )
        db.add(assistant_record)
        db.commit()
        db.refresh(assistant_record)

        return {
            "session_id": session_id,
            "message_id": assistant_record.id,
            "reply": reply,
            "tools_executed": tools_executed,
            "citations": citations,
            "suggested_follow_ups": follow_ups,
        }

    @classmethod
    def _generate_grounded_response(
        cls,
        db: Session,
        farm: Farm,
        msg: str,
        twin: Dict[str, Any],
        history: List[ChatMessage],
        tools_executed: List[Dict[str, str]],
        citations: List[str],
        language: str = "en",
    ) -> Tuple[str, List[str]]:
        soil = twin["soil_state"]
        terrain = twin["terrain_state"]
        env = twin["environmental_state"]
        veg = twin["vegetation_state"]
        crop_state = twin["crop_state"]
        risk = twin["risk_assessment"]
        active_crop_name = crop_state.get("current_crop", "Banana (Nendran / Robusta)")

        # -------------------------------------------------------------
        # Intent 0: Casual Greetings, Gratitude & Identity
        # -------------------------------------------------------------
        clean_msg = re.sub(r"[^\w\s]", "", msg).strip()
        if any(clean_msg == g or clean_msg.startswith(g + " ") for g in ["hi", "hello", "hey", "namaskar", "namaskaram", "vanakkam", "halo", "hola"]):
            tools_executed.append({
                "tool_name": "conversational_greeting",
                "description": "Acknowledged farmer greeting with contextual farm summary",
                "summary_result": f"Welcomed farmer for {farm.farm_name}",
            })
            advice = (
                f"Namaskaram! I am your **FieldShift AI Farm Assistant** for **{farm.farm_name}** ({farm.location_name}).\n\n"
                f"Your farm is currently registered with **{active_crop_name}** across {farm.total_area_acres:.1f} acres. "
                f"Our NASA satellite feeds show **{env['cumulative_rainfall_30d_mm']:.1f} mm** of 30-day rainfall, "
                f"an average temperature of **{env['avg_temperature_c']:.1f}°C**, and a soil reaction of **pH {soil['effective_ph']:.1f}**.\n\n"
                f"How can I assist your field operations today? You can ask me about **crop choices, pest/disease diagnosis, soil liming, rotation planning, what-if simulations, or carbon credits**."
            )
            follow_ups = [
                "Which crops are most suitable for my soil and climate right now?",
                "How is my soil health and do I need to apply lime?",
                "What crop rotation strategy do you recommend?",
                "Are there any pending alerts or tasks for my farm?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        if any(w in msg for w in ["thank you", "thanks", "nandi", "bye", "goodbye", "good night"]):
            return cls._localize_response(
                f"You are welcome! Best of success with **{farm.farm_name}**. "
                f"Feel free to check back anytime NASA updates your farm's precipitation, soil moisture, or vegetation vigor telemetry.",
                ["Check recent NASA rainfall", "Review pending tasks", "Explore carbon credits"],
                language,
            )

        if any(w in msg for w in ["who are you", "what can you do", "help me", "how does this work", "what are your features"]):
            return cls._localize_response(
                f"### FieldShift AI Farm Assistant Capabilities\n\n"
                f"I am a specialized agricultural decision-support engine developed for the **NASA Space Apps Challenge 2026**.\n\n"
                f"Here is what I do for **{farm.farm_name}**:\n"
                f"1. **NASA Satellite Monitoring:** Track daily precipitation (NASA GPM IMERG), surface moisture (NASA SMAP), agro-climate (NASA POWER), and canopy vigor (Landsat/Sentinel NDVI/NDMI).\n"
                f"2. **Soil & Terrain Intelligence:** Combine ISRIC SoilGrids with physical lab test intake, and NASADEM elevation with drainage flow accumulation.\n"
                f"3. **Crop Suitability & Rotation:** Evaluate multi-factor crop suitability rankings and 3-year rotation strategies grounded in KAU / ICAR agronomic research.\n"
                f"4. **Pest & Disease Advisory:** Provide organic and IPM solutions for tropical crop pests, wilts, blights, and borer attacks.\n"
                f"5. **What-If Perturbation Simulator:** Predict how extreme droughts, monsoon delays, or irrigation failure affect your yield and risk.\n"
                f"6. **Carbon Credit Guidance:** Assess eligibility for agroforestry (VM0042) and AWD rice methane reduction (AMS-III.AU) with transparent smallholder revenue ranges.",
                ["What crops are most suitable right now?", "Simulate a 40% drought scenario", "Inspect my soil acidity"],
                language,
            )

        # -------------------------------------------------------------
        # Intent 1: Pest, Disease & Foliar Health Management
        # -------------------------------------------------------------
        pest_keywords = [
            "pest", "disease", "insect", "worm", "borer", "weevil", "wilt", "rot",
            "blight", "yellow", "curl", "spot", "fungus", "neem", "spray", "pesticide",
            "trichoderma", "panama", "sigatoka", "mosaic", "aphid", "bordeaux", "damping"
        ]
        if any(w in msg for w in pest_keywords):
            tools_executed.append({
                "tool_name": "diagnose_pest_and_disease",
                "description": "Queried Kerala Agricultural University (KAU) Integrated Pest Management (IPM) guidelines",
                "summary_result": f"Diagnosed plant protection queries for {active_crop_name}",
            })
            citations.append("KAU Package of Practices: Plant Protection & Integrated Pest Management")

            # Check if a specific crop was mentioned or fall back to active crop
            target_crop_key = "banana"
            for k in CROP_AGRONOMY_KB.keys():
                if k in msg or CROP_AGRONOMY_KB[k]["crop_name"].lower() in msg:
                    target_crop_key = k
                    break
            else:
                for k in CROP_AGRONOMY_KB.keys():
                    if k in active_crop_name.lower():
                        target_crop_key = k
                        break

            kb = CROP_AGRONOMY_KB.get(target_crop_key, CROP_AGRONOMY_KB["banana"])

            pests_text = "\n".join([
                f"##### 🪲 {p['pest']}\n"
                f"- **Symptoms:** {p['symptoms']}\n"
                f"- **KAU Management:** {p['management']}\n"
                for p in kb["key_pests"]
            ])

            diseases_text = "\n".join([
                f"##### 🍄 {d['disease']}\n"
                f"- **Symptoms:** {d['symptoms']}\n"
                f"- **KAU Management:** {d['management']}\n"
                for d in kb["key_diseases"]
            ])

            advice = (
                f"### Plant Protection & Integrated Pest Management for **{kb['crop_name']}**\n\n"
                f"Grounded in Kerala Agricultural University (KAU) & ICAR agronomic guidelines:\n\n"
                f"#### Common Major Pests & Biological Control:\n"
                f"{pests_text}\n\n"
                f"#### Major Fungal & Viral Diseases:\n"
                f"{diseases_text}\n\n"
                f"#### 🌿 Core Eco-Friendly IPM Principles for Kerala:\n"
                f"- **Preventive Bio-control:** Apply *Trichoderma viride* or *T. harzianum* enriched in Farm Yard Manure (1:50 ratio) during planting to suppress soil-borne pathogens.\n"
                f"- **Neem Formulations:** Regular spraying of 2% neem oil emulsion with bar soap or azadirachtin (10,000 ppm at 2ml/L) deters sucking pests and whitefly vectors.\n"
                f"- **Drainage Management:** Over 70% of tropical fungal root rots (*Pythium*, *Phytophthora*) are triggered by waterlogged swales. Ensure drainage furrows remain clear."
            )
            follow_ups = [
                f"How do I prepare 1% Bordeaux mixture?",
                f"What is the recommended fertilizer schedule for {kb['crop_name']}?",
                f"Which crop rotation breaks these pest cycles?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 2: Specific Crop Agronomy & Cultivation Guide
        # -------------------------------------------------------------
        for crop_key, crop_info in CROP_AGRONOMY_KB.items():
            if crop_key in msg or crop_info["crop_name"].lower() in msg:
                # User is asking specifically about cultivating this crop
                if any(w in msg for w in ["how to", "cultivat", "grow", "spacing", "fertiliz", "variet", "care", "guide", "plant"]):
                    tools_executed.append({
                        "tool_name": "get_crop_agronomy_details",
                        "description": f"Retrieved comprehensive KAU cultivation package for {crop_info['crop_name']}",
                        "summary_result": f"Spacings: {crop_info['spacing']}, Water: {crop_info['water_requirement']}",
                    })
                    citations.append("KAU Package of Practices: Crops 2024")

                    advice = (
                        f"### Cultivation & Agronomy Guide: **{crop_info['crop_name']}**\n\n"
                        f"- **Scientific Classification:** `{crop_info['scientific_name']}` ({crop_info['family']})\n"
                        f"- **Recommended Regional Varieties:** {crop_info['varieties']}\n"
                        f"- **Optimal Planting Window:** {crop_info['planting_window']}\n"
                        f"- **Plant Spacing & Geometry:** {crop_info['spacing']}\n"
                        f"- **Water Requirement:** {crop_info['water_requirement']}\n"
                        f"- **Soil Preferences:** {crop_info['soil_pref']}\n\n"
                        f"#### Nutrient & Organic Manure Schedule:\n"
                        f"{crop_info['fertilizer_schedule']}\n\n"
                        f"#### Field Suitability on Your Farm:\n"
                        f"- Farm Soil pH: **{soil['effective_ph']:.1f}** ({soil['ph_category']})\n"
                        f"- 30-Day NASA Precipitation: **{env['cumulative_rainfall_30d_mm']:.1f} mm**\n"
                        f"- Mean Slope: **{terrain['slope_mean_deg']:.1f}°** ({terrain['slope_class']})"
                    )
                    follow_ups = [
                        f"What pests attack {crop_info['crop_name']} and how to cure them?",
                        f"What is the best crop rotation after {crop_info['crop_name']}?",
                        f"Simulate a drought scenario for {crop_info['crop_name']}.",
                    ]
                    return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 3: Dynamic What-If Stress Simulation
        # -------------------------------------------------------------
        if any(w in msg for w in ["simulate", "what if", "scenario", "drought", "delay", "failure", "fail", "drop by", "deficit"]):
            # Dynamic parameter extraction
            sim_crop = active_crop_name
            for k, info in CROP_AGRONOMY_KB.items():
                if k in msg:
                    sim_crop = info["crop_name"]
                    break

            # Extract rainfall percentage delta if present (e.g. -50%, 40%, 30 percent)
            pct_match = re.search(r"(\d+)\s*(?:%|percent)", msg)
            if pct_match:
                extracted_pct = float(pct_match.group(1))
                rain_delta = -extracted_pct if ("drop" in msg or "deficit" in msg or "less" in msg or "decrease" in msg or "drought" in msg or "-" in msg) else extracted_pct
            else:
                rain_delta = -35.0

            irrigation_on = "irrigation" in msg and not any(neg in msg for neg in ["no irrigation", "fail", "without", "off", "dry"])
            delay_days = 21 if "delay" in msg else 14

            tools_executed.append({
                "tool_name": "simulate_farm_scenario",
                "description": f"Perturbed digital twin with simulated {sim_crop}, {rain_delta:+.0f}% rain delta, and {'irrigated' if irrigation_on else 'rainfed'} regime",
                "summary_result": f"Projected risk and suitability score recalculated under stress scenario",
            })

            sim = DigitalTwinService.simulate_scenario(
                db=db,
                farm=farm,
                crop_name=sim_crop,
                rainfall_delta_pct=rain_delta,
                irrigation_available=irrigation_on,
                planting_delay_days=delay_days,
            )

            consequences_list = "\n".join([f"- {c}" for c in sim["consequences"]])
            advice = (
                f"### What-If Scenario Simulation Result for **{farm.farm_name}**\n\n"
                f"**Simulation Parameters Tested:**\n"
                f"- **Crop Evaluated:** {sim['scenario_inputs']['simulated_crop']}\n"
                f"- **Rainfall Perturbation:** **{sim['scenario_inputs']['rainfall_variation_pct']}** (Simulated 30d total: {sim['scenario_inputs']['simulated_30d_rain_mm']:.1f} mm)\n"
                f"- **Irrigation Status:** {'Supplemental Irrigation Active' if irrigation_on else 'Rainfed (No supplemental watering)'}\n"
                f"- **Planting Delay:** {sim['scenario_inputs']['planting_delay_days']} days\n\n"
                f"#### Projected Impact on Farm:\n"
                f"- **Recalculated Crop Suitability:** **{sim['recalculated_suitability']['score']:.1f}/100** ({sim['recalculated_suitability']['class']})\n"
                f"- **Projected Overall Risk Score:** **{sim['projected_risk_score']:.1f}/100** ({sim['projected_risk_level']})\n\n"
                f"#### Agronomic Consequences & Vulnerabilities:\n"
                f"{consequences_list}\n\n"
                f"> ℹ️ *{sim['scientific_disclaimer']}*"
            )
            follow_ups = [
                "How do I buffer against this drought risk with mulching?",
                "Which drought-resilient crop would perform better under these conditions?",
                "What crop rotation strategy conserves the most water?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 4: Multi-Year Crop Rotation Optimizer
        # -------------------------------------------------------------
        if any(w in msg for w in ["rotation", "sequence", "strategy", "rotate", "after", "preceding", "follow", "next year", "next crop"]):
            tools_executed.append({
                "tool_name": "optimize_crop_rotation",
                "description": "Generated constraint-driven multi-year rotation plans based on active crop and soil health",
                "summary_result": "Constructed 3 alternative plans: Strategy A (Soil Health), Strategy B (Water Efficiency), and Strategy C (Balanced)",
            })
            citations.append("KAU Principles of Agronomy & Cropping Systems")

            rotation_plans = RotationOptimizer.generate_strategies_for_farm(db, farm)
            strat_blocks = []
            for s in rotation_plans:
                steps_formatted = " ➔ ".join([f"**Year {step['year']}:** {step['crop_name']} ({'N₂-fixing' if step.get('nitrogen_fixation') else step['water_demand']})" for step in s['steps']])
                strat_blocks.append(
                    f"#### 🌿 {s['strategy_name']} (Overall Score: **{s['overall_score']:.1f}/100**)\n"
                    f"- **Core Rationale:** {s['rationale']}\n"
                    f"- **3-Year Trajectory:** {steps_formatted}\n"
                    f"- **Soil Health Delta:** {s['soil_health_delta']}\n"
                    f"- **Water Rating:** {s['water_efficiency_rating']}"
                )

            advice = (
                f"### Multi-Year Crop Rotation Roadmaps for **{farm.farm_name}**\n\n"
                f"Your farm is currently growing **{active_crop_name}** ({farm.total_area_acres:.1f} acres, priority: *{farm.farming_priorities}*).\n\n"
                f"Continuous monocropping depletes specific subsoil horizons and allows specialized root-knot nematodes and fungal wilts to proliferate. Here are the 3 algorithmic rotation pathways tailored to your land:\n\n"
                + "\n\n".join(strat_blocks) +
                f"\n\n#### Agronomic Benefits of Legume Rotation in Kerala:\n"
                f"- Rotating into leguminous pulses (*Vigna unguiculata* / Cowpea or Green Gram) fixes **40 to 65 kg of atmospheric N₂ per hectare** symbiotically via root nodules.\n"
                f"- This provides an immediate residual nitrogen credit for the subsequent heavy feeder and interrupts fungal life cycles."
            )
            follow_ups = [
                "Tell me more about Strategy A (Soil Health).",
                "How much nitrogen will Cowpea add to my soil?",
                "Can you check if my soil has enough moisture for a summer pulse?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 5: Crop Suitability & Recommendations
        # -------------------------------------------------------------
        if any(w in msg for w in ["crop", "plant", "grow", "recommend", "suitability", "variety", "what should i"]):
            tools_executed.append({
                "tool_name": "evaluate_crop_suitability",
                "description": "Computed multi-factor weighted crop suitability scores across regional and global crops",
                "summary_result": "Evaluated crop catalog against live soil pH, 30d rainfall, temperature, slope, and drainage",
            })
            crops_to_eval = CropService.list_crops(db)
            evaluations = []
            for c in crops_to_eval:
                res = CropService.calculate_suitability(
                    crop=c,
                    ph=soil["effective_ph"],
                    texture=soil["effective_texture"],
                    avg_temp=env["avg_temperature_c"],
                    rainfall_30d=env["cumulative_rainfall_30d_mm"],
                    irrigation_available=crop_state["irrigation_active"],
                    slope_deg=terrain["slope_mean_deg"],
                    flow_risk=terrain["flow_accumulation_risk"],
                    has_lab_test=soil["has_lab_test"],
                )
                evaluations.append(res)
            evaluations.sort(key=lambda x: x["suitability_score"], reverse=True)
            top_crops = evaluations[:4]

            crops_text = "\n".join([
                f"{i+1}. **{c['crop_name']}** (`{c['scientific_name']}`)\n"
                f"   - **Suitability Score:** **{c['suitability_score']:.1f}/100** ({c['suitability_class']})\n"
                f"   - **Duration:** {c['duration_days']}\n"
                f"   - **Key Advantage:** {', '.join(c['supporting_factors'][:2]) if c['supporting_factors'] else 'Consistent agro-climatic fit'}\n"
                f"   - **Planting Window:** {c['planting_window']}"
                for i, c in enumerate(top_crops)
            ])

            advice = (
                f"### Crop Suitability Evaluation for **{farm.farm_name}**\n\n"
                f"Evaluated against live farm telemetry:\n"
                f"- **NASA GPM 30-Day Rainfall:** **{env['cumulative_rainfall_30d_mm']:.1f} mm**\n"
                f"- **NASA POWER Mean Air Temp:** **{env['avg_temperature_c']:.1f} °C**\n"
                f"- **Soil Reaction (pH):** **{soil['effective_ph']:.1f}** ({soil['ph_category']})\n"
                f"- **Terrain Slope:** **{terrain['slope_mean_deg']:.1f}°** ({terrain['slope_class']})\n"
                f"- **Irrigation Regime:** {'Irrigation Available' if crop_state['irrigation_active'] else 'Rainfed'}\n\n"
                f"#### Top 4 Recommended Crops:\n\n{crops_text}\n\n"
                f"💡 **Agronomic Advisory:** If you are transitioning from your current crop (**{active_crop_name}**), rotating into **{top_crops[0]['crop_name']}** maximizes biological soil restoration while matching the prevailing climate envelope."
            )
            follow_ups = [
                f"How do I rotate {top_crops[0]['crop_name']} into my farm?",
                f"What are the pest issues for {top_crops[0]['crop_name']}?",
                "Simulate a drought scenario for these recommendations.",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 6: Soil Health, pH, Liming, NPK & Organic Manures
        # -------------------------------------------------------------
        if any(w in msg for w in ["soil", "ph", "acidity", "lime", "dolomite", "fertilizer", "npk", "nutrient", "organic carbon", "compost", "manure", "fym", "jeevamrutha"]):
            tools_executed.append({
                "tool_name": "get_soil_analysis",
                "description": "Queried farm soil chemical, physical, and nutrient parameters",
                "summary_result": f"Effective pH: {soil['effective_ph']} ({soil['ph_category']}), Lab test on file: {'Yes (Verified)' if soil['has_lab_test'] else 'No (ISRIC SoilGrids Modelled)'}",
            })
            citations.append("KAU Soil Science & Agricultural Chemistry Department / ICAR Soil Health Scheme")

            ph = soil["effective_ph"]
            ph_status = soil["ph_category"]
            lab_test = soil["has_lab_test"]

            if not lab_test:
                advice = (
                    f"### Soil Profile & Nutrient Status for **{farm.farm_name}**\n\n"
                    f"- **Data Source Used:** {soil['data_source_used']}\n"
                    f"- **Effective pH:** **{ph:.2f}** ({ph_status})\n"
                    f"- **Estimated Organic Carbon:** **{soil['organic_carbon_pct']:.2f}%**\n"
                    f"- **Texture Class:** {soil['effective_texture']}\n\n"
                    f"> ⚠️ **Scientific Safeguard Notice (Synthetic Fertilizer Suppression):**\n"
                    f"> Synthetic N-P-K nutrient recommendations are **withheld** for your farm because **no certified physical laboratory test is on file**! Satellite sensors and 250m SoilGrids models cannot accurately measure bioavailable nitrogen, phosphorus, or potassium.\n\n"
                    f"#### Recommended Immediate Actions:\n"
                    f"1. **Laboratory Soil Test:** Collect 8-10 composite soil cores (0-15 cm depth) across your {farm.total_area_acres:.1f}-acre plot and submit them to your local Krishi Bhavan soil testing lab.\n"
                    f"2. **Liming Strategy for Acid Laterite Soils:** Kerala soils are predominantly acidic laterite (ultisols/oxisols). At pH {ph:.1f}, fix phosphorus fixation by broadcasting **350 – 500 kg/ha of agricultural lime (CaCO₃) or dolomite (CaMg(CO₃)₂)** 2-3 weeks prior to planting.\n"
                    f"3. **Organic Matter Enhancement:** Incorporate well-decomposed Farm Yard Manure (10-15 t/ha) or grow green manure crops (*Sesbania* / *Crotalaria*) during pre-monsoon showers."
                )
            else:
                npk = soil["npk_status"]
                advice = (
                    f"### Verified Soil Health Analysis for **{farm.farm_name}**\n\n"
                    f"- **Laboratory Source:** {soil['data_source_used']}\n"
                    f"- **Measured pH:** **{ph:.2f}** ({ph_status})\n"
                    f"- **Available Nitrogen (N):** {npk.get('available_n_kg_ha', 'N/A')} kg/ha\n"
                    f"- **Available Phosphorus (P):** {npk.get('available_p_kg_ha', 'N/A')} kg/ha\n"
                    f"- **Available Potassium (K):** {npk.get('available_k_kg_ha', 'N/A')} kg/ha\n"
                    f"- **Soil Organic Carbon (SOC):** **{soil['organic_carbon_pct']:.2f}%**\n\n"
                    f"#### Agronomic Guidance (KAU Package of Practices):\n"
                    f"- **Liming:** Apply dolomite or lime 2 to 3 weeks prior to primary basal fertilizer application to prevent ammonia volatilization.\n"
                    f"- **Phosphorus Management in Acid Soils:** Use Rock Phosphate (Mussoorie Rock Phosphate) rather than water-soluble superphosphate for long-lasting residual uptake in acidic profiles.\n"
                    f"- **Potassium Dosing:** Lateritic soils have low CEC; split potassium into 2 or 3 doses across the active growing season."
                )

            follow_ups = [
                "Which crops thrive in this soil pH?",
                "How do I submit a physical soil test in the platform?",
                "Tell me about green manuring with Cowpea.",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 7: Farm Tasks, Alerts & Urgent Actions
        # -------------------------------------------------------------
        if any(w in msg for w in ["task", "todo", "to do", "alert", "action", "work", "checklist", "priority"]):
            tools_executed.append({
                "tool_name": "get_pending_farm_tasks",
                "description": "Retrieved active condition-triggered farm management tasks",
                "summary_result": f"Loaded pending tasks and operational reminders for {farm.farm_name}",
            })
            pending_tasks = (
                db.query(Task)
                .filter(Task.farm_id == farm.id, Task.status == "pending")
                .order_by(Task.due_date.asc())
                .all()
            )

            if pending_tasks:
                tasks_text = "\n".join([
                    f"- **[{t.priority.upper()}]** **{t.title}** (Due: {t.due_date or 'Immediate'})\n"
                    f"  *{t.description}*"
                    for t in pending_tasks[:5]
                ])
                advice = (
                    f"### Active Farm Action Matrix for **{farm.farm_name}**\n\n"
                    f"Found **{len(pending_tasks)} pending condition-based tasks** triggered by current satellite and soil telemetry:\n\n"
                    f"{tasks_text}\n\n"
                    f"💡 You can mark these as completed or add custom tasks directly in the **Tasks & Alerts** tab."
                )
            else:
                advice = (
                    f"### Farm Tasks Status for **{farm.farm_name}**\n\n"
                    f"All clear! There are currently no overdue or critical pending tasks flagged for your farm.\n"
                    f"Routine monitoring continues across NASA precipitation, SMAP moisture, and canopy vegetation vigor."
                )

            follow_ups = [
                "Show me the weather forecast that triggered these tasks.",
                "How do I clear drainage swales to prevent waterlogging?",
                "Suggest a crop rotation task for my current crop.",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 8: Carbon Credit Readiness & Smallholder Aggregation
        # -------------------------------------------------------------
        if any(w in msg for w in ["carbon", "credit", "co2", "sequestration", "agroforestry", "fpo", "monetize", "offset"]):
            tools_executed.append({
                "tool_name": "evaluate_carbon_readiness",
                "description": "Analyzed carbon credit eligibility pathways and smallholder pooling potential",
                "summary_result": f"Evaluated Agroforestry (VM0042) and Rice AWD (AMS-III.AU) for {farm.total_area_acres:.1f} acres",
            })
            citations.append("Verra VCS (VM0042) / UNFCCC CDM (AMS-III.AU) / Gold Standard")

            # Quick eligibility calculation
            is_rice = "rice" in active_crop_name.lower() or "paddy" in active_crop_name.lower()
            pathway_name = "Rice Methane Abatement (AMS-III.AU)" if is_rice else "Agroforestry & Horticultural Tree Planting (VM0042)"
            yield_range = "1.5 – 3.2 tCO₂e/ha/year" if is_rice else "2.0 – 5.5 tCO₂e/ha/year"

            advice = (
                f"### Carbon Credit Readiness & Aggregation for **{farm.farm_name}**\n\n"
                f"- **Farm Area:** {farm.total_area_hectares:.2f} ha ({farm.total_area_acres:.2f} acres)\n"
                f"- **Primary Recommended Pathway:** **{pathway_name}**\n"
                f"- **Conservative Carbon Yield:** **{yield_range}**\n"
                f"- **Estimated Gross Generation:** **{farm.total_area_hectares * 3.5:.1f} tCO₂e/year** (at expected smallholder yield)\n\n"
                f"#### ⚠️ Critical Honest Carbon Principles for Smallholders:\n"
                f"1. **Individual Smallholder Barrier:** Verification and LiDAR/MRV audit costs for Verra or Gold Standard often exceed $15,000, making individual smallholder issuance non-viable.\n"
                f"2. **FPO / Cooperative Aggregation:** FieldShift AI generates an exportable **Carbon Evidence Dossier** allowing your farm to pool with 50-200 local farmers through your Farmer Producer Organization (FPO) or Krishi Vigyan Kendra.\n"
                f"3. **Required Physical Evidence:** Geo-referenced boundary polygon (on file in FieldShift), baseline soil organic carbon test, and tree count/water regime records."
            )
            follow_ups = [
                "Show me the full Carbon Credit Readiness tab.",
                "How do I record carbon evidence photos and planting receipts?",
                "Which local aggregators partner with Kerala smallholders?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 9: Weather, NASA GPM Rainfall & Soil Moisture
        # -------------------------------------------------------------
        if any(w in msg for w in ["rain", "weather", "temp", "climate", "rainfall", "monsoon", "dry", "moisture", "smap", "imerg"]):
            tools_executed.append({
                "tool_name": "get_nasa_weather_observations",
                "description": "Queried NASA GPM IMERG satellite precipitation, NASA POWER air temp, and NASA SMAP rootzone moisture",
                "summary_result": f"30d Rain: {env['cumulative_rainfall_30d_mm']:.1f} mm, Temp: {env['avg_temperature_c']:.1f}°C, SMAP: {env['smap_moisture_m3m3']} m3/m3",
            })
            citations.append("NASA Global Precipitation Measurement (GPM) IMERG v07")

            advice = (
                f"### NASA Earth Observation Digest for **{farm.farm_name}**\n\n"
                f"Coordinates: **{farm.latitude:.4f}° N, {farm.longitude:.4f}° E**\n\n"
                f"- **NASA GPM IMERG 30-Day Cumulative Rainfall:** **{env['cumulative_rainfall_30d_mm']:.1f} mm**\n"
                f"- **NASA POWER 2m Mean Air Temperature:** **{env['avg_temperature_c']:.1f} °C**\n"
                f"- **NASA SMAP L4 Surface Soil Moisture:** **{env['smap_moisture_m3m3']:.3f} m³/m³** ({env['smap_regional_status']})\n"
                f"- **Landsat / Sentinel-2 Canopy Moisture Stress (NDMI):** **{veg['latest_ndmi']:.2f}**\n\n"
                f"#### Interpretation & Operational Guidance:\n"
            )
            if env["cumulative_rainfall_30d_mm"] > 300:
                advice += (
                    f"- 🌧️ **High Precipitation Advisory:** Heavy rainfall recorded across your field block. "
                    f"Check peripheral drainage ditches and ensure standing water does not pond around stem collars for crops like Cassava, Ginger, and Banana.\n"
                    f"- Root-zone saturation increases collar rot vulnerability; hold off on heavy nitrogen top-dressing until showers abate."
                )
            elif env["cumulative_rainfall_30d_mm"] < 50:
                advice += (
                    f"- ☀️ **Dry Spell Warning:** Cumulative precipitation is below tropical maintenance levels. "
                    f"If supplementary irrigation is available, apply 15-20 litres/plant every other day via drip systems during early morning hours to minimize evaporation."
                )
            else:
                advice += (
                    f"- 🌿 **Balanced Soil-Moisture Regime:** Precipitation and SMAP root-zone moisture indicate favorable conditions for active vegetative growth."
                )

            follow_ups = [
                "Does my terrain slope create waterlogging during heavy downpours?",
                "What crop suits this current rainfall pattern?",
                "Simulate a 40% rainfall reduction scenario.",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Intent 10: Terrain, Slope, Drainage & Waterlogging
        # -------------------------------------------------------------
        if any(w in msg for w in ["terrain", "slope", "waterlog", "drain", "flood", "pooling", "erosion", "contour", "relief"]):
            tools_executed.append({
                "tool_name": "get_terrain_hydrology",
                "description": "Computed NASADEM digital elevation relief and flow accumulation convergence",
                "summary_result": f"Slope: {terrain['slope_mean_deg']:.1f}°, Relief: {terrain['relief_m']:.1f}m, Drainage: {terrain['drainage_assessment']}",
            })
            citations.append("NASA Shuttle Radar Topography Mission (SRTM) / NASADEM 30m DEM")

            advice = (
                f"### Terrain Relief & Hydrological Drainage for **{farm.farm_name}**\n\n"
                f"- **Elevation Range:** {terrain['elevation_min_m']:.1f} m to {terrain['elevation_max_m']:.1f} m (Relief: **{terrain['relief_m']:.1f} m**)\n"
                f"- **Mean Slope:** **{terrain['slope_mean_deg']:.1f}°** ({terrain['slope_class']})\n"
                f"- **Dominant Aspect:** {terrain['aspect_dominant']}\n"
                f"- **Topographic Wetness Index (TWI):** **{terrain['topographic_wetness_index']:.2f}**\n"
                f"- **Flow Accumulation Risk:** **{terrain['flow_accumulation_risk']}**\n"
                f"- **Farmer Waterlogging Flag:** {'⚠️ Yes (Flagged by farmer)' if terrain['farmer_marked_waterlogging'] else 'Not flagged'}\n\n"
                f"#### Hydrological Field Assessment:\n"
                f"- **Drainage Characterization:** {terrain['drainage_assessment']}\n"
                f"- **Soil Conservation:** On slopes steeper than 5°, establish contour bunds and vegetative filter strips (e.g., Vetiver grass) to mitigate topsoil erosion during tropical downpours."
            )
            follow_ups = [
                "Which crops handle poor drainage and waterlogging best?",
                "How do I mark a waterlogged zone on my field map?",
                "What is my current soil texture?",
            ]
            return cls._localize_response(advice, follow_ups, language)

        # -------------------------------------------------------------
        # Default / Fallback Synthesis
        # -------------------------------------------------------------
        tools_executed.append({
            "tool_name": "synthesize_farm_advisory",
            "description": "Synthesized current digital twin state and active risk indicators",
            "summary_result": f"Farm Health: {100 - risk['overall_risk_score']}% stable, Active crop: {active_crop_name}",
        })

        risk_bullets = "\n".join([
            f"- **{f['factor']}** ({f['severity'].upper()}): {f['detail']}"
            for f in risk["risk_factors"]
        ]) if risk.get("risk_factors") else "- No critical agronomic risks detected."

        advice = (
            f"Here is the synthesized intelligence status for **{farm.farm_name}** in {farm.location_name}:\n\n"
            f"### Current Farm Virtual Twin Snapshot:\n"
            f"- **Active Primary Crop:** **{active_crop_name}** (Surveyed: {farm.total_area_acres:.2f} acres)\n"
            f"- **Composite Risk Score:** **{risk['overall_risk_score']}/100** ({risk['risk_level']})\n"
            f"- **Effective Soil Reaction:** **pH {soil['effective_ph']:.1f}** ({soil['ph_category']})\n"
            f"- **NASA 30-Day Rainfall:** **{env['cumulative_rainfall_30d_mm']:.1f} mm** (GPM IMERG)\n"
            f"- **Canopy Foliar Greenness:** **NDVI {veg['latest_ndvi']:.2f}** ({veg['canopy_status']})\n\n"
            f"#### Active Watchlist & Critical Factors:\n"
            f"{risk_bullets}\n\n"
            f"💡 **Ask me a specific question, such as:**\n"
            f"- *'How do I treat Sigatoka leaf spot on my banana?'*\n"
            f"- *'What is the best 3-year crop rotation after {active_crop_name}?'*\n"
            f"- *'Simulate what happens if next month brings a 50% drought.'*\n"
            f"- *'How can our farm qualify for carbon credits?'*"
        )
        follow_ups = [
            f"What crops are most suitable for my soil right now?",
            f"How do I manage pests on {active_crop_name}?",
            f"Simulate a drought scenario for my farm.",
            f"Check my carbon credit readiness.",
        ]
        return cls._localize_response(advice, follow_ups, language)

    @classmethod
    async def _try_call_gemini_llm(
        cls,
        api_key: str,
        farm: Farm,
        user_msg: str,
        twin: Dict[str, Any],
        history: List[ChatMessage],
        tools_executed: List[Dict[str, str]],
        language: str = "en",
    ) -> Optional[Tuple[str, List[str]]]:
        """
        Attempts to call the Google Gemini API when an API key is provided,
        injecting the farm's live digital twin telemetry and requested language as grounded context.
        """
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            
            lang_prompt_map = {
                "ml": "You MUST respond entirely in fluent Malayalam (മലയാളം) using appropriate Kerala Agricultural University terminology.",
                "hi": "You MUST respond entirely in fluent Hindi (हिन्दी) using clear Krishi Vigyan agricultural terminology.",
                "ta": "You MUST respond entirely in fluent Tamil (தமிழ்) using clear agricultural extension terminology.",
                "es": "You MUST respond entirely in fluent Spanish (Español) using appropriate agricultural terminology.",
                "en": "Respond in English.",
            }
            lang_instruction = lang_prompt_map.get(language, "Respond in English.")

            system_prompt = (
                f"You are the FieldShift AI Farm Assistant, an expert agricultural advisor for {farm.farm_name} in {farm.location_name}.\n"
                f"You are scientifically grounded in the Kerala Agricultural University (KAU) Package of Practices and NASA Earth Science data.\n"
                f"Language requirement: {lang_instruction}\n\n"
                f"Live Farm Telemetry:\n"
                f"- Active Crop: {twin['crop_state'].get('current_crop')}\n"
                f"- Area: {farm.total_area_acres:.2f} acres\n"
                f"- Soil pH: {twin['soil_state'].get('effective_ph')} ({twin['soil_state'].get('ph_category')})\n"
                f"- Lab Test Verified: {twin['soil_state'].get('has_lab_test')}\n"
                f"- 30-Day NASA Rainfall: {twin['environmental_state'].get('cumulative_rainfall_30d_mm')} mm\n"
                f"- Mean Temp: {twin['environmental_state'].get('avg_temperature_c')} C\n"
                f"- SMAP Soil Moisture: {twin['environmental_state'].get('smap_moisture_m3m3')} m3/m3\n"
                f"- Slope: {twin['terrain_state'].get('slope_mean_deg')} deg\n"
                f"- Overall Risk Score: {twin['risk_assessment'].get('overall_risk_score')}/100\n\n"
                f"Rules:\n"
                f"1. Never recommend synthetic N-P-K quantities unless a lab test is verified.\n"
                f"2. Provide actionable, practical advice for smallholders.\n"
                f"3. Format cleanly in Markdown."
            )

            contents = [{"role": "user", "parts": [{"text": system_prompt + "\n\nUser Question: " + user_msg}]}]

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json={"contents": contents})
                if res.status_code == 200:
                    data = res.json()
                    candidate = data.get("candidates", [])[0]
                    text = candidate.get("content", {}).get("parts", [])[0].get("text", "")
                    if text:
                        tools_executed.append({
                            "tool_name": "gemini_llm_reasoning",
                            "description": f"Generated tailored response via Gemini API in {language} with telemetry grounding",
                            "summary_result": "Grounded LLM inference complete",
                        })
                        follow_ups = [
                            "What crops are most suitable for my soil right now?",
                            "How do I apply biological pest control?",
                            "What is the recommended crop rotation?",
                        ]
                        return text, follow_ups
        except Exception:
            pass  # Fall back to local deterministic engine

        return None

    @classmethod
    def _localize_response(cls, advice: str, follow_ups: List[str], language: str) -> Tuple[str, List[str]]:
        if not language or language == "en":
            return advice, follow_ups

        # Malayalam Localization
        if language == "ml":
            translations = [
                ("### Plant Protection & Integrated Pest Management for", "### വിള സംരക്ഷണവും ജൈവ കീടനിയന്ത്രണവും:"),
                ("### Cultivation & Agronomy Guide:", "### കാർഷിക പരിചരണ സഹായി:"),
                ("### What-If Scenario Simulation Result for", "### കാലാവസ്ഥാ വ്യതിയാന സാധ്യത പരിശോധന ഫലം:"),
                ("### Multi-Year Crop Rotation Roadmaps for", "### ബഹുവർഷ വിളപരിക്രമണ പദ്ധതി:"),
                ("### Crop Suitability Evaluation for", "### വിള അനുയോജ്യത പരിശോധന:"),
                ("### Soil Profile & Nutrient Status for", "### മണ്ണു പരിശോധനയും പോഷക നിലവാരവും:"),
                ("### Verified Soil Health Analysis for", "### കൃഷിഭവൻ സാക്ഷ്യപ്പെടുത്തിയ മണ്ണു പരിശോധന ഫലം:"),
                ("### Active Farm Action Matrix for", "### തോട്ടത്തിലെ അടിയന്തര കർമ്മപദ്ധതി:"),
                ("### Carbon Credit Readiness & Aggregation for", "### കാർബൺ ക്രെഡിറ്റ് വരുമാന സാധ്യത:"),
                ("### NASA Earth Observation Digest for", "### നാസ ഉപഗ്രഹ കാലാവസ്ഥാ റിപ്പോർട്ട്:"),
                ("### Terrain Relief & Hydrological Drainage for", "### ഭൂപ്രകൃതിയും നീർവാർച്ചാ വിശകലനവും:"),
                ("### Current Farm Virtual Twin Snapshot:", "### തോട്ടത്തിന്റെ നിലവിലെ അവസ്ഥ:"),
                ("Recommended Regional Varieties:", "ശുപാർശ ചെയ്യുന്ന ഇനങ്ങൾ:"),
                ("Optimal Planting Window:", "അനുയോജ്യമായ നടീൽ സമയം:"),
                ("Plant Spacing & Geometry:", "നടീൽ അകലം:"),
                ("Water Requirement:", "ആവശ്യമായ ജലത്തിന്റെ അളവ്:"),
                ("Soil Preferences:", "മണ്ണ് അനുയോജ്യത:"),
                ("Key Advantage:", "പ്രധാന ഗുണം:"),
                ("Suitability Score:", "അനുയോജ്യതാ സ്കോർ:"),
                ("Duration:", "വിളദൈർഘ്യം:"),
                ("Overall Risk Score:", "മൊത്തം അപകടസാധ്യത സ്കോർ:"),
                ("Active Crop:", "നിലവിലെ വിള:"),
                ("Effective Soil Reaction:", "മണ്ണിന്റെ pH നില:"),
                ("Namaskaram! I am your", "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ"),
                ("FieldShift AI Farm Assistant", "ഫീൽഡ്ഷിഫ്റ്റ് AI കാർഷിക സഹായിയാണ്"),
            ]
            ml_advice = advice
            for eng, ml in translations:
                ml_advice = ml_advice.replace(eng, ml)

            ml_follow_ups = [
                "എന്റെ തോട്ടത്തിലെ മണ്ണിന് ഏറ്റവും അനുയോജ്യമായ വിള ഏതാണ്?",
                "വാഴപ്പേൻ, പനാമ വാട്ടം എന്നിവ എങ്ങനെ തടയാം?",
                "അടുത്ത വർഷം എന്ത് വിളയാണ് കൃഷി ചെയ്യേണ്ടത്?",
                "വരൾച്ചാ സാധ്യത സിമുലേഷൻ കാണിക്കുക.",
            ]
            return ml_advice, ml_follow_ups

        # Hindi Localization
        if language == "hi":
            translations = [
                ("### Plant Protection & Integrated Pest Management for", "### पादप संरक्षण एवं एकीकृत कीट प्रबंधन:"),
                ("### Cultivation & Agronomy Guide:", "### कृषि मार्गदर्शिका एवं फसल प्रबंधन:"),
                ("### What-If Scenario Simulation Result for", "### जलवायु तनाव अनुकरण परिणाम:"),
                ("### Multi-Year Crop Rotation Roadmaps for", "### बहुवर्षीय फसल चक्र योजना:"),
                ("### Crop Suitability Evaluation for", "### फसल उपयुक्तता मूल्यांकन:"),
                ("### Soil Profile & Nutrient Status for", "### मृदा स्वास्थ्य एवं पोषक तत्व स्थिति:"),
                ("### Verified Soil Health Analysis for", "### प्रमाणित मृदा परीक्षण विश्लेषण:"),
                ("### Active Farm Action Matrix for", "### खेत कार्य योजना एवं अलर्ट:"),
                ("### Carbon Credit Readiness & Aggregation for", "### कार्बन क्रेडिट पात्रता एवं आय:"),
                ("### NASA Earth Observation Digest for", "### नासा उपग्रह मौसम सारांश:"),
                ("Namaskaram! I am your", "नमस्ते! मैं आपका"),
                ("FieldShift AI Farm Assistant", "फील्डशिफ्ट एआई कृषि सहायक हूँ"),
            ]
            hi_advice = advice
            for eng, hi in translations:
                hi_advice = hi_advice.replace(eng, hi)

            hi_follow_ups = [
                "मेरी मिट्टी के लिए सबसे उपयुक्त फसल कौन सी है?",
                "जैविक कीट नियंत्रण कैसे करें?",
                "फसल चक्र रणनीति क्या होनी चाहिए?",
                "सूखे के प्रभाव का अनुकरण करें।",
            ]
            return hi_advice, hi_follow_ups

        # Tamil Localization
        if language == "ta":
            translations = [
                ("### Plant Protection & Integrated Pest Management for", "### பயிர் பாதுகாப்பு மற்றும் பூச்சி மேலாண்மை:"),
                ("### Cultivation & Agronomy Guide:", "### சாகுபடி வழிகாட்டி:"),
                ("### Crop Suitability Evaluation for", "### பயிர் பொருத்தம் மதிப்பீடு:"),
                ("### Soil Profile & Nutrient Status for", "### மண் பரிசோதனை மற்றும் ஊட்டச்சத்து நிலை:"),
                ("### Carbon Credit Readiness & Aggregation for", "### கார்பன் கிரெடிட் தகுதி:"),
                ("Namaskaram! I am your", "வணக்கம்! நான் உங்கள்"),
            ]
            ta_advice = advice
            for eng, ta in translations:
                ta_advice = ta_advice.replace(eng, ta)

            ta_follow_ups = [
                "என் நிலத்திற்கு ஏற்ற பயிர்கள் எவை?",
                "இயற்கை பூச்சி மேலாண்மை முறைகள் என்ன?",
                "பயிர் சுழற்சி ஆலோசனை தருக.",
            ]
            return ta_advice, ta_follow_ups

        # Spanish Localization
        if language == "es":
            translations = [
                ("### Plant Protection & Integrated Pest Management for", "### Protección de Cultivos y Manejo Integrado de Plagas para"),
                ("### Cultivation & Agronomy Guide:", "### Guía de Cultivo y Manejo Agronómico:"),
                ("### What-If Scenario Simulation Result for", "### Resultado de Simulación de Escenario para"),
                ("### Multi-Year Crop Rotation Roadmaps for", "### Estrategias de Rotación de Cultivos para"),
                ("### Crop Suitability Evaluation for", "### Evaluación de Idoneidad de Cultivos para"),
                ("### Soil Profile & Nutrient Status for", "### Perfil del Suelo y Estado Nutricional para"),
                ("### Carbon Credit Readiness & Aggregation for", "### Preparación para Créditos de Carbono para"),
                ("Namaskaram! I am your", "¡Hola! Soy tu"),
            ]
            es_advice = advice
            for eng, es in translations:
                es_advice = es_advice.replace(eng, es)

            es_follow_ups = [
                "¿Qué cultivos son más adecuados para mi suelo?",
                "¿Cómo puedo manejar plagas de forma orgánica?",
                "Simular un escenario de sequía del 40%.",
            ]
            return es_advice, es_follow_ups

        return cls._localize_response(advice, follow_ups, language)

    @classmethod
    def get_prompt_suggestions(cls, db: Session, farm_id: str) -> List[Dict[str, str]]:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        crop = farm.current_crop if farm and farm.current_crop else "Banana"
        return [
            {
                "category": "Crop Suitability",
                "prompt": f"Which crops are most suitable for my soil and climate right now?",
                "description": "Ranks regionally validated crops based on NASA weather and SoilGrids data.",
            },
            {
                "category": "Pest & Disease Control",
                "prompt": f"What are the major pests and diseases for {crop} and how do I treat them organically?",
                "description": "Provides KAU-certified IPM solutions, Trichoderma, and neem formulations.",
            },
            {
                "category": "Soil & Fertilizers",
                "prompt": "How healthy is my soil and do I need to apply lime?",
                "description": "Reviews measured or modelled pH, organic carbon, and missing test warnings.",
            },
            {
                "category": "Crop Rotation",
                "prompt": f"What is the best 3-year crop rotation sequence to follow after {crop}?",
                "description": "Presents Soil Health, Water Efficiency, and Balanced rotation trajectories.",
            },
            {
                "category": "What-If Simulator",
                "prompt": "What happens if rainfall drops by 40% and irrigation fails?",
                "description": "Runs digital twin stress simulation to predict yield and risk impact.",
            },
            {
                "category": "Carbon Credit Readiness",
                "prompt": "Can my farm qualify for carbon credits and how does FPO pooling work?",
                "description": "Evaluates agroforestry and AWD rice methane pathways with conservative ranges.",
            },
        ]
