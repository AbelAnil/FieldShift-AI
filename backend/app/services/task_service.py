from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.farm import Farm
from app.schemas.task import TaskCreate
from app.services.digital_twin_service import DigitalTwinService


class TaskService:
    """
    Automated Farm Task & Alert Management Service.
    Transforms raw Earth observation alerts and soil telemetry into actionable,
    farmer-approved field tasks and reminders.
    """

    @classmethod
    async def evaluate_and_sync_telemetry_tasks(cls, db: Session, farm_id: str, user_id: str) -> List[Task]:
        """
        Scans current digital twin telemetry and seeds proactive condition-based tasks
        without duplicating existing pending tasks.
        """
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            return []

        twin = await DigitalTwinService.get_or_create_twin(db, farm)
        soil = twin["soil_state"]
        terrain = twin["terrain_state"]
        env = twin["environmental_state"]
        veg = twin["vegetation_state"]

        candidate_tasks = []
        today = datetime.now(timezone.utc)

        # 1. Condition: Missing physical soil test
        if not soil["has_lab_test"]:
            candidate_tasks.append({
                "title": "Submit Physical Soil Sample to Krishi Bhavan",
                "description": "Satellite and SoilGrids data provide baseline models only. Collect composite 15cm soil cores across your fields and submit to Krishi Bhavan for certified N-P-K nutrient analysis.",
                "category": "soil",
                "priority": "high",
                "due_date": (today + timedelta(days=14)).strftime("%Y-%m-%d"),
                "trigger_source": "SoilGrids Baseline Rule",
            })

        # 2. Condition: Soil Acidity Liming
        if soil["effective_ph"] < 5.8:
            candidate_tasks.append({
                "title": "Apply Agricultural Lime / Dolomite for Soil Acidity",
                "description": f"Soil pH of {soil['effective_ph']:.1f} indicates strong acidity common in Kerala laterite. Broadcast 350 kg/ha of agricultural lime or dolomite 2-3 weeks prior to basal fertilizer application.",
                "category": "soil",
                "priority": "medium",
                "due_date": (today + timedelta(days=21)).strftime("%Y-%m-%d"),
                "trigger_source": "KAU Soil Advisory",
            })

        # 3. Condition: Heavy Rainfall or High Flow Accumulation
        if env["cumulative_rainfall_30d_mm"] > 250 or terrain["flow_accumulation_risk"] in ["High", "Very High"] or terrain["farmer_marked_waterlogging"]:
            candidate_tasks.append({
                "title": "Clear Drainage Channels and Inspect Field Swales",
                "description": f"NASA GPM registered {env['cumulative_rainfall_30d_mm']:.1f} mm of rainfall over the last 30 days. High runoff convergence requires unclogging peripheral bunds to prevent collar rot in crops.",
                "category": "drainage",
                "priority": "high",
                "due_date": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
                "trigger_source": "NASA GPM IMERG Alert",
            })

        # 4. Condition: Low Canopy Moisture (NDMI < 0.20)
        if veg["latest_ndmi"] < 0.20:
            candidate_tasks.append({
                "title": "Investigate Foliar Moisture Stress (Low NDMI)",
                "description": f"Landsat/Sentinel Normalized Difference Moisture Index (NDMI) is {veg['latest_ndmi']:.2f}, indicating incipient moisture stress in the crop canopy. Inspect rootzone moisture and schedule irrigation.",
                "category": "crop",
                "priority": "medium",
                "due_date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
                "trigger_source": "Sentinel-2 NDMI Telemetry",
            })

        # 5. Condition: Crop Rotation Transition Preparation
        candidate_tasks.append({
            "title": f"Review Next Rotation Step for {farm.current_crop or 'Current Field'}",
            "description": f"FieldShift rotation engine recommends following with a nitrogen-fixing legume (e.g. Cowpea) to replenish organic nitrogen and break pest life cycles.",
            "category": "crop",
            "priority": "low",
            "due_date": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
            "trigger_source": "Crop Rotation Optimizer",
        })

        # Insert non-duplicate tasks (check existing tasks for farm to prevent duplicates)
        existing_tasks = (
            db.query(Task.title, Task.status)
            .filter(Task.farm_id == farm_id)
            .all()
        )
        existing_titles = {t[0] for t in existing_tasks if t[1] in ("pending", "completed")}

        created_tasks = []
        for cand in candidate_tasks:
            # Match title exactly or prefix to prevent duplicates
            already_exists = any(
                cand["title"] == et or cand["title"].split("(")[0].strip() == et.split("(")[0].strip()
                for et in existing_titles
            )
            if not already_exists:
                t = Task(
                    farm_id=farm_id,
                    user_id=user_id,
                    title=cand["title"],
                    description=cand["description"],
                    category=cand["category"],
                    priority=cand["priority"],
                    status="pending",
                    due_date=cand["due_date"],
                    trigger_source=cand["trigger_source"],
                )
                db.add(t)
                created_tasks.append(t)

        if created_tasks:
            db.commit()

        # Return all active tasks for farm
        return db.query(Task).filter(Task.farm_id == farm_id).order_by(Task.created_at.desc()).all()

    @classmethod
    def list_tasks(cls, db: Session, farm_id: str, status_filter: Optional[str] = None) -> List[Task]:
        query = db.query(Task).filter(Task.farm_id == farm_id)
        if status_filter:
            query = query.filter(Task.status == status_filter)
        return query.order_by(Task.created_at.desc()).all()

    @classmethod
    def create_custom_task(cls, db: Session, farm_id: str, user_id: str, data: TaskCreate) -> Task:
        task = Task(
            farm_id=farm_id,
            user_id=user_id,
            title=data.title,
            description=data.description,
            category=data.category,
            priority=data.priority,
            due_date=data.due_date,
            trigger_source=data.trigger_source or "Farmer",
            status="pending",
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def update_task_status(cls, db: Session, task_id: str, new_status: str) -> Optional[Task]:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        task.status = new_status
        if new_status == "completed":
            task.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def delete_task(cls, db: Session, task_id: str) -> bool:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False
        db.delete(task)
        db.commit()
        return True
