import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import FilterBar from '../ui/FilterBar';
import type { FilterControl } from '../ui/FilterBar';
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
}

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

const REPORT_LABELS: Record<ReportId, string> = {
  1: 'Drivers filtered by license type, status, age range, or sex',
  2: 'All vehicles owned by a given driver',
  3: 'Vehicles with expired registrations as of a given date',
  4: 'All drivers with expired or suspended licenses',
  5: 'Violations by a given driver within a date range',
  6: 'Total violations per type for a given year',
  7: 'Vehicles involved in violations within a city or region',
};

function Report1Runner({
  params, onParamsChange, onRun, loading,
}: {
  params: Report1Params;
  onParamsChange: (p: Report1Params) => void;
  onRun: (p: Report1Params) => void;
  loading?: boolean;
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
  params, onParamsChange, onRun, loading,
}: {
  params: Report2Params;
  onParamsChange: (p: Report2Params) => void;
  onRun: (p: Report2Params) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-surface border border-border rounded-lg">
        <div className="min-w-64 max-w-sm">
          <label className={labelBase}>
            License Number <span className="text-danger-500">*</span>
          </label>
          <input
            className={inputBase + ' font-mono'}
            value={params.license_number}
            onChange={(e) => onParamsChange({ license_number: e.target.value })}
            placeholder="N01-23-100001"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!params.license_number.trim()}
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
  params: Report3Params;
  onParamsChange: (p: Report3Params) => void;
  onRun: (p: Report3Params) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-surface border border-border rounded-lg">
        <div className="min-w-48 max-w-xs">
          <label className={labelBase}>
            As of Date <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            className={inputBase}
            value={params.as_of_date}
            onChange={(e) => onParamsChange({ as_of_date: e.target.value })}
          />
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
      <div className="p-4 bg-surface border border-border rounded-lg">
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
  params, onParamsChange, onRun, loading,
}: {
  params: Report5Params;
  onParamsChange: (p: Report5Params) => void;
  onRun: (p: Report5Params) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-surface border border-border rounded-lg flex flex-wrap items-end gap-3">
        <div className="min-w-64">
          <label className={labelBase}>
            License Number <span className="text-danger-500">*</span>
          </label>
          <input
            className={inputBase + ' font-mono'}
            value={params.license_number}
            onChange={(e) => onParamsChange({ ...params, license_number: e.target.value })}
            placeholder="N01-23-100001"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelBase}>Date Range</label>
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
          disabled={!params.license_number.trim()}
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
  params: Report6Params;
  onParamsChange: (p: Report6Params) => void;
  onRun: (p: Report6Params) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-surface border border-border rounded-lg">
        <div className="min-w-32 max-w-xs">
          <label className={labelBase}>
            Year <span className="text-danger-500">*</span>
          </label>
          <input
            type="number"
            className={inputBase}
            value={params.year}
            min={1990}
            max={2099}
            onChange={(e) =>
              onParamsChange({ year: e.target.value === '' ? '' : Number(e.target.value) })
            }
            placeholder="2025"
          />
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

const ALL_CITIES   = Object.keys(CITY_REGION_MAP);
const ALL_REGIONS  = [...new Set(Object.values(CITY_REGION_MAP))].sort();

function LocationAutocomplete({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  autoFilled,
}: {
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  suggestions:  string[];
  placeholder:  string;
  autoFilled?:  boolean;
}) {
  const [open, setOpen]         = useState(false);
  const [active, setActive]     = useState(-1);
  const containerRef            = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
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
  params: Report7Params;
  onParamsChange: (p: Report7Params) => void;
  onRun: (p: Report7Params) => void;
  loading?: boolean;
}) {
  const [regionAutoFilled, setRegionAutoFilled] = useState(false);

  function handleCityChange(city: string) {
    const mappedRegion = CITY_REGION_MAP[city];
    if (mappedRegion) {
      onParamsChange({ city, region: mappedRegion });
      setRegionAutoFilled(true);
    } else {
      onParamsChange({ ...params, city });
      setRegionAutoFilled(false);
    }
  }

  function handleRegionChange(region: string) {
    onParamsChange({ ...params, region });
    setRegionAutoFilled(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 bg-surface border border-border rounded-lg flex flex-wrap items-end gap-3">
        <LocationAutocomplete
          label="City"
          value={params.city}
          onChange={handleCityChange}
          suggestions={ALL_CITIES}
          placeholder="Manila"
        />
        <LocationAutocomplete
          label="Region"
          value={params.region}
          onChange={handleRegionChange}
          suggestions={ALL_REGIONS}
          placeholder="NCR"
          autoFilled={regionAutoFilled}
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          loading={loading}
          disabled={!params.city.trim() && !params.region.trim()}
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
}: ReportRunnerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-0.5">
          Report {reportId}
        </p>
        <p className="text-sm text-ink">{REPORT_LABELS[reportId]}</p>
      </div>

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