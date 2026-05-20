import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DriverForm from '../components/drivers/DriverForm';
import RenewLicenseModal from '../components/drivers/RenewLicenseModal';
import type { ColumnDef } from '../components/ui/Table';
import Table from '../components/ui/Table';
import { useDriver } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { useViolations } from '../hooks/useViolations';
import type { CreateDriverDTO } from '@shared/types/driver.types';
import { getFullName } from '@shared/types/driver.types';
import type { VehicleWithOwner } from '@shared/types/vehicle.types';
import type { TrafficViolationFull } from '@shared/types/violation.types';
import { isCountedAsUnpaid } from '@shared/types/violation.types';
import { buildRoute, ROUTES } from '../constants/routes';

function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DriverProfile() {
  const { licenseNumber } = useParams<{ licenseNumber: string }>();
  const navigate = useNavigate();

  const { driver, loading, error, refetch, edit } = useDriver(licenseNumber);

  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles(
    licenseNumber ? { owner_license_number: licenseNumber } : undefined
  );
  const { violations, loading: violationsLoading, error: violationsError } = useViolations(
    licenseNumber ? { license_number: licenseNumber } : undefined
  );

  const [editOpen, setEditOpen]   = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) {
    return (
      <Layout>
        <div className="px-6 py-8 max-w-screen-xl mx-auto w-full flex items-center gap-2 text-sm text-ink-muted">
          <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading driver…
        </div>
      </Layout>
    );
  }

  if (error || !driver) {
    return (
      <Layout>
        <div className="px-6 py-8 max-w-screen-xl mx-auto w-full flex flex-col gap-4">
          <p className="text-sm text-danger-600">{error ?? 'Driver not found.'}</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
        </div>
      </Layout>
    );
  }

  const unpaidCount = violations.filter(isCountedAsUnpaid).length;
  const days        = daysUntilExpiry(driver.license_expiry_date);

  async function handleEditSubmit(data: CreateDriverDTO) {
    setSaving(true);
    setSaveError(null);
    try {
      await edit(data);
      setEditOpen(false);
      refetch();
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update driver');
    } finally {
      setSaving(false);
    }
  }

  const vehicleColumns: ColumnDef<VehicleWithOwner>[] = [
    {
      key:    'plate_number',
      header: 'Plate Number',
      render: (v) => (
        <Link to={buildRoute.vehicleDetail(v.plate_number)} className="font-mono text-xs text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
          {v.plate_number}
        </Link>
      ),
    },
    { key: 'make_model',    header: 'Make / Model', render: (v) => `${v.make} ${v.model}` },
    { key: 'year',          header: 'Year',         render: (v) => v.year },
    { key: 'vehicle_type',  header: 'Type',         render: (v) => <Badge status={v.vehicle_type} /> },
  ];

  const violationColumns: ColumnDef<TrafficViolationFull>[] = [
    {
      key:    'uovr_number',
      header: 'UOVR Number',
      render: (v) => (
        <Link to={buildRoute.violationDetail(v.uovr_number)} className="font-mono text-xs text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
          {v.uovr_number}
        </Link>
      ),
    },
    { key: 'violation_date',          header: 'Date',            render: (v) => formatDate(v.violation_date) },
    { key: 'violation_location_city', header: 'Location',        render: (v) => `${v.violation_location_city}, ${v.violation_location_region}` },
    { key: 'violation_types',         header: 'Violation Types', render: (v) => <span className="text-xs text-ink-muted">{v.violation_types.map((vt) => vt.violation_type).join(', ')}</span> },
    { key: 'total_fine',              header: 'Total Fine',      render: (v) => `₱${v.total_fine.toLocaleString()}` },
    { key: 'violation_status',        header: 'Status',          render: (v) => <Badge status={v.violation_status} /> },
    { key: 'payment_status',          header: 'Payment',         render: (v) => <Badge status={v.payment_status} /> },
  ];

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
        .glass-divider {
          border-top: 1px solid rgba(226, 232, 240, 0.7);
        }
      `}</style>
      <div className="px-6 py-8 max-w-screen-xl mx-auto w-full flex flex-col gap-6">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-ink-muted">
            <Link to={ROUTES.drivers} className="hover:text-ink transition-colors">Drivers</Link>
            <span>/</span>
            <span className="text-ink">{getFullName(driver)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="!text-black hover:!text-brand-700 !border-brand-300/80 font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            ← Back
          </Button>
        </div>

        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{getFullName(driver)}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-ink-muted bg-white/40 border border-white/60 px-2 py-0.5 rounded">{driver.license_number}</span>
                <Badge status={driver.license_type} />
                <Badge status={driver.license_status} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => { setSaveError(null); setEditOpen(true); }}>Edit Driver</Button>
              <Button variant="primary" onClick={() => setRenewOpen(true)}>Renew License</Button>
            </div>
          </div>

          {saveError && (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 glass-divider pt-5">
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Date of Birth</p><p className="text-sm text-ink">{formatDate(driver.birth_date)}</p></div>
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Age</p><p className="text-sm text-ink">{driver.age}</p></div>
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Sex</p><p className="text-sm text-ink">{driver.sex === 'M' ? 'Male' : 'Female'}</p></div>
            <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-medium text-ink-muted mb-0.5">Address</p><p className="text-sm text-ink">{driver.address}</p></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 glass-divider pt-5">
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Issue Date</p><p className="text-sm text-ink">{formatDate(driver.license_issue_date)}</p></div>
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Expiry Date</p><p className="text-sm text-ink">{formatDate(driver.license_expiry_date)}</p></div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Days Until Expiry</p>
              <p className={['text-sm font-medium', days < 0 ? 'text-danger-600' : days < 30 ? 'text-amber-600' : 'text-ink'].join(' ')}>
                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Unpaid Violations</p>
              <p className={['text-sm font-medium', unpaidCount > 0 ? 'text-danger-600' : 'text-ink'].join(' ')}>{unpaidCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="glass-card px-4 py-2 self-start">
            <h2 className="text-base font-semibold text-ink">Owned Vehicles</h2>
          </div>
          {vehiclesLoading ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted py-2">
              <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading vehicles…
            </div>
          ) : vehiclesError ? (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {vehiclesError}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <Table
                columns={vehicleColumns}
                rows={vehicles}
                rowKey={(v) => v.plate_number}
                onRowClick={(v) => navigate(buildRoute.vehicleDetail(v.plate_number))}
                emptyMessage="No vehicles registered to this driver."
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="glass-card px-4 py-2 self-start">
            <h2 className="text-base font-semibold text-ink">Violation History</h2>
          </div>
          {violationsLoading ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted py-2">
              <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading violations…
            </div>
          ) : violationsError ? (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {violationsError}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <Table
                columns={violationColumns}
                rows={violations}
                rowKey={(v) => v.uovr_number}
                onRowClick={(v) => navigate(buildRoute.violationDetail(v.uovr_number))}
                emptyMessage="No violations on record for this driver."
              />
            </div>
          )}
        </div>

      </div>

      <DriverForm
        open={editOpen}
        onClose={() => { setEditOpen(false); setSaveError(null); }}
        onSubmit={handleEditSubmit}
        initial={driver}
        saveError={saveError}
        saving={saving}
      />

      <RenewLicenseModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        driver={driver}
        onRenewed={() => refetch()}
      />

    </Layout>
  );
}