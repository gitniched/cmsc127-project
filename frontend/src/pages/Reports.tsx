import { useEffect, useRef } from 'react';
import Layout from '../components/ui/Layout';
import ReportRunner, { defaultParams } from '../components/reports/ReportRunner';
import ReportTable from '../components/reports/ReportTable';
import type { ReportId, ReportParams, Report1Params, Report2Params, Report3Params, Report5Params, Report6Params, Report7Params } from '../components/reports/ReportRunner';
import type { ReportRow } from '../components/reports/ReportTable';
import {
  useReport1,
  useReport2,
  useReport3,
  useReport4,
  useReport5,
  useReport6,
  useReport7,
} from '../hooks/useReports';
import { useDrivers } from '../hooks/useDrivers';
import { useState } from 'react';

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

function buildEmptyMessage(reportId: ReportId, params: ReportParams): string {
  switch (reportId) {
    case 1: {
      const p = params as Report1Params;
      const parts: string[] = [];
      if (p.license_type)   parts.push(`type "${p.license_type}"`);
      if (p.license_status) parts.push(`status "${p.license_status}"`);
      if (p.sex)            parts.push(p.sex === 'M' ? 'sex "Male"' : 'sex "Female"');
      if (p.age_min !== undefined && p.age_max !== undefined) parts.push(`age ${p.age_min}–${p.age_max}`);
      else if (p.age_min !== undefined)                       parts.push(`age ≥ ${p.age_min}`);
      else if (p.age_max !== undefined)                       parts.push(`age ≤ ${p.age_max}`);
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportId>(1);

  const { drivers } = useDrivers();

  const [params, setParams] = useState<Record<ReportId, ReportParams>>({
    1: defaultParams(1),
    2: defaultParams(2),
    3: defaultParams(3),
    4: defaultParams(4),
    5: defaultParams(5),
    6: defaultParams(6),
    7: defaultParams(7),
  });

  const [hasRun, setHasRun] = useState<Record<ReportId, boolean>>({
    1: false, 2: false, 3: false, 4: false,
    5: false, 6: false, 7: false,
  });

  const r1 = useReport1();
  const r2 = useReport2();
  const r3 = useReport3();
  const r4 = useReport4();
  const r5 = useReport5();
  const r6 = useReport6();
  const r7 = useReport7();

  const reports = { 1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: r7 } as const;

  const autoRanRef = useRef<Set<ReportId>>(new Set());

  useEffect(() => {
    if (AUTO_RUN_REPORTS.includes(activeTab) && !autoRanRef.current.has(activeTab)) {
      autoRanRef.current.add(activeTab);
      handleRun(activeTab, params[activeTab]);
    }
  }, [activeTab]);

  function handleRun(reportId: ReportId, p: ReportParams) {
    setHasRun((prev) => ({ ...prev, [reportId]: true }));
    switch (reportId) {
      case 1: {
        const p1 = p as Report1Params;
        r1.run({
          ...p1,
          age_min: p1.age_min === '' ? undefined : p1.age_min,
          age_max: p1.age_max === '' ? undefined : p1.age_max,
        });
        break;
      }
      case 2: r2.run(p as Report2Params); break;
      case 3: r3.run(p as Report3Params); break;
      case 4: r4.run(); break;
      case 5: r5.run(p as Report5Params); break;
      case 6: {
        const p6 = p as Report6Params;
        if (p6.year === '') break;
        r6.run({ year: p6.year });
        break;
      }
      case 7: r7.run(p as Report7Params); break;
    }
  }

  function handleParamsChange(reportId: ReportId, p: ReportParams) {
    setParams((prev) => ({ ...prev, [reportId]: p }));
  }

  const current       = reports[activeTab];
  const currentRows   = current.rows as ReportRow[];
  const currentHasRun = hasRun[activeTab];

  return (
    <Layout>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
          border-radius: 12px;
        }
        .glass-card-header {
          border-bottom: 1px solid rgba(226, 232, 240, 0.7);
        }
        .glass-tab {
          position: relative;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          color: var(--color-ink-muted, #64748b);
          transition: color 150ms ease, background 150ms ease;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .glass-tab:hover {
          color: var(--color-ink, #0f172a);
          background: rgba(255, 255, 255, 0.4);
        }
        .glass-tab.active {
          color: var(--color-brand-600, #2563eb);
          background: rgba(255, 255, 255, 0.6);
          box-shadow: 0 1px 4px 0 rgba(0,0,0,0.08);
        }
      `}</style>
      <div className="px-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="glass-card px-5 py-4 self-start">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Reports</h1>
          <p className="text-sm text-ink-muted mt-1">Run and export any of the 7 system reports.</p>
        </div>

        <div className="glass-card px-3 py-2 flex gap-1 overflow-x-auto">
          {REPORT_TABS.map((tab) => {
            const state    = reports[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`glass-tab flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
              >
                <span className="text-ink-faint text-xs">{tab.id}</span>
                {tab.label}
                {hasRun[tab.id] && !state.loading && (
                  <span
                    className={[
                      'inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] h-5 text-xs font-semibold',
                      isActive
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
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 glass-card-header">
              <h2 className="text-sm font-semibold text-ink">
                {REPORT_TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="px-5 py-4">
              <ReportRunner
                reportId={activeTab}
                params={params[activeTab]}
                onParamsChange={(p) => handleParamsChange(activeTab, p)}
                onRun={(p) => handleRun(activeTab, p)}
                loading={current.loading}
                drivers={drivers}
              />
            </div>
          </div>

          {current.error && (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {current.error}
            </div>
          )}

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

          {!current.loading && !current.error && currentHasRun && (
            <div className="glass-card overflow-hidden">
              <ReportTable
                reportId={activeTab}
                rows={currentRows}
                emptyMessage={buildEmptyMessage(activeTab, params[activeTab])}
              />
            </div>
          )}

          {!current.loading && !currentHasRun && !AUTO_RUN_REPORTS.includes(activeTab) && (
            <div className="glass-card flex flex-col items-center justify-center py-16 text-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-ink-faint">
                <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 11h24" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 17h12M10 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-ink-muted">
                Fill in the parameters above and click{' '}
                <span className="font-medium text-ink">Run Report</span> to see results.
              </p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}