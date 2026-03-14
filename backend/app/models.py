from pydantic import BaseModel


class InferenceResponse(BaseModel):
    filename: str
    content_type: str
    text: str
    confidence: float
