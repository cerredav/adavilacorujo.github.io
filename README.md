# Receipt Accounting Platform (Frontend + Python OCR inference API)

This repository includes:

- **Frontend**: Next.js App Router UI for upload/review/dashboard/reporting flows.
- **Python API**: FastAPI inference-only OCR service used by the upload UI.

## Frontend setup

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.


## Frontend document storage

Uploaded files are stored in two browser-side locations:

- **IndexedDB** (`receipt-documents-db/documents`) for file preview payloads.
- **localStorage** (`uploaded-documents` + Zustand state) for upload tracking metadata.

No object store is required for frontend uploads. During upload processing, the UI sends each file to a Next.js proxy route (`/api/infer`) which forwards to the Python inference server to avoid browser CORS issues. The app intentionally enforces no storage quota limits at application level for IndexedDB/localStorage usage.

## OCR + LLM extraction flow

For each upload, the app:

1. Sends the file to the Next.js proxy (`/api/infer`).
2. Proxy forwards to Python inference service.
3. Python service runs OCR and then calls an Ollama model over HTTP to extract:
   - `vendor_name`
   - `receipt_total` (total sum of receipt)
   - `taxes` (every enumerated tax line)
   - `line_items`

## Python API setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional server-side env for proxy target (defaults to `http://localhost:8000/infer`):

```bash
INFERENCE_SERVER_URL=http://localhost:8000/infer
```

Optional Python API env for Ollama:

```bash
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2-vision
```

API docs: `http://localhost:8000/docs`

## API endpoints

- `POST /infer` — upload PDF/PNG/JPG and receive OCR text + confidence + structured extraction (`vendor_name`, `receipt_total`, `taxes`, `line_items`).
- `GET /health` — health check.

## Backend tests

```bash
cd backend
pytest -q
```

## Notes

- OCR is attempted via `pytesseract` for images; unsupported formats or OCR runtime limitations use a deterministic fallback string.
- The Python API is inference-only and does not persist uploaded files.
- Receipt total in UI is presented as line-items running total + summed taxes.
