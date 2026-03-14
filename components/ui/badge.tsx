import { cn } from '@/lib/utils';

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'warning' | 'success' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
        tone === 'default' && 'bg-slate-100 text-slate-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'success' && 'bg-green-100 text-green-700',
        tone === 'danger' && 'bg-red-100 text-red-700',
      )}
    >
      {label}
    </span>
  );
}
