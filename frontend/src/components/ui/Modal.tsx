import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
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
  size = 'md',
  children,
  footer,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(open);
  const [animateShow, setAnimateShow] = useState(false);

  useEffect(() => {
    let timeoutId: any;

    if (open) {
      setShouldRender(true);
      // Small timeout to allow DOM node to mount before starting entry animation
      timeoutId = setTimeout(() => {
        setAnimateShow(true);
      }, 20);
    } else {
      setAnimateShow(false);
      // Wait for exit transition to finish before unmounting
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 200);
    }

    return () => clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', onKeyDown);

    // Prevent background scrolling cleanly (relying on scrollbar-gutter: stable in CSS to prevent shifts)
    const originalOverflowBody = document.body.style.overflow;
    const originalOverflowHtml = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflowBody;
      document.documentElement.style.overflow = originalOverflowHtml;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && shouldRender) {
      setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [open, shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ease-out',
        animateShow ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/25"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative z-10 w-full rounded-xl outline-none',
          'flex flex-col max-h-[calc(100vh-52px)]',
          'transition-all duration-200 ease-out',
          animateShow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
          sizeClasses[size],
          className,
        ].join(' ')}
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
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
    </div>,
    document.body
  );
}