from datetime import datetime
from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, ConfigDict


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[Union[str, int]] = None
    farm_id: Optional[Union[str, int]] = None
    field_id: Optional[Union[str, int]] = None
    language: Optional[str] = "en"


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Topic"
    farm_id: Optional[Union[str, int]] = None


class ToolCallInfo(BaseModel):
    tool_name: str
    description: str
    summary_result: str


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, int]
    session_id: Optional[Union[str, int]] = None
    role: str = "assistant"
    sender: Optional[str] = "assistant"
    content: str
    tools_called: Optional[List[Dict[str, Any]]] = None
    citations: Optional[List[str]] = None
    created_at: Optional[Any] = None


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Union[str, int]
    farm_id: Optional[Union[str, int]] = None
    title: Optional[str] = "New Consultation"
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
    message_count: Optional[int] = 0
    messages: List[ChatMessageOut] = []


class ChatResponse(BaseModel):
    session_id: Union[str, int]
    message_id: Optional[Union[str, int]] = None
    reply: str
    tools_executed: List[ToolCallInfo] = []
    citations: List[str] = []
    suggested_follow_ups: List[str] = []
    user_message: Optional[ChatMessageOut] = None
    assistant_message: Optional[ChatMessageOut] = None


class PromptSuggestion(BaseModel):
    category: str
    prompt: str
    description: str
