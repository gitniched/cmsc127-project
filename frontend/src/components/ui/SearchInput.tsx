import type { InputHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?:       string;
  onChange:     (value: string) => void;
  debounceMs?:  number;
  placeholder?: string;
  className?:   string;
}

export default function SearchInput({
  value:        controlledValue,
  onChange,
  debounceMs  = 300,
  placeholder = 'Search…',
  className   = '',
  ...rest
}: SearchInputProps) {
  const [inner, setInner]   = useState(controlledValue ?? '');
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled        = controlledValue !== undefined;

  useEffect(() => {
    if (isControlled) setInner(controlledValue);
  }, [controlledValue, isControlled]);

  function handleChange(raw: string) {
    setInner(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(raw), debounceMs);
  }

  function handleClear() {
    setInner('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange('');
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className={['relative flex items-center', className].join(' ')}>
      <span className="absolute left-3 text-ink-faint pointer-events-none">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>

      <input
        {...rest}
        type="text"
        value={inner}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full h-9 pl-9 pr-8 text-sm rounded-md',
          'border text-ink placeholder:text-ink-faint',
          'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
          'transition-colors duration-150',
        ].join(' ')}
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          borderColor: 'rgba(226, 232, 240, 0.9)',
        }}
      />

      {inner && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 text-ink-faint hover:text-ink transition-colors duration-150"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}