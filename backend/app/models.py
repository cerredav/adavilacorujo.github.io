from pydantic import BaseModel


class ExtractedLineItem(BaseModel):
    description: str
    qty: float | None = None
    unit_price: float | None = None
    total: float | None = None


class ExtractedTax(BaseModel):
    name: str
    amount: float | None = None
    rate: float | None = None


class StructuredExtraction(BaseModel):
    vendor_name: str | None = None
    receipt_total: float | None = None
    total_amount: float | None = None
    taxes: list[ExtractedTax] = []
    line_items: list[ExtractedLineItem] = []


class InferenceResponse(BaseModel):
    filename: str
    content_type: str
    text: str
    confidence: float
    structured: StructuredExtraction
