import type { ReactNode } from 'react';

interface StatCardProps {
  label:      string;
  value:      number | string;
  icon?:      ReactNode;
  accent?:    'blue' | 'red' | 'green' | 'amber';
  className?: string;
}

const ACCENT_STYLES = {
  blue:  { bar: 'bg-brand-500',   icon: 'bg-brand-50/60  text-brand-500'  },
  red:   { bar: 'bg-danger-500',  icon: 'bg-danger-50/60 text-danger-500' },
  green: { bar: 'bg-emerald-500', icon: 'bg-emerald-50/60 text-emerald-600' },
  amber: { bar: 'bg-amber-400',   icon: 'bg-amber-50/60  text-amber-600'  },
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
        'relative rounded-lg overflow-hidden',
        'flex flex-col justify-between p-5 gap-3',
        className,
      ].join(' ')}
      style={{
        background: 'rgba(255, 255, 255, 0.45)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        backdropFilter: 'blur(16px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)',
      }}
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