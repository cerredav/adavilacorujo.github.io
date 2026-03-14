import * as React from 'react';
import { cn } from '@/lib/utils';

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-md border border-slate-300 px-3 py-2 bg-white')} {...props} />;
}
