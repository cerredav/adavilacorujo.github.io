'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useExpenseStore } from '@/store/expense-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const init = useExpenseStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      {children}
      <Toaster richColors />
    </>
  );
}
