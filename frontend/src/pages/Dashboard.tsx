import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { useViolations } from '../hooks/useViolations';
import { useRegistrations } from '../hooks/useRegistrations';
import { getFullName } from '@shared/types/driver.types';
import { LicenseStatus, ViolationStatus, PaymentStatus } from '../constants/enums';
import { ROUTES, buildRoute } from '../constants/routes';

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { drivers, loading: driversLoading } = useDrivers();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { violations, loading: violationsLoading } = useViolations();
  const { registrations, loading: registrationsLoading } = useRegistrations();

  const loading = driversLoading || vehiclesLoading || violationsLoading || registrationsLoading;

  const totalDrivers = drivers.length;
  const totalVehicles = vehicles.length;
  const activeRegistrations = registrations.filter((r) => r.registration_status === 'Active').length;
  const pendingViolations = violations.filter((v) => v.violation_status === ViolationStatus.Pending).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredLicenseDrivers = drivers.filter(
    (d) => d.license_status === LicenseStatus.Expired
  );

  const latestExpiry: Record<string, string> = {};
  registrations.forEach((r) => {
    const existing = latestExpiry[r.plate_number];
    if (!existing || r.expiration_date > existing) {
      latestExpiry[r.plate_number] = r.expiration_date;
    }
  });
  const expiredRegistrationVehicles = vehicles
    .filter((v) => {
      const exp = latestExpiry[v.plate_number];
      return exp && new Date(exp) < today;
    })
    .map((v) => ({ ...v, expiration_date: latestExpiry[v.plate_number] }));

  const pendingCountByDriver: Record<string, number> = {};
  violations.forEach((v) => {
    if (
      v.payment_status === PaymentStatus.Unpaid &&
      v.violation_status !== ViolationStatus.Dismissed &&
      v.violation_status !== ViolationStatus.Contested
    ) {
      pendingCountByDriver[v.license_number] = (pendingCountByDriver[v.license_number] ?? 0) + 1;
    }
  });
  const approachingSuspensionDrivers = drivers
    .filter((d) => (pendingCountByDriver[d.license_number] ?? 0) >= 2)
    .map((d) => ({
      license_number: d.license_number,
      full_name: getFullName(d),
      pending_count: pendingCountByDriver[d.license_number],
    }));

  return (
    <Layout>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
          border-radius: 12px;
        }
        .glass-card-header {
          border-bottom: 1px solid rgba(226, 232, 240, 0.7);
        }
        .glass-card-footer {
          border-top: 1px solid rgba(226, 232, 240, 0.7);
        }
        .glass-divider {
          border-top: 1px solid rgba(226, 232, 240, 0.7);
        }
        .quick-link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .quick-link-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        }
        
        .quick-link-drivers:hover {
          border-color: #3b82f6;
          color: #2563eb;
        }
        .quick-link-vehicles:hover {
          border-color: #10b981;
          color: #059669;
        }
        .quick-link-violations:hover {
          border-color: #ef4444;
          color: #dc2626;
        }
        .quick-link-reports:hover {
          border-color: #f59e0b;
          color: #d97706;
        }
        
        .quick-icon-bg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        
        .quick-link-drivers .quick-icon-bg {
          background: rgba(59, 130, 246, 0.08);
          color: #2563eb;
        }
        .quick-link-drivers:hover .quick-icon-bg {
          background: #2563eb;
          color: #ffffff;
        }
        
        .quick-link-vehicles .quick-icon-bg {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
        }
        .quick-link-vehicles:hover .quick-icon-bg {
          background: #059669;
          color: #ffffff;
        }
        
        .quick-link-violations .quick-icon-bg {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
        }
        .quick-link-violations:hover .quick-icon-bg {
          background: #dc2626;
          color: #ffffff;
        }
        
        .quick-link-reports .quick-icon-bg {
          background: rgba(245, 158, 11, 0.08);
          color: #d97706;
        }
        .quick-link-reports:hover .quick-icon-bg {
          background: #d97706;
          color: #ffffff;
        }
      `}</style>
      <div className="px-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-8">

        <div className="glass-card px-6 py-4 self-start">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">
            Overview of drivers, vehicles, registrations, and violations.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
            <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading dashboard…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Drivers" value={totalDrivers} accent="blue"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
              />
              <StatCard label="Total Vehicles" value={totalVehicles} accent="green"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="10" rx="2" /><path d="M6 8l2-4h8l2 4" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>}
              />
              <StatCard label="Active Registrations" value={activeRegistrations} accent="amber"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>}
              />
              <StatCard label="Pending Violations" value={pendingViolations} accent="red"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="glass-card px-4 py-2 self-start">
                <h2 className="text-base font-semibold text-ink">Quick Links</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Drivers',
                    route: ROUTES.drivers,
                    className: 'quick-link-drivers',
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    )
                  },
                  {
                    label: 'Vehicles',
                    route: ROUTES.vehicles,
                    className: 'quick-link-vehicles',
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="8" width="20" height="10" rx="2" />
                        <path d="M6 8l2-4h8l2 4" />
                        <circle cx="7" cy="18" r="2" />
                        <circle cx="17" cy="18" r="2" />
                      </svg>
                    )
                  },
                  {
                    label: 'Violations',
                    route: ROUTES.violations,
                    className: 'quick-link-violations',
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )
                  },
                  {
                    label: 'Reports',
                    route: ROUTES.reports,
                    className: 'quick-link-reports',
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                      </svg>
                    )
                  },
                ].map(({ label, route, className, icon }) => (
                  <button
                    key={route}
                    onClick={() => navigate(route)}
                    className={`quick-link-card ${className} text-ink`}
                  >
                    <div className="quick-icon-bg">
                      {icon}
                    </div>
                    <span className="text-sm font-semibold tracking-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="glass-card flex flex-col">
                <div className="px-5 py-4 glass-card-header flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Expired Licenses</h2>
                  <span className="text-xs font-medium text-danger-600 bg-danger-50 ring-1 ring-danger-200 px-2 py-0.5 rounded">
                    {expiredLicenseDrivers.length}
                  </span>
                </div>
                {expiredLicenseDrivers.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-ink-faint">No expired licenses.</p>
                ) : (
                  <ul className="divide-y divide-white/40">
                    {expiredLicenseDrivers.map((driver) => (
                      <li key={driver.license_number} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <Link to={buildRoute.driverProfile(driver.license_number)} className="text-sm font-medium text-brand-600 hover:underline truncate">
                            {getFullName(driver)}
                          </Link>
                          <span className="text-xs text-ink-muted font-mono">{driver.license_number}</span>
                        </div>
                        <span className="text-xs text-danger-600 shrink-0">
                          Exp. {formatDate(driver.license_expiry_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="px-5 py-3 glass-card-footer mt-auto">
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.drivers)}>View all drivers →</Button>
                </div>
              </div>

              <div className="glass-card flex flex-col">
                <div className="px-5 py-4 glass-card-header flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Expired Registrations</h2>
                  <span className="text-xs font-medium text-danger-600 bg-danger-50 ring-1 ring-danger-200 px-2 py-0.5 rounded">
                    {expiredRegistrationVehicles.length}
                  </span>
                </div>
                {expiredRegistrationVehicles.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-ink-faint">No expired registrations.</p>
                ) : (
                  <ul className="divide-y divide-white/40">
                    {expiredRegistrationVehicles.map((v) => (
                      <li key={v.plate_number} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <Link to={buildRoute.vehicleDetail(v.plate_number)} className="text-sm font-medium text-brand-600 hover:underline truncate">
                            {v.make} {v.model}
                          </Link>
                          <span className="text-xs text-ink-muted font-mono">{v.plate_number}</span>
                        </div>
                        <span className="text-xs text-danger-600 shrink-0">
                          Exp. {formatDate(v.expiration_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="px-5 py-3 glass-card-footer mt-auto">
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.vehicles)}>View all vehicles →</Button>
                </div>
              </div>

              <div className="glass-card flex flex-col">
                <div className="px-5 py-4 glass-card-header flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Approaching Suspension</h2>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded">
                    {approachingSuspensionDrivers.length}
                  </span>
                </div>
                {approachingSuspensionDrivers.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-ink-faint">No drivers approaching suspension.</p>
                ) : (
                  <ul className="divide-y divide-white/40">
                    {approachingSuspensionDrivers.map((d) => (
                      <li key={d.license_number} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <Link to={buildRoute.driverProfile(d.license_number)} className="text-sm font-medium text-brand-600 hover:underline truncate">
                            {d.full_name}
                          </Link>
                          <span className="text-xs text-ink-muted font-mono">{d.license_number}</span>
                        </div>
                        <span className="text-xs text-amber-700 shrink-0">{d.pending_count} pending</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="px-5 py-3 glass-card-footer mt-auto">
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.violations)}>View all violations →</Button>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </Layout>
  );
}