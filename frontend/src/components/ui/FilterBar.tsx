import SearchInput from './SearchInput';

export type FilterControlType = 'search' | 'select' | 'number-range' | 'date-range';

export interface SelectOption {
  label: string;
  value: string;
}

interface SearchControl {
  type:        'search';
  key:         string;
  placeholder?: string;
  value:       string;
  onChange:    (value: string) => void;
}

interface SelectControl {
  type:     'select';
  key:      string;
  label:    string;
  options:  SelectOption[];
  value:    string;
  onChange: (value: string) => void;
}

interface NumberRangeControl {
  type:        'number-range';
  key:         string;
  label:       string;
  minValue:    number | '';
  maxValue:    number | '';
  minPlaceholder?: string;
  maxPlaceholder?: string;
  onMinChange: (value: number | '') => void;
  onMaxChange: (value: number | '') => void;
}

interface DateRangeControl {
  type:          'date-range';
  key:           string;
  label:         string;
  startValue:    string;
  endValue:      string;
  onStartChange: (value: string) => void;
  onEndChange:   (value: string) => void;
}

export type FilterControl =
  | SearchControl
  | SelectControl
  | NumberRangeControl
  | DateRangeControl;

interface FilterBarProps {
  controls:   FilterControl[];
  onReset?:   () => void;
  className?: string;
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.75)',
  borderColor: 'rgba(226, 232, 240, 0.9)',
};

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

export default function FilterBar({ controls, onReset, className = '' }: FilterBarProps) {
  return (
    <div
      className={[
        'glass-card flex items-end gap-3 p-4 overflow-x-auto',
        className,
      ].join(' ')}
    >
      {controls.map((ctrl) => {
        if (ctrl.type === 'search') {
          return (
            <div key={ctrl.key} className="flex-1 min-w-48">
              <SearchInput
                value={ctrl.value}
                onChange={ctrl.onChange}
                placeholder={ctrl.placeholder}
                className="w-full"
              />
            </div>
          );
        }

        if (ctrl.type === 'select') {
          return (
            <div key={ctrl.key} className="flex flex-col gap-1 min-w-36">
              <label className="text-xs font-medium text-ink">{ctrl.label}</label>
              <select
                value={ctrl.value}
                onChange={(e) => ctrl.onChange(e.target.value)}
                className={inputBase}
                style={inputStyle}
              >
                <option value="">All</option>
                {ctrl.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (ctrl.type === 'number-range') {
          return (
            <div key={ctrl.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">{ctrl.label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={ctrl.minValue}
                  onChange={(e) => ctrl.onMinChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={ctrl.minPlaceholder ?? 'Min'}
                  className={[inputBase, 'w-20'].join(' ')}
                  style={inputStyle}
                />
                <span className="text-ink-faint text-xs shrink-0">–</span>
                <input
                  type="number"
                  value={ctrl.maxValue}
                  onChange={(e) => ctrl.onMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={ctrl.maxPlaceholder ?? 'Max'}
                  className={[inputBase, 'w-20'].join(' ')}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        }

        if (ctrl.type === 'date-range') {
          return (
            <div key={ctrl.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">{ctrl.label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={ctrl.startValue}
                  onChange={(e) => ctrl.onStartChange(e.target.value)}
                  className={[inputBase, 'w-36'].join(' ')}
                  style={inputStyle}
                />
                <span className="text-ink-faint text-xs shrink-0">–</span>
                <input
                  type="date"
                  value={ctrl.endValue}
                  onChange={(e) => ctrl.onEndChange(e.target.value)}
                  className={[inputBase, 'w-36'].join(' ')}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        }

        return null;
      })}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-3 text-sm text-ink-muted hover:text-ink rounded-md transition-colors duration-150 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(226,232,240,0.9)',
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}