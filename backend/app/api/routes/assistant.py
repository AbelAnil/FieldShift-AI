from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.schemas.assistant import (
    ChatRequest,
    ChatResponse,
    ChatSessionOut,
    ChatSessionCreate,
    ChatMessageOut,
    PromptSuggestion,
)
from app.services.ai_assistant_service import (
    generate_assistant_reply,
    AIAssistantService,
)

router = APIRouter(prefix="/assistant", tags=["AI Farm Assistant"])


@router.get("/sessions", response_model=List[ChatSessionOut])
def list_sessions(
    farm_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ChatSession).filter(ChatSession.user_id == current_user.id)
    if farm_id:
        query = query.filter(ChatSession.farm_id == farm_id)
    return query.order_by(ChatSession.id.desc()).all()


@router.get("/sessions/{session_id}", response_model=Union[ChatSessionOut, List[ChatSessionOut]])
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if session:
        return session

    farm_sessions = (
        db.query(ChatSession)
        .filter(ChatSession.farm_id == session_id, ChatSession.user_id == current_user.id)
        .order_by(ChatSession.id.desc())
        .all()
    )
    if farm_sessions:
        return farm_sessions

    raise HTTPException(status_code=404, detail="Chat session not found")


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_session = ChatSession(
        farm_id=str(payload.farm_id) if payload.farm_id else None,
        user_id=current_user.id,
        title=payload.title or "New Consultation",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/sessions/{farm_id}", response_model=ChatSessionOut)
def create_chat_session_for_farm(
    farm_id: str,
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_session = ChatSession(
        farm_id=farm_id,
        user_id=current_user.id,
        title=payload.title or "New Consultation",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    db.delete(session)
    db.commit()
    return {"success": True, "message": "Chat session and messages deleted successfully."}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if payload.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == str(payload.session_id),
                ChatSession.user_id == current_user.id,
            )
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        title = payload.message.strip()[:60]
        session = ChatSession(
            user_id=current_user.id,
            title=title,
            farm_id=str(payload.farm_id) if payload.farm_id else None,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        content=payload.message.strip(),
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    reply_text = await generate_assistant_reply(
        db=db,
        user=current_user,
        user_message=payload.message.strip(),
        session_id=session.id,
        farm_id=str(payload.farm_id) if payload.farm_id else None,
        field_id=str(payload.field_id) if payload.field_id else None,
    )

    assistant_msg = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        session_id=session.id,
        message_id=str(assistant_msg.id),
        reply=reply_text,
        user_message=ChatMessageOut.model_validate(user_msg),
        assistant_message=ChatMessageOut.model_validate(assistant_msg),
    )


@router.get("/prompts/{farm_id}", response_model=List[PromptSuggestion])
def get_suggested_prompts(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AIAssistantService.get_prompt_suggestions(db, farm_id)


@router.get("/history/{farm_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    farm_id: str,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(ChatMessage)
        .join(ChatSession)
        .filter(ChatSession.farm_id == farm_id, ChatSession.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
    )
    if session_id:
        query = query.filter(ChatSession.id == session_id)

    return query.all()
