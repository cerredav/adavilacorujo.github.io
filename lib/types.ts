export type UploadStatus = 'Queued' | 'Uploading' | 'Processing' | 'Needs Review' | 'Completed' | 'Failed';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ExpenseStatus = 'Needs Review' | 'Completed' | 'Processing';


export type TaxLine = {
  name: string;
  amount: number;
  rate?: number;
};

export type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type Expense = {
  id: string;
  sourceName: string;
  sourceType: string;
  sourceSize: number;
  documentStorageId?: string;
  vendor: string;
  date: string;
  currency: 'USD' | 'EUR' | 'GBP';
  subtotal: number;
  tax: number;
  total: number;
  category: string;
  paymentMethod?: string;
  notes?: string;
  taxes: TaxLine[];
  lineItems: LineItem[];
  fieldConfidence: Record<string, ConfidenceLevel>;
  confidenceScore: number;
  status: ExpenseStatus;
  createdAt: string;
  documentDataUrl?: string;
};

export type UploadItem = {
  id: string;
  fileName: string;
  type: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
  expenseId?: string;
  documentStorageId?: string;
};
