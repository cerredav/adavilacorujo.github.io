'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useExpenseStore } from '@/store/expense-store';
import { Expense } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Td, Th } from '@/components/ui/table';
import { toast } from 'sonner';

const columnHelper = createColumnHelper<Expense>();

export default function ExpensesPage() {
  const router = useRouter();
  const expenses = useExpenseStore((s) => s.expenses);
  const bulkMarkReviewed = useExpenseStore((s) => s.bulkMarkReviewed);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const data = useMemo(() =>
    expenses.filter((e) =>
      e.vendor.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || e.category === category) &&
      (status === 'all' || e.status === status) &&
      (!dateFrom || e.date >= dateFrom) &&
      (!dateTo || e.date <= dateTo),
    ), [expenses, search, category, status, dateFrom, dateTo]);

  const columns = [
    columnHelper.display({
      id: 'select',
      cell: ({ row }) => <input type="checkbox" checked={selected.includes(row.original.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, row.original.id] : s.filter((id) => id !== row.original.id))} />,
      header: () => 'Sel',
    }),
    columnHelper.accessor('vendor', { header: 'Vendor' }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('total', { header: 'Total', cell: (info) => info.getValue().toFixed(2) }),
    columnHelper.accessor('category', { header: 'Category' }),
    columnHelper.accessor('status', { header: 'Status' }),
    columnHelper.accessor('confidenceScore', { header: 'Confidence', cell: (info) => `${info.getValue()}%` }),
    columnHelper.accessor('createdAt', { header: 'Created', cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd') }),
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const exportCsv = () => {
    const rows = data.map((e) => [e.vendor, e.date, e.total, e.category, e.status, e.confidenceScore, e.createdAt].join(','));
    const csv = ['vendor,date,total,category,status,confidence,created_at', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid">
      <h1>Expenses Dashboard</h1>
      <Card>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          <Input placeholder="Search vendor" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Input placeholder="Category" value={category === 'all' ? '' : category} onChange={(e) => setCategory(e.target.value || 'all')} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
          </Select>
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button onClick={() => { bulkMarkReviewed(selected); toast.success('Marked reviewed'); }}>Mark reviewed</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
        {data.length === 0 ? (
          <p>No expenses match your filters.</p>
        ) : (
          <Table>
            <thead>{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <Th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</Th>)}</tr>)}</thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} onClick={() => router.push(`/expenses/${row.original.id}`)} style={{ cursor: 'pointer' }}>
                  {row.getVisibleCells().map((cell) => <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
