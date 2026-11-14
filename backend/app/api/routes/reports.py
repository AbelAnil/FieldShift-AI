from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.api.deps import get_current_user
from app.services.report_service import ReportService

router = APIRouter(prefix="/farms", tags=["Farm Reports"])


@router.get("/{farm_id}/report")
async def get_farm_intelligence_report(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a full synthesized agricultural decision-support dossier for the farm.
    Includes Markdown formatted text, summary KPIs, rankings, and pending actions.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    try:
        report = await ReportService.generate_farm_report(db, farm_id)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating farm report: {str(e)}",
        )
