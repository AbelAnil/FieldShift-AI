from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class ChatRequest(BaseModel):
    farm_id: str
    message: str
    session_id: Optional[str] = None


class ToolCallInfo(BaseModel):
    tool_name: str
    description: str
    summary_result: str


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    tools_called: Optional[List[Dict[str, Any]]] = None
    citations: Optional[List[str]] = None
    created_at: str


class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    reply: str
    tools_executed: List[ToolCallInfo]
    citations: List[str]
    suggested_follow_ups: List[str]


class PromptSuggestion(BaseModel):
    category: str
    prompt: str
    description: str
