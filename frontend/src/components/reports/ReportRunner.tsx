import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Button from '../ui/Button';
import FilterBar from '../ui/FilterBar';
import type { FilterControl } from '../ui/FilterBar';
import type { DriverWithAge } from '@shared/types/driver.types';
import { getFullName } from '@shared/types/driver.types';
import {
  LICENSE_TYPE_OPTIONS,
  LICENSE_STATUS_OPTIONS,
  SEX_OPTIONS,
} from '../../constants/enums';

export type ReportId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Report1Params {
  license_type:   string;
  license_status: string;
  age_min:        number | '';
  age_max:        number | '';
  sex:            string;
}

export interface Report2Params {
  license_number: string;
}

export interface Report3Params {
  as_of_date: string;
}

export interface Report4Params {}

export interface Report5Params {
  license_number: string;
  start_date:     string;
  end_date:       string;
}

export interface Report6Params {
  year: number | '';
}

export interface Report7Params {
  city:   string;
  region: string;
}

export type ReportParams =
  | Report1Params
  | Report2Params
  | Report3Params
  | Report4Params
  | Report5Params
  | Report6Params
  | Report7Params;

export function defaultParams(reportId: ReportId): ReportParams {
  switch (reportId) {
    case 1: return { license_type: '', license_status: '', age_min: '', age_max: '', sex: '' };
    case 2: return { license_number: '' };
    case 3: return { as_of_date: new Date().toISOString().slice(0, 10) };
    case 4: return {};
    case 5: return { license_number: '', start_date: '', end_date: '' };
    case 6: return { year: new Date().getFullYear() };
    case 7: return { city: '', region: '' };
  }
}

interface ReportRunnerProps {
  reportId:       ReportId;
  params:         ReportParams;
  onParamsChange: (params: ReportParams) => void;
  onRun:          (params: ReportParams) => void;
  loading?:       boolean;
  drivers?:       DriverWithAge[];
}

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

const quickChipBase = [
  'h-7 px-2.5 text-xs font-medium rounded-md border transition-colors duration-150 cursor-pointer',
  'bg-surface-raised border-border text-ink-muted',
  'hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700',
].join(' ');

const REPORT_LABELS: Record<ReportId, string> = {
  1: 'Drivers filtered by license type, status, age range, or sex',
  2: 'All vehicles owned by a given driver',
  3: 'Vehicles with expired registrations as of a given date',
  4: 'All drivers with expired or suspended licenses',
  5: 'Violations by a given driver within a date range',
  6: 'Total violations per type for a given year',
  7: 'Vehicles involved in violations within a city or region',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = Array.from(
  { length: CURRENT_YEAR - 1999 },
  (_, i) => CURRENT_YEAR - i,
);

function PortalDropdown({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement>;
  children:  React.ReactNode;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
  });

  return createPortal(<div style={style}>{children}</div>, document.body);
}

const dropdownList = 'bg-surface border border-border rounded-md shadow-lg max-h-52 overflow-y-auto';
const dropdownItem = 'w-full px-3 py-2 text-left text-sm cursor-pointer flex items-center justify-between gap-4 hover:bg-surface-inset';

interface DriverComboboxProps {
  label:         string;
  drivers:       DriverWithAge[];
  licenseNumber: string;
  onChange:      (licenseNumber: string) => void;
}

function DriverCombobox({ label, drivers, licenseNumber, onChange }: DriverComboboxProps) {
  const selectedDriver = drivers.find((d) => d.license_number === licenseNumber) ?? null;
  const [query, setQuery] = useState(selectedDriver ? getFullName(selectedDriver) : '');
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!licenseNumber) setQuery('');
    else {
      const d = drivers.find((d) => d.license_number === licenseNumber);
      if (d) setQuery(getFullName(d));
    }
  }, [licenseNumber, drivers]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        getFullName(d).toLowerCase().includes(q) ||
        d.license_number.toLowerCase().includes(q),
    );
  }, [drivers, query]);

  return (
    <div ref={ref} className="relative min-w-72">
      <label className={labelBase}>
        {label} <span className="text-danger-500">*</span>
      </label>
      <input
        className={inputBase}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange('');
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or license number…"
        autoComplete="off"
      />
      {licenseNumber && (
        <p className="mt-1 text-xs text-ink-faint font-mono">{licenseNumber}</p>
      )}
      {!licenseNumber && query && (
        <p className="mt-1 text-xs text-warning-600">Select a driver from the list</p>
      )}
      {open && filtered.length > 0 && (
        <PortalDropdown anchorRef={ref as React.RefObject<HTMLElement>}>
          <ul className={dropdownList}>
            {filtered.map((d) => (
              <li key={d.license_number}>
                <button
                  type="button"
                  className={dropdownItem}
                  onMouseDown={() => {
                    onChange(d.license_number);
                    setQuery(getFullName(d));
                    setOpen(false);
                  }}
                >
                  <span className="text-ink">{getFullName(d)}</span>
                  <span className="font-mono text-xs text-ink-faint shrink-0">{d.license_number}</span>
                </button>
              </li>
            ))}
          </ul>
        </PortalDropdown>
      )}
      {open && filtered.length === 0 && query && (
        <PortalDropdown anchorRef={ref as React.RefObject<HTMLElement>}>
          <div className="bg-surface border border-border rounded-md shadow-lg px-3 py-2 text-sm text-ink-muted">
            No drivers found.
          </div>
        </PortalDropdown>
      )}
    </div>
  );
}

