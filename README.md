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

Optional env for frontend API target:

```bash
NEXT_PUBLIC_INFERENCE_URL=http://localhost:8000/infer
```

## Frontend document storage

Uploaded files are stored in two browser-side locations:

- **IndexedDB** (`receipt-documents-db/documents`) for file preview payloads.
- **localStorage** (`uploaded-documents` + Zustand state) for upload tracking metadata.

No object store is required for frontend uploads. During upload processing, the UI also sends each file to the inference API.

## Python API setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## API endpoints

- `POST /infer` — upload PDF/PNG/JPG and receive OCR text + confidence.
- `GET /health` — health check.

## Backend tests

```bash
cd backend
pytest -q
```

## Notes

- OCR is attempted via `pytesseract` for images; unsupported formats or OCR runtime limitations use a deterministic fallback string.
- The Python API is inference-only and does not persist uploaded files.
