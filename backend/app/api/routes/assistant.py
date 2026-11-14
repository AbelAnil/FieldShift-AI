from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.api.deps import get_current_user
from app.schemas.assistant import (
    ChatRequest,
    ChatResponse,
    ChatMessageOut,
    PromptSuggestion,
    ChatSessionOut,
    ChatSessionCreate,
)
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
    and returns scientifically grounded agricultural guidance in the selected language.
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
            language=request.language or "en",
        )
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating AI advisory: {str(e)}",
        )


@router.get("/sessions/{farm_id}", response_model=List[ChatSessionOut])
def list_chat_sessions(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all chat sessions / topics for the specified farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.farm_id == farm_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )

    out = []
    for s in sessions:
        count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        out.append(
            ChatSessionOut(
                id=s.id,
                farm_id=s.farm_id,
                title=s.title or "General Topic",
                created_at=s.created_at.isoformat(),
                updated_at=s.updated_at.isoformat(),
                message_count=count,
            )
        )
    return out


@router.post("/sessions/{farm_id}", response_model=ChatSessionOut)
def create_chat_session(
    farm_id: str,
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new dedicated chat topic / session for the farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    new_session = ChatSession(
        farm_id=farm.id,
        user_id=current_user.id,
        title=payload.title or "New Farming Topic",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return ChatSessionOut(
        id=new_session.id,
        farm_id=new_session.farm_id,
        title=new_session.title,
        created_at=new_session.created_at.isoformat(),
        updated_at=new_session.updated_at.isoformat(),
        message_count=0,
    )


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a chat session and all its recorded messages.
    """
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(session)
    db.commit()
    return {"success": True, "message": "Chat session and messages deleted successfully."}


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