function Report1Runner({
  params, onParamsChange, onRun, loading,
}: {
  params:         Report1Params;
  onParamsChange: (p: Report1Params) => void;
  onRun:          (p: Report1Params) => void;
  loading?:       boolean;
}) {
  function set<K extends keyof Report1Params>(key: K, value: Report1Params[K]) {
    onParamsChange({ ...params, [key]: value });
  }

  const controls: FilterControl[] = [
    {
      type:     'select',
      key:      'license_type',
      label:    'License Type',
      options:  LICENSE_TYPE_OPTIONS.map((v) => ({ label: v, value: v })),
      value:    params.license_type,
      onChange: (v) => set('license_type', v),
    },
    {
      type:     'select',
      key:      'license_status',
      label:    'License Status',
      options:  LICENSE_STATUS_OPTIONS.map((v) => ({ label: v, value: v })),
      value:    params.license_status,
      onChange: (v) => set('license_status', v),
    },
    {
      type:           'number-range',
      key:            'age',
      label:          'Age Range',
      minValue:       params.age_min,
      maxValue:       params.age_max,
      minPlaceholder: 'Min',
      maxPlaceholder: 'Max',
      onMinChange:    (v) => set('age_min', v),
      onMaxChange:    (v) => set('age_max', v),
    },
    {
      type:     'select',
      key:      'sex',
      label:    'Sex',
      options:  SEX_OPTIONS.map((v) => ({ label: v === 'M' ? 'Male' : 'Female', value: v })),
      value:    params.sex,
      onChange: (v) => set('sex', v),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        controls={controls}
        onReset={() =>
          onParamsChange({ license_type: '', license_status: '', age_min: '', age_max: '', sex: '' })
        }
      />
      <div className="flex justify-end">
        <Button variant="primary" loading={loading} onClick={() => onRun(params)}>
          Run Report
        </Button>
      </div>
    </div>
  );
}

function Report2Runner({
  params, onParamsChange, onRun, loading, drivers,
}: {
  params:         Report2Params;
  onParamsChange: (p: Report2Params) => void;
  onRun:          (p: Report2Params) => void;
  loading?:       boolean;
  drivers:        DriverWithAge[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass">
        <DriverCombobox
          label="Driver"
          drivers={drivers}
          licenseNumber={params.license_number}
          onChange={(ln) => onParamsChange({ license_number: ln })}
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!params.license_number}
          onClick={() => onRun(params)}
        >
          Run Report
        </Button>
      </div>
    </div>
  );
}

function Report3Runner({
  params, onParamsChange, onRun, loading,
}: {
  params:         Report3Params;
  onParamsChange: (p: Report3Params) => void;
  onRun:          (p: Report3Params) => void;
  loading?:       boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = params.as_of_date === today;

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass">
        <div className="min-w-48 max-w-xs">
          <label className={labelBase}>
            As of Date <span className="text-danger-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className={inputBase}
              value={params.as_of_date}
              onChange={(e) => onParamsChange({ as_of_date: e.target.value })}
            />
            <button
              type="button"
              className={[
                quickChipBase,
                isToday ? 'bg-brand-50 border-brand-300 text-brand-700' : '',
              ].join(' ')}
              onClick={() => onParamsChange({ as_of_date: today })}
            >
              Today
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!params.as_of_date}
          onClick={() => onRun(params)}
        >
          Run Report
        </Button>
      </div>
    </div>
  );
}

function Report4Runner({ onRun, loading }: { onRun: (p: Report4Params) => void; loading?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass">
        <p className="text-sm text-ink-muted">
          Returns all drivers whose license status is{' '}
          <span className="font-medium text-ink">Expired</span> or{' '}
          <span className="font-medium text-ink">Suspended</span>. No parameters required.
        </p>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" loading={loading} onClick={() => onRun({})}>
          Run Report
        </Button>
      </div>
    </div>
  );
}

