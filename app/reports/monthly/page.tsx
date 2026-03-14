'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExpenseStore } from '@/store/expense-store';
import { toast } from 'sonner';

const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

export default function MonthlyReportPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const filtered = useMemo(() => expenses.filter((e) => e.date.startsWith(month)), [expenses, month]);
  const total = filtered.reduce((acc, e) => acc + e.total, 0);
  const deductible = filtered.filter((e) => !['Owner Draw', 'Fines'].includes(e.category)).reduce((acc, e) => acc + e.total, 0);
  const nondeductible = total - deductible;

  const categoryData = Object.values(
    filtered.reduce<Record<string, { name: string; value: number }>>((acc, e) => {
      acc[e.category] = { name: e.category, value: (acc[e.category]?.value ?? 0) + e.total };
      return acc;
    }, {}),
  );

  return (
    <div className="grid">
      <h1>Monthly Summary</h1>
      <Card>
        <label>Month</label>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Card><strong>Total Expenses</strong><div>${total.toFixed(2)}</div></Card>
        <Card><strong>Deductible</strong><div>${deductible.toFixed(2)}</div></Card>
        <Card><strong>Non-deductible</strong><div>${nondeductible.toFixed(2)}</div></Card>
      </div>
      <Card>
        {categoryData.length === 0 ? (
          <p>No data for selected month.</p>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {categoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <Button variant="outline" onClick={() => toast.info('PDF export stub: client-side generation can be added.')}>Export PDF</Button>
      </Card>
    </div>
  );
}
