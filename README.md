# Receipt Accounting UI (Front-end only)

Next.js + TypeScript UI for receipt/expense capture and review with mocked in-memory processing and localStorage persistence.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test:e2e
```

## Features

- `/upload`: drag-drop / picker, simulated upload + OCR processing statuses
- `/expenses`: TanStack table dashboard with filters, bulk mark reviewed, CSV export
- `/expenses/:id`: editable extracted expense form with zod validations and confidence indicators
- `/reports/monthly`: monthly summary cards + category chart (Recharts) + stub PDF export
- Zustand + localStorage persistence with first-load seeded sample expenses
- 2 Playwright tests for upload and edit flows
