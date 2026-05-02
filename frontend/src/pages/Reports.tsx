import { useState, useEffect, useRef } from 'react';
import Layout from '../components/ui/Layout';
import ReportRunner, { defaultParams } from '../components/reports/ReportRunner';
import ReportTable from '../components/reports/ReportTable';
import type { ReportId, ReportParams, Report1Params, Report2Params, Report3Params, Report5Params, Report6Params, Report7Params } from '../components/reports/ReportRunner';
import type { ReportRow, Report1Row, Report2Row, Report3Row, Report4Row, Report5Row, Report6Row, Report7Row } from '../components/reports/ReportTable';
import { mockDrivers } from '../mock/drivers';
import { mockVehicles } from '../mock/vehicles';
import { mockRegistrations } from '../mock/registrations';
import { mockViolations } from '../mock/violations';
import { LicenseStatus } from '../constants/enums';

const REPORT_TABS: { id: ReportId; label: string }[] = [
  { id: 1, label: 'Drivers' },
  { id: 2, label: 'Vehicles by Driver' },
  { id: 3, label: 'Expired Registrations' },
  { id: 4, label: 'Invalid Licenses' },
  { id: 5, label: 'Driver Violations' },
  { id: 6, label: 'Violations by Type' },
  { id: 7, label: 'Vehicles by Location' },
];

const AUTO_RUN_REPORTS: ReportId[] = [1, 3, 4, 6];

function runReport1(params: Report1Params): Report1Row[] {
  return mockDrivers.filter((d) => {
    if (params.license_type   && d.license_type   !== params.license_type)   return false;
    if (params.license_status && d.license_status !== params.license_status) return false;
    if (params.sex            && d.sex            !== params.sex)            return false;
    if (params.age_min !== '' && d.age < params.age_min)                     return false;
    if (params.age_max !== '' && d.age > params.age_max)                     return false;
    return true;
  });
}

function runReport2(params: Report2Params): Report2Row[] {
  return mockVehicles.filter((v) => v.owner_license_number === params.license_number);
}

function runReport3(params: Report3Params): Report3Row[] {
  const asOf = new Date(params.as_of_date);
  const expiredPlates = new Set(
    mockRegistrations
      .filter((r) => new Date(r.expiration_date) < asOf)
      .map((r) => r.plate_number)
  );
  const latestExpiry: Record<string, string> = {};
  mockRegistrations.forEach((r) => {
    if (expiredPlates.has(r.plate_number)) {
      if (!latestExpiry[r.plate_number] || r.expiration_date > latestExpiry[r.plate_number]) {
        latestExpiry[r.plate_number] = r.expiration_date;
      }
    }
  });
  return mockVehicles
    .filter((v) => expiredPlates.has(v.plate_number))
    .map((v) => ({ ...v, expired_registration_date: latestExpiry[v.plate_number] ?? '' }));
}

function runReport4(): Report4Row[] {
  return mockDrivers.filter(
    (d) => d.license_status === LicenseStatus.Expired || d.license_status === LicenseStatus.Suspended
  );
}

function runReport5(params: Report5Params): Report5Row[] {
  return mockViolations.filter((v) => {
    if (v.license_number !== params.license_number) return false;
    if (params.start_date && v.violation_date < params.start_date) return false;
    if (params.end_date   && v.violation_date > params.end_date)   return false;
    return true;
  });
}

function runReport6(params: Report6Params): Report6Row[] {
  if (params.year === '') return [];
  const year = String(params.year);
  const counts: Record<string, { total_count: number; total_fine: number }> = {};
  mockViolations
    .filter((v) => v.violation_date.startsWith(year))
    .forEach((v) => {
      v.violation_types.forEach((vt) => {
        if (!counts[vt.violation_type]) {
          counts[vt.violation_type] = { total_count: 0, total_fine: 0 };
        }
        counts[vt.violation_type].total_count += 1;
        counts[vt.violation_type].total_fine  += vt.base_fine;
      });
    });
  return Object.entries(counts).map(([violation_type, agg]) => ({
    violation_type,
    ...agg,
  }));
}

function runReport7(params: Report7Params): Report7Row[] {
  const city   = params.city.toLowerCase();
  const region = params.region.toLowerCase();
  const violationsByPlate: Record<string, number> = {};
  mockViolations
    .filter((v) => {
      const matchCity   = city   ? v.violation_location_city.toLowerCase().includes(city)     : true;
      const matchRegion = region ? v.violation_location_region.toLowerCase().includes(region) : true;
      return matchCity && matchRegion;
    })
    .forEach((v) => {
      violationsByPlate[v.plate_number] = (violationsByPlate[v.plate_number] ?? 0) + 1;
    });
  const plates = new Set(Object.keys(violationsByPlate));
  return mockVehicles
    .filter((v) => plates.has(v.plate_number))
    .map((v) => ({ ...v, violation_count: violationsByPlate[v.plate_number] }));
}

