type BadgeStatus =
  | 'Active'
  | 'Expired'
  | 'Suspended'
  | 'Revoked'
  | 'Pending'
  | 'Resolved'
  | 'Contested'
  | 'Dismissed'
  | 'Paid'
  | 'Unpaid'
  | 'Waived'
  | 'Student Permit'
  | 'Non-Professional'
  | 'Professional';

interface BadgeProps {
  status:    BadgeStatus | string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  Active:           'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Expired:          'bg-slate-100  text-slate-600   ring-1 ring-slate-200',
  Suspended:        'bg-danger-50  text-danger-600  ring-1 ring-danger-200',
  Revoked:          'bg-orange-50  text-orange-700  ring-1 ring-orange-200',

  Pending:          'bg-amber-50   text-amber-700   ring-1 ring-amber-200',
  Resolved:         'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Contested:        'bg-violet-50  text-violet-700  ring-1 ring-violet-200',
  Dismissed:        'bg-slate-100  text-slate-600   ring-1 ring-slate-200',

  Paid:             'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Unpaid:           'bg-danger-50  text-danger-600  ring-1 ring-danger-200',
  Waived:           'bg-sky-50     text-sky-700     ring-1 ring-sky-200',

  'Student Permit': 'bg-brand-50   text-brand-600   ring-1 ring-brand-200',
  'Non-Professional':'bg-indigo-50 text-indigo-700  ring-1 ring-indigo-200',
  Professional:     'bg-brand-100  text-brand-700   ring-1 ring-brand-200',
};

const FALLBACK_STYLE = 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

export default function Badge({ status, className = '' }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? FALLBACK_STYLE;

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide',
        style,
        className,
      ].join(' ')}
    >
      {status}
    </span>
  );
}