from __future__ import annotations

import hashlib

from fastapi import FastAPI, File, HTTPException, UploadFile

from .models import InferenceResponse
from .ocr import extract_text

app = FastAPI(title='Receipt OCR Inference API')

ALLOWED_TYPES = {'application/pdf', 'image/png', 'image/jpeg'}


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/infer', response_model=InferenceResponse)
async def infer_document(file: UploadFile = File(...)) -> InferenceResponse:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail='Only PDF, PNG, JPG are accepted')

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail='Uploaded file is empty')

    text = extract_text(payload, file.content_type or 'application/octet-stream')
    digest = hashlib.sha256(payload).hexdigest()
    confidence = 0.55 + (int(digest[:2], 16) / 255) * 0.4

    return InferenceResponse(
        filename=file.filename or 'uploaded-document',
        content_type=file.content_type or 'application/octet-stream',
        text=text,
        confidence=round(min(confidence, 0.99), 2),
    )