function buildEmptyMessage(reportId: ReportId, params: ReportParams): string {
  switch (reportId) {
    case 1: {
      const p = params as Report1Params;
      const parts: string[] = [];
      if (p.license_type)   parts.push(`type "${p.license_type}"`);
      if (p.license_status) parts.push(`status "${p.license_status}"`);
      if (p.sex)            parts.push(p.sex === 'M' ? 'sex "Male"' : 'sex "Female"');
      if (p.age_min !== '' || p.age_max !== '') {
        if (p.age_min !== '' && p.age_max !== '') parts.push(`age ${p.age_min}–${p.age_max}`);
        else if (p.age_min !== '')                parts.push(`age ≥ ${p.age_min}`);
        else                                      parts.push(`age ≤ ${p.age_max}`);
      }
      return parts.length > 0
        ? `No drivers found matching ${parts.join(', ')}.`
        : 'No drivers found.';
    }
    case 2: {
      const p = params as Report2Params;
      return `No vehicles found for license number ${p.license_number || '—'}.`;
    }
    case 3: {
      const p = params as Report3Params;
      return `No vehicles with expired registrations as of ${p.as_of_date || '—'}.`;
    }
    case 4:
      return 'No drivers with expired or suspended licenses found.';
    case 5: {
      const p = params as Report5Params;
      const parts: string[] = [`license number ${p.license_number || '—'}`];
      if (p.start_date && p.end_date) parts.push(`between ${p.start_date} and ${p.end_date}`);
      else if (p.start_date)          parts.push(`from ${p.start_date}`);
      else if (p.end_date)            parts.push(`until ${p.end_date}`);
      return `No violations found for ${parts.join(' ')}.`;
    }
    case 6: {
      const p = params as Report6Params;
      return `No violations recorded for ${p.year || '—'}.`;
    }
    case 7: {
      const p = params as Report7Params;
      const parts: string[] = [];
      if (p.city)   parts.push(`city "${p.city}"`);
      if (p.region) parts.push(`region "${p.region}"`);
      return `No vehicles found involved in violations in ${parts.join(' or ') || '—'}.`;
    }
  }
}

interface TabState {
  params:   ReportParams;
  rows:     ReportRow[];
  hasRun:   boolean;
  loading:  boolean;
}

function emptyTabState(reportId: ReportId): TabState {
  return { params: defaultParams(reportId), rows: [], hasRun: false, loading: false };
}

const initialTabState = (): Record<ReportId, TabState> => ({
  1: emptyTabState(1),
  2: emptyTabState(2),
  3: emptyTabState(3),
  4: emptyTabState(4),
  5: emptyTabState(5),
  6: emptyTabState(6),
  7: emptyTabState(7),
});

function executeReport(reportId: ReportId, params: ReportParams): ReportRow[] {
  switch (reportId) {
    case 1: return runReport1(params as Report1Params);
    case 2: return runReport2(params as Report2Params);
    case 3: return runReport3(params as Report3Params);
    case 4: return runReport4();
    case 5: return runReport5(params as Report5Params);
    case 6: return runReport6(params as Report6Params);
    case 7: return runReport7(params as Report7Params);
  }
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportId>(1);
  const [tabState, setTabState]   = useState<Record<ReportId, TabState>>(initialTabState);
  const autoRanRef                = useRef<Set<ReportId>>(new Set());

  useEffect(() => {
    if (AUTO_RUN_REPORTS.includes(activeTab) && !autoRanRef.current.has(activeTab)) {
      autoRanRef.current.add(activeTab);
      handleRun(activeTab, tabState[activeTab].params);
    }
  }, [activeTab]);

  function handleRun(reportId: ReportId, params: ReportParams) {
    setTabState((prev) => ({
      ...prev,
      [reportId]: { ...prev[reportId], params, loading: true },
    }));

    setTimeout(() => {
      const rows = executeReport(reportId, params);
      setTabState((prev) => ({
        ...prev,
        [reportId]: { ...prev[reportId], rows, hasRun: true, loading: false },
      }));
    }, 200);
  }

  function handleParamsChange(reportId: ReportId, params: ReportParams) {
    setTabState((prev) => ({
      ...prev,
      [reportId]: { ...prev[reportId], params },
    }));
  }

  const current = tabState[activeTab];

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Reports</h1>
          <p className="text-sm text-ink-muted mt-1">Run and export any of the 7 system reports.</p>
        </div>

        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {REPORT_TABS.map((tab) => {
            const state = tabState[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                  'border-b-2 -mb-px flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-ink-muted hover:text-ink hover:border-border',
                ].join(' ')}
              >
                <span className="text-ink-faint mr-0.5 text-xs">{tab.id}</span>
                {tab.label}
                {state.hasRun && (
                  <span
                    className={[
                      'inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] h-5 text-xs font-semibold',
                      activeTab === tab.id
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-surface-raised text-ink-muted',
                    ].join(' ')}
                  >
                    {state.rows.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-6">
          <ReportRunner
            reportId={activeTab}
            params={current.params}
            onParamsChange={(params) => handleParamsChange(activeTab, params)}
            onRun={(params) => handleRun(activeTab, params)}
            loading={current.loading}
          />

          {current.loading && (
            <div className="flex items-center justify-center py-12 text-sm text-ink-muted gap-2">
              <svg
                className="animate-spin h-4 w-4 text-brand-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running report…
            </div>
          )}

          {!current.loading && current.hasRun && (
            <ReportTable
              reportId={activeTab}
              rows={current.rows}
              emptyMessage={buildEmptyMessage(activeTab, current.params)}
            />
          )}

          {!current.loading && !current.hasRun && !AUTO_RUN_REPORTS.includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-ink-faint">
                <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 11h24" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 17h12M10 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-ink-muted">Fill in the parameters above and click <span className="font-medium text-ink">Run Report</span> to see results.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}