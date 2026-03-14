'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExpenseStore } from '@/store/expense-store';
import { getDocument } from '@/lib/indexed-doc-store';

const schema = z.object({
  vendor: z.string().min(1),
  date: z.string().refine((v) => new Date(v) <= new Date(), 'Date cannot be in future'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  category: z.string().min(1),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({ description: z.string(), qty: z.number(), unitPrice: z.number(), total: z.number() })),
});

type FormData = z.infer<typeof schema>;

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const expense = useExpenseStore((s) => s.expenses.find((e) => e.id === id));
  const updateExpense = useExpenseStore((s) => s.updateExpense);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const [zoom, setZoom] = useState(100);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | undefined>(expense?.documentDataUrl);

  useEffect(() => {
    let mounted = true;
    async function loadPreview() {
      if (expense?.documentDataUrl) {
        setPreviewDataUrl(expense.documentDataUrl);
        return;
      }
      if (!expense?.documentStorageId) return;
      const doc = await getDocument(expense.documentStorageId);
      if (mounted && doc?.dataUrl) setPreviewDataUrl(doc.dataUrl);
    }
    void loadPreview();
    return () => {
      mounted = false;
    };
  }, [expense]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: expense
      ? {
          vendor: expense.vendor,
          date: expense.date,
          currency: expense.currency,
          subtotal: expense.subtotal,
          tax: expense.tax,
          total: expense.total,
          category: expense.category,
          paymentMethod: expense.paymentMethod,
          notes: expense.notes,
          lineItems: expense.lineItems.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, total: i.total })),
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const watchedLineItems = form.watch('lineItems');

  const lineItemsRunningTotal = useMemo(
    () => (watchedLineItems ?? []).reduce((acc, item) => acc + (Number.isFinite(item.total) ? item.total : 0), 0),
    [watchedLineItems],
  );
  const taxesBreakdown = expense?.taxes ?? [];
  const taxesTotal = useMemo(() => taxesBreakdown.reduce((acc, t) => acc + t.amount, 0), [taxesBreakdown]);
  const presentedReceiptTotal = useMemo(() => Number((lineItemsRunningTotal + taxesTotal).toFixed(2)), [lineItemsRunningTotal, taxesTotal]);

  const warning = useMemo(() => {
    const values = form.getValues();
    return Math.abs(values.subtotal + values.tax - values.total) > 0.02;
  }, [form.watch('subtotal'), form.watch('tax'), form.watch('total')]);

  if (!expense) return <Card>Expense not found.</Card>;

  const save = (data: FormData, status: 'Completed' | 'Needs Review') => {
    updateExpense(id, {
      ...data,
      subtotal: Number(lineItemsRunningTotal.toFixed(2)),
      tax: Number(taxesTotal.toFixed(2)),
      total: presentedReceiptTotal,
      status,
    });
    toast.success('Expense saved');
    router.push('/expenses');
  };

  return (
    <div className="grid">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Review Expense</h1>
        <Link href="/expenses">Back to list</Link>
      </div>
      <div className="review-layout">
        <Card>
          <h3>Document Preview</h3>
          {expense.sourceType.includes('image') && previewDataUrl ? (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" onClick={() => setZoom((z) => z - 10)}>-</Button>
                <Button variant="outline" onClick={() => setZoom((z) => z + 10)}>+</Button>
              </div>
              <img src={previewDataUrl} alt={expense.sourceName} style={{ width: `${zoom}%`, marginTop: 8 }} />
            </>
          ) : expense.sourceType.includes('pdf') && previewDataUrl ? (
            <object data={previewDataUrl} type="application/pdf" width="100%" height="500">
              <p>PDF preview unavailable. <a href={previewDataUrl} download={expense.sourceName}>Download</a></p>
            </object>
          ) : (
            <p>PDF preview unavailable.</p>
          )}
        </Card>

        <Card>
          <form onSubmit={form.handleSubmit((d) => save(d, 'Completed'))} className="grid">
            <div>Overall confidence: <strong>{expense.confidenceScore}%</strong></div>
            {Object.entries(expense.fieldConfidence).map(([field, level]) => (
              <div key={field} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{field}</span><Badge label={level} tone={level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'danger'} /></div>
            ))}

            <Input data-testid="vendor-input" placeholder="Vendor" {...form.register('vendor')} />
            <Input type="date" {...form.register('date')} />
            <Select {...form.register('currency')}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></Select>
            <Input type="number" step="0.01" {...form.register('subtotal', { valueAsNumber: true })} />
            <Input type="number" step="0.01" {...form.register('tax', { valueAsNumber: true })} />
            <Input type="number" step="0.01" {...form.register('total', { valueAsNumber: true })} />
            <Input placeholder="Category" {...form.register('category')} />
            <Input placeholder="Payment method" {...form.register('paymentMethod')} />
            <Input placeholder="Notes" {...form.register('notes')} />

            {warning && <p style={{ color: '#b45309' }}>Warning: subtotal + tax does not match total (tolerance 0.02).</p>}
            {form.formState.errors.date && <p style={{ color: '#dc2626' }}>{form.formState.errors.date.message}</p>}

            <h4>Line items</h4>
            {fields.map((field, idx) => (
              <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 4 }}>
                <Input {...form.register(`lineItems.${idx}.description`)} />
                <Input type="number" {...form.register(`lineItems.${idx}.qty`, { valueAsNumber: true })} />
                <Input type="number" {...form.register(`lineItems.${idx}.unitPrice`, { valueAsNumber: true })} />
                <Input type="number" {...form.register(`lineItems.${idx}.total`, { valueAsNumber: true })} />
                <Button type="button" variant="outline" onClick={() => remove(idx)}>x</Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ description: '', qty: 1, unitPrice: 0, total: 0 })}>Add line item</Button>

            <Card>
              <h4>Presented receipt totals</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Line items running total</span>
                <strong>${lineItemsRunningTotal.toFixed(2)}</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Taxes breakdown</strong>
                {taxesBreakdown.length === 0 ? (
                  <p style={{ margin: '4px 0' }}>No taxes extracted.</p>
                ) : (
                  taxesBreakdown.map((tax) => (
                    <div key={tax.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{tax.name}{typeof tax.rate === 'number' ? ` (${(tax.rate * 100).toFixed(2)}%)` : ''}</span>
                      <span>${tax.amount.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>Total tax</span>
                <strong>${taxesTotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                <span>Receipt total (line items + taxes)</span>
                <strong>${presentedReceiptTotal.toFixed(2)}</strong>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button type="submit">Save & Mark Reviewed</Button>
              <Button type="button" variant="outline" onClick={form.handleSubmit((d) => save(d, 'Needs Review'))}>Mark as Needs Review</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  deleteExpense(id);
                  toast.success('Expense deleted');
                  router.push('/expenses');
                }}
              >
                Delete
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
