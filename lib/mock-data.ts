import { formatISO, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Expense, ExpenseStatus } from './types';

const vendors = ['Office Depot', 'Shell', 'Amazon Business', 'Staples', 'Delta Air', 'Uber', 'Costco'];
const categories = ['Office Supplies', 'Fuel', 'Travel', 'Meals', 'Software', 'Owner Draw', 'Fines'];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h << 5) - h + text.charCodeAt(i);
  return Math.abs(h);
}

export function generateExpenseFromFile(
  name: string,
  type: string,
  size: number,
  dataUrl?: string,
  documentStorageId?: string,
  inferenceText?: string,
  inferenceConfidence?: number,
): Expense {
  const seed = hash(name);
  const vendor = vendors[seed % vendors.length];
  const category = categories[seed % categories.length];
  const subtotal = Number((((seed % 25000) + 500) / 100).toFixed(2));
  const tax = Number((subtotal * 0.08).toFixed(2));
  const mismatch = seed % 4 === 0;
  const total = mismatch ? Number((subtotal + tax + 0.07).toFixed(2)) : Number((subtotal + tax).toFixed(2));
  const low = seed % 5 === 0 || (inferenceConfidence ?? 1) < 0.7;
  const status: ExpenseStatus = low || mismatch ? 'Needs Review' : 'Completed';

  return {
    id: uuidv4(),
    sourceName: name,
    sourceType: type,
    sourceSize: size,
    vendor,
    documentStorageId,
    date: formatISO(subDays(new Date(), seed % 60), { representation: 'date' }),
    currency: (['USD', 'EUR', 'GBP'] as const)[seed % 3],
    subtotal,
    tax,
    total,
    category,
    paymentMethod: ['Card', 'Cash', 'ACH'][seed % 3],
    notes: low
      ? `Low OCR confidence, verify details.${inferenceText ? ` OCR: ${inferenceText}` : ''}`
      : inferenceText
        ? `OCR: ${inferenceText}`
        : '',
    taxes: [{ name: 'Sales Tax', amount: tax, rate: 0.08 }],
    lineItems: [
      {
        id: uuidv4(),
        description: `${category} item`,
        qty: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ],
    fieldConfidence: {
      vendor: low ? 'low' : 'high',
      date: 'medium',
      total: mismatch ? 'low' : 'high',
      category: low ? 'medium' : 'high',
    },
    confidenceScore: inferenceConfidence ? Math.round(inferenceConfidence * 100) : low ? 54 : mismatch ? 68 : 92,
    status,
    createdAt: new Date().toISOString(),
    documentDataUrl: dataUrl,
  };
}

export function seededExpenses(): Expense[] {
  return Array.from({ length: 10 }).map((_, i) =>
    generateExpenseFromFile(`seed-receipt-${i + 1}.png`, 'image/png', 120000 + i * 1000),
  );
}
