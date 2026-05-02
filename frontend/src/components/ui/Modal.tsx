import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open:       boolean;
  onClose?:   () => void;
  title?:     string;
  size?:      ModalSize;
  children:   ReactNode;
  footer?:    ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  size      = 'md',
  children,
  footer,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => panelRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative z-10 w-full rounded-xl outline-none',
          'flex flex-col max-h-[90vh]',
          sizeClasses[size],
          className,
        ].join(' ')}
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}
          >
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Close modal"
              className={[
                'w-8 h-8 flex items-center justify-center rounded-md text-ink-faint',
                'hover:text-ink hover:bg-white/30 transition-colors duration-150',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div
            className="px-6 py-4 shrink-0 flex items-center justify-end gap-3"
            style={{ borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}