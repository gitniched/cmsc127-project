import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'danger' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  icon?:     ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 hover:border-brand-600 active:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300 disabled:bg-brand-200 disabled:border-brand-200 disabled:text-white',
  danger:
    'bg-danger-500 text-white border border-danger-500 hover:bg-danger-600 hover:border-danger-600 active:bg-danger-700 focus-visible:ring-2 focus-visible:ring-danger-200 disabled:bg-danger-200 disabled:border-danger-200 disabled:text-white',
  ghost:
    'text-ink-muted border border-white/40 hover:text-ink active:bg-white/50 focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-40',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5',
  md: 'h-9  px-4   text-sm  gap-2',
  lg: 'h-11 px-5   text-sm  gap-2',
};

const ghostStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.35)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

export default function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-150 outline-none cursor-pointer',
        'disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      style={variant === 'ghost' ? { ...ghostStyle, ...style } : style}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}