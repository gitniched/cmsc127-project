import type { ReactNode } from 'react';

interface StatCardProps {
  label:      string;
  value:      number | string;
  icon?:      ReactNode;
  accent?:    'blue' | 'red' | 'green' | 'amber';
  className?: string;
}

const ACCENT_STYLES = {
  blue:  { bar: 'bg-brand-500',   icon: 'bg-brand-50  text-brand-500'  },
  red:   { bar: 'bg-danger-500',  icon: 'bg-danger-50 text-danger-500' },
  green: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  amber: { bar: 'bg-amber-400',   icon: 'bg-amber-50  text-amber-600'  },
};

export default function StatCard({
  label,
  value,
  icon,
  accent    = 'blue',
  className = '',
}: StatCardProps) {
  const { bar, icon: iconStyle } = ACCENT_STYLES[accent];

  return (
    <div
      className={[
        'relative bg-surface rounded-lg overflow-hidden',
        'border border-border shadow-card',
        'flex flex-col justify-between p-5 gap-3',
        className,
      ].join(' ')}
    >
      <div className={['absolute top-0 left-0 right-0 h-0.5', bar].join(' ')} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted leading-snug">{label}</p>
        {icon && (
          <span className={['flex items-center justify-center w-9 h-9 rounded-md shrink-0', iconStyle].join(' ')}>
            {icon}
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-ink tracking-tight tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}