import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive';
};

export function Button({ className, variant = 'default', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer disabled:opacity-50',
        variant === 'default' && 'bg-slate-900 text-white border border-slate-900',
        variant === 'outline' && 'bg-white text-slate-900 border border-slate-300',
        variant === 'destructive' && 'bg-red-600 text-white border border-red-600',
        className,
      )}
      {...props}
    />
  );
}