function Report5Runner({
  params, onParamsChange, onRun, loading, drivers,
}: {
  params:         Report5Params;
  onParamsChange: (p: Report5Params) => void;
  onRun:          (p: Report5Params) => void;
  loading?:       boolean;
  drivers:        DriverWithAge[];
}) {
  function applyDatePreset(preset: 'this-month' | 'this-year' | 'clear') {
    const now = new Date();
    if (preset === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      onParamsChange({ ...params, start_date: start, end_date: end });
    } else if (preset === 'this-year') {
      const start = `${now.getFullYear()}-01-01`;
      const end   = `${now.getFullYear()}-12-31`;
      onParamsChange({ ...params, start_date: start, end_date: end });
    } else {
      onParamsChange({ ...params, start_date: '', end_date: '' });
    }
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const thisMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const thisYearStart  = `${now.getFullYear()}-01-01`;
  const thisYearEnd    = `${now.getFullYear()}-12-31`;

  const isThisMonth = params.start_date === thisMonthStart && params.end_date === thisMonthEnd;
  const isThisYear  = params.start_date === thisYearStart  && params.end_date === thisYearEnd;
  const hasDates    = params.start_date || params.end_date;

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass flex flex-wrap items-start gap-4">
        <DriverCombobox
          label="Driver"
          drivers={drivers}
          licenseNumber={params.license_number}
          onChange={(ln) => onParamsChange({ ...params, license_number: ln })}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label className={labelBase + ' mb-0'}>Date Range (optional)</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={[quickChipBase, isThisMonth ? 'bg-brand-50 border-brand-300 text-brand-700' : ''].join(' ')}
                onClick={() => applyDatePreset('this-month')}
              >
                This month
              </button>
              <button
                type="button"
                className={[quickChipBase, isThisYear ? 'bg-brand-50 border-brand-300 text-brand-700' : ''].join(' ')}
                onClick={() => applyDatePreset('this-year')}
              >
                This year
              </button>
              {hasDates && (
                <button
                  type="button"
                  className={quickChipBase}
                  onClick={() => applyDatePreset('clear')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={params.start_date}
              onChange={(e) => onParamsChange({ ...params, start_date: e.target.value })}
              className={inputBase + ' w-36'}
            />
            <span className="text-ink-faint text-xs shrink-0">–</span>
            <input
              type="date"
              value={params.end_date}
              onChange={(e) => onParamsChange({ ...params, end_date: e.target.value })}
              className={inputBase + ' w-36'}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!params.license_number}
          onClick={() => onRun(params)}
        >
          Run Report
        </Button>
      </div>
    </div>
  );
}

function Report6Runner({
  params, onParamsChange, onRun, loading,
}: {
  params:         Report6Params;
  onParamsChange: (p: Report6Params) => void;
  onRun:          (p: Report6Params) => void;
  loading?:       boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass">
        <div className="min-w-32 max-w-xs">
          <label className={labelBase}>
            Year <span className="text-danger-500">*</span>
          </label>
          <select
            className={inputBase}
            value={params.year}
            onChange={(e) =>
              onParamsChange({ year: e.target.value === '' ? '' : Number(e.target.value) })
            }
          >
            <option value="">Select a year…</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}{y === CURRENT_YEAR ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={params.year === ''}
          onClick={() => onRun(params)}
        >
          Run Report
        </Button>
      </div>
    </div>
  );
}

const CITY_REGION_MAP: Record<string, string> = {
  'Manila':       'NCR',
  'Quezon City':  'NCR',
  'Caloocan':     'NCR',
  'Pasig':        'NCR',
  'Mandaluyong':  'NCR',
  'Makati':       'NCR',
  'Taguig':       'NCR',
  'Marikina':     'NCR',
  'Cebu City':    'Region VII',
  'Davao City':   'Region XI',
  'Iloilo City':  'Region VI',
};

const ALL_CITIES  = Object.keys(CITY_REGION_MAP);
const ALL_REGIONS = [...new Set(Object.values(CITY_REGION_MAP))].sort();

function LocationAutocomplete({
  label, value, onChange, suggestions, placeholder, autoFilled,
}: {
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  suggestions:  string[];
  placeholder:  string;
  autoFilled?:  boolean;
}) {
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          s.toLowerCase() !== value.toLowerCase(),
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); onChange(filtered[active]); setOpen(false); setActive(-1); }
    if (e.key === 'Escape') { setOpen(false); setActive(-1); }
  }

  return (
    <div className="relative min-w-48" ref={containerRef}>
      <label className={labelBase}>
        {label}
        {autoFilled && (
          <span className="ml-1.5 text-xs font-normal text-brand-500">(auto-filled)</span>
        )}
      </label>
      <input
        className={inputBase}
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((s, i) => (
            <li
              key={s}
              className={[
                'px-3 py-2 text-sm cursor-pointer select-none',
                i === active ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-surface-raised',
              ].join(' ')}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); setActive(-1); }}
              onMouseEnter={() => setActive(i)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Report7Runner({
  params, onParamsChange, onRun, loading,
}: {
  params:         Report7Params;
  onParamsChange: (p: Report7Params) => void;
  onRun:          (p: Report7Params) => void;
  loading?:       boolean;
}) {
  const [mode, setMode] = useState<'city' | 'region'>('city');

  function handleModeSwitch(next: 'city' | 'region') {
    setMode(next);
    onParamsChange({ city: '', region: '' });
  }

  const hasValue = mode === 'city' ? params.city.trim() !== '' : params.region.trim() !== '';

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 runner-glass flex flex-col gap-3">
        <div className="flex gap-1">
          <button
            type="button"
            className={[quickChipBase, mode === 'city' ? 'bg-brand-50 border-brand-300 text-brand-700' : ''].join(' ')}
            onClick={() => handleModeSwitch('city')}
          >
            Search by City
          </button>
          <button
            type="button"
            className={[quickChipBase, mode === 'region' ? 'bg-brand-50 border-brand-300 text-brand-700' : ''].join(' ')}
            onClick={() => handleModeSwitch('region')}
          >
            Search by Region
          </button>
        </div>
        {mode === 'city' ? (
          <LocationAutocomplete
            label="City"
            value={params.city}
            onChange={(city) => onParamsChange({ city, region: '' })}
            suggestions={ALL_CITIES}
            placeholder="e.g. Manila"
          />
        ) : (
          <LocationAutocomplete
            label="Region"
            value={params.region}
            onChange={(region) => onParamsChange({ city: '', region })}
            suggestions={ALL_REGIONS}
            placeholder="e.g. NCR"
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!hasValue}
          onClick={() => onRun(params)}
        >
          Run Report
        </Button>
      </div>
    </div>
  );
}

export default function ReportRunner({
  reportId,
  params,
  onParamsChange,
  onRun,
  loading,
  drivers = [],
}: ReportRunnerProps) {
  return (
    <div className="flex flex-col gap-3">
      <style>{`
        .runner-glass {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px) saturate(1.4);
          -webkit-backdrop-filter: blur(12px) saturate(1.4);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 8px;
        }
      `}</style>
      <p className="text-sm text-ink-muted">{REPORT_LABELS[reportId]}</p>

      {reportId === 1 && (
        <Report1Runner
          params={params as Report1Params}
          onParamsChange={onParamsChange as (p: Report1Params) => void}
          onRun={onRun as (p: Report1Params) => void}
          loading={loading}
        />
      )}
      {reportId === 2 && (
        <Report2Runner
          params={params as Report2Params}
          onParamsChange={onParamsChange as (p: Report2Params) => void}
          onRun={onRun as (p: Report2Params) => void}
          loading={loading}
          drivers={drivers}
        />
      )}
      {reportId === 3 && (
        <Report3Runner
          params={params as Report3Params}
          onParamsChange={onParamsChange as (p: Report3Params) => void}
          onRun={onRun as (p: Report3Params) => void}
          loading={loading}
        />
      )}
      {reportId === 4 && (
        <Report4Runner
          onRun={onRun as (p: Report4Params) => void}
          loading={loading}
        />
      )}
      {reportId === 5 && (
        <Report5Runner
          params={params as Report5Params}
          onParamsChange={onParamsChange as (p: Report5Params) => void}
          onRun={onRun as (p: Report5Params) => void}
          loading={loading}
          drivers={drivers}
        />
      )}
      {reportId === 6 && (
        <Report6Runner
          params={params as Report6Params}
          onParamsChange={onParamsChange as (p: Report6Params) => void}
          onRun={onRun as (p: Report6Params) => void}
          loading={loading}
        />
      )}
      {reportId === 7 && (
        <Report7Runner
          params={params as Report7Params}
          onParamsChange={onParamsChange as (p: Report7Params) => void}
          onRun={onRun as (p: Report7Params) => void}
          loading={loading}
        />
      )}
    </div>
  );
}