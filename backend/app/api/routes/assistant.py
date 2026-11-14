from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.api.deps import get_current_user
from app.schemas.assistant import ChatRequest, ChatResponse, ChatMessageOut, PromptSuggestion
from app.services.ai_assistant_service import AIAssistantService

router = APIRouter(prefix="/assistant", tags=["AI Farm Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Interact with the FieldShift AI Farm Assistant.
    Retrieves the farm digital twin, evaluates intent, executes telemetry tools,
    and returns scientifically grounded agricultural guidance.
    """
    farm = db.query(Farm).filter(Farm.id == request.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with ID {request.farm_id} not found",
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have authorization to access this farm's assistant",
        )

    try:
        response_data = await AIAssistantService.process_query(
            db=db,
            farm_id=farm.id,
            user_id=current_user.id,
            user_message=request.message,
            session_id=request.session_id,
        )
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating AI advisory: {str(e)}",
        )


@router.get("/prompts/{farm_id}", response_model=List[PromptSuggestion])
def get_suggested_prompts(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns contextual suggested questions tailored to the farm's telemetry.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return AIAssistantService.get_prompt_suggestions(db, farm_id)


@router.get("/history/{farm_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    farm_id: str,
    session_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns chat message history for the active farm session.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    query = (
        db.query(ChatMessage)
        .join(ChatSession)
        .filter(ChatSession.farm_id == farm_id)
        .order_by(ChatMessage.created_at.asc())
    )
    if session_id:
        query = query.filter(ChatSession.id == session_id)

    messages = query.all()
    return [
        ChatMessageOut(
            id=m.id,
            session_id=m.session_id,
            sender=m.sender,
            content=m.content,
            tools_called=m.tools_called,
            citations=m.citations,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]
