from __future__ import annotations

import hashlib
import io
from PIL import Image


def _deterministic_fallback(data: bytes) -> str:
    digest = hashlib.sha256(data).hexdigest()[:20]
    return f"MOCK_OCR_{digest}"


def extract_text(content: bytes, content_type: str) -> str:
    """Try OCR using pytesseract for images; fallback deterministically for unsupported formats/environments."""
    if content_type.startswith('image/'):
        try:
            import pytesseract

            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image).strip()
            return text or _deterministic_fallback(content)
        except Exception:  # noqa: BLE001
            return _deterministic_fallback(content)

    # Lightweight fallback for PDFs and others.
    return _deterministic_fallback(content)
