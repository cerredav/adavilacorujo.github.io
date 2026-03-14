from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

import httpx

from .models import ExtractedLineItem, ExtractedTax, StructuredExtraction

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/generate')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2-vision')


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace('$', '').replace(',', '').strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if not text:
        return {}

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        pass

    fenced = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, flags=re.DOTALL)
    if fenced:
        try:
            parsed = json.loads(fenced.group(1))
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            pass

    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    return {}


def extract_structured_fields(ocr_text: str, file_bytes: bytes, content_type: str) -> StructuredExtraction:
    prompt = (
        'You are an accounting extraction assistant. '
        'Given OCR text and optionally an image of a receipt, extract fields as strict JSON only. '
        'Return object with keys: '
        'vendor_name (string|null), '
        'receipt_total (number|null), '
        'total_amount (number|null), '
        'taxes (array of {name, amount, rate}), '
        'line_items (array of {description, qty, unit_price, total}). '
        'Enumerate every tax visible on the receipt in the taxes array. '
        'If unknown, return null or empty array. No extra keys.\n\n'
        f'OCR text:\n{ocr_text}\n'
    )

    payload: dict[str, Any] = {
        'model': OLLAMA_MODEL,
        'prompt': prompt,
        'stream': False,
        'format': 'json',
    }

    if content_type.startswith('image/'):
        payload['images'] = [base64.b64encode(file_bytes).decode('utf-8')]

    with httpx.Client(timeout=20.0) as client:
        response = client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        body = response.json()

    raw = str(body.get('response', '')).strip()
    parsed = _extract_json(raw)

    taxes: list[ExtractedTax] = []
    for tax in parsed.get('taxes', []) if isinstance(parsed.get('taxes'), list) else []:
        if not isinstance(tax, dict):
            continue
        name = str(tax.get('name', '')).strip()
        if not name:
            continue
        taxes.append(
            ExtractedTax(
                name=name,
                amount=_to_float(tax.get('amount')),
                rate=_to_float(tax.get('rate')),
            )
        )

    items: list[ExtractedLineItem] = []
    for item in parsed.get('line_items', []) if isinstance(parsed.get('line_items'), list) else []:
        if not isinstance(item, dict):
            continue
        desc = str(item.get('description', '')).strip()
        if not desc:
            continue
        items.append(
            ExtractedLineItem(
                description=desc,
                qty=_to_float(item.get('qty')),
                unit_price=_to_float(item.get('unit_price')),
                total=_to_float(item.get('total')),
            )
        )

    receipt_total = _to_float(parsed.get('receipt_total')) or _to_float(parsed.get('total_amount'))

    return StructuredExtraction(
        vendor_name=(str(parsed.get('vendor_name')).strip() if parsed.get('vendor_name') is not None else None) or None,
        receipt_total=receipt_total,
        total_amount=_to_float(parsed.get('total_amount')) or receipt_total,
        taxes=taxes,
        line_items=items,
    )
