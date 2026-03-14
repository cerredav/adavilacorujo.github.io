'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Expense, UploadItem } from '@/lib/types';
import { generateExpenseFromFile, seededExpenses } from '@/lib/mock-data';
import { saveDocument, trackUploadedDocument } from '@/lib/indexed-doc-store';
import { runInference } from '@/lib/inference-client';

type Store = {
  expenses: Expense[];
  uploads: UploadItem[];
  initialized: boolean;
  init: () => void;
  addUploadFiles: (files: File[]) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  bulkMarkReviewed: (ids: string[]) => void;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useExpenseStore = create<Store>()(
  persist(
    (set, get) => ({
      expenses: [],
      uploads: [],
      initialized: false,
      init: () => {
        if (get().initialized) return;
        if (get().expenses.length === 0) {
          set({ expenses: seededExpenses(), initialized: true });
          return;
        }
        set({ initialized: true });
      },
      addUploadFiles: async (files) => {
        const items = files.map((f) => ({
          id: uuidv4(),
          fileName: f.name,
          type: f.type,
          size: f.size,
          progress: 0,
          status: 'Queued' as const,
          documentStorageId: uuidv4(),
        }));
        set((s) => ({ uploads: [...items, ...s.uploads] }));

        for (const file of files) {
          const item = get().uploads.find((u) => u.fileName === file.name && u.size === file.size && !u.expenseId);
          if (!item) continue;
          set((s) => ({ uploads: s.uploads.map((u) => (u.id === item.id ? { ...u, status: 'Uploading' } : u)) }));
          for (const p of [25, 45, 70, 100]) {
            await wait(200);
            set((s) => ({ uploads: s.uploads.map((u) => (u.id === item.id ? { ...u, progress: p } : u)) }));
          }
          set((s) => ({ uploads: s.uploads.map((u) => (u.id === item.id ? { ...u, status: 'Processing' } : u)) }));
          await wait(400);

          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          });

          await saveDocument({
            id: item.documentStorageId!,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            uploadedAt: new Date().toISOString(),
          });
          trackUploadedDocument(item.documentStorageId!);

          try {
            const inference = await runInference(file);
            const expense = generateExpenseFromFile(
              file.name,
              file.type,
              file.size,
              dataUrl,
              item.documentStorageId,
              inference.text,
              inference.confidence,
            );

            if (inference.structured?.vendor_name) {
              expense.vendor = inference.structured.vendor_name;
            }

            const inferredTotal =
              typeof inference.structured?.receipt_total === 'number'
                ? inference.structured.receipt_total
                : typeof inference.structured?.total_amount === 'number'
                  ? inference.structured.total_amount
                  : null;

            if (typeof inferredTotal === 'number') {
              expense.total = Number(inferredTotal.toFixed(2));
            }

            if (Array.isArray(inference.structured?.taxes) && inference.structured.taxes.length > 0) {
              const summedTaxes = inference.structured.taxes.reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : 0), 0);
              expense.tax = Number(summedTaxes.toFixed(2));
            } else if (typeof inferredTotal === 'number' && expense.total >= expense.subtotal) {
              expense.tax = Number((expense.total - expense.subtotal).toFixed(2));
            }

            if (Array.isArray(inference.structured?.taxes) && inference.structured.taxes.length > 0) {
              const taxNote = inference.structured.taxes
                .map((t) => `${t.name}: ${typeof t.amount === 'number' ? t.amount.toFixed(2) : 'n/a'}`)
                .join(', ');
              expense.notes = `${expense.notes ? `${expense.notes} | ` : ''}Taxes: ${taxNote}`;
            }

            if (Array.isArray(inference.structured?.line_items) && inference.structured.line_items.length > 0) {
              expense.lineItems = inference.structured.line_items.map((line, idx) => {
                const qty = typeof line.qty === 'number' ? line.qty : 1;
                const unitPrice = typeof line.unit_price === 'number' ? line.unit_price : 0;
                const total = typeof line.total === 'number' ? line.total : Number((qty * unitPrice).toFixed(2));
                return {
                  id: `${expense.id}-li-${idx}`,
                  description: line.description,
                  qty,
                  unitPrice,
                  total,
                };
              });
            }

            set((s) => ({ expenses: [expense, ...s.expenses] }));
            set((s) => ({
              uploads: s.uploads.map((u) =>
                u.id === item.id ? { ...u, status: expense.status === 'Completed' ? 'Completed' : 'Needs Review', expenseId: expense.id } : u,
              ),
            }));
          } catch (error) {
            set((s) => ({
              uploads: s.uploads.map((u) =>
                u.id === item.id
                  ? { ...u, status: 'Failed', error: error instanceof Error ? error.message : 'Inference request failed' }
                  : u,
              ),
            }));
          }
        }
      },
      updateExpense: (id, patch) => set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      bulkMarkReviewed: (ids) =>
        set((s) => ({ expenses: s.expenses.map((e) => (ids.includes(e.id) ? { ...e, status: 'Completed' } : e)) })),
    }),
    {
      name: 'expense-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ expenses: state.expenses, uploads: state.uploads }),
    },
  ),
);
