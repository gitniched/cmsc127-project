import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ViolationForm from '../components/violations/ViolationForm';
import AutoSuspensionBanner from '../components/violations/AutoSuspensionBanner';
import { useViolation } from '../hooks/useViolations';
import { getDriverByLicense } from '../api/driver.api';
import type { CreateViolationDTO, UpdateViolationDTO, ViolationTypeLineItem } from '../types/violation.types';
import { LicenseStatus } from '../constants/enums';
import { buildRoute, ROUTES } from '../constants/routes';

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

export default function ViolationDetail() {
  const { uovrNumber } = useParams<{ uovrNumber: string }>();
  const navigate       = useNavigate();

  const { violation, loading, error, refetch, edit: editViolation, remove: removeViolation } =
    useViolation(uovrNumber);

  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [suspended,  setSuspended]  = useState(false);

  if (loading) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex items-center gap-2 text-sm text-ink-muted">
          <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading violation…
        </div>
      </Layout>
    );
  }

  if (error || !violation) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-danger-600">{error ?? 'Violation not found.'}</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.violations)}>← Back to Violations</Button>
        </div>
      </Layout>
    );
  }

  async function handleEditSubmit(data: CreateViolationDTO) {
    setSaving(true);
    setSaveError(null);
    try {
      const update: UpdateViolationDTO = {
        violation_status: data.violation_status,
        payment_status:   data.payment_status,
      };

      const driverBefore = await getDriverByLicense(violation.license_number).catch(() => null);
      const statusBefore = driverBefore?.license_status;

      await editViolation(update);

      const driverAfter = await getDriverByLicense(violation.license_number).catch(() => null);
      if (
        statusBefore !== LicenseStatus.Suspended &&
        driverAfter?.license_status === LicenseStatus.Suspended
      ) {
        setSuspended(true);
      }

      setEditOpen(false);
      await refetch();
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update violation');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setSaveError(null);
    try {
      await removeViolation();
      navigate(ROUTES.violations);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete violation');
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to={ROUTES.violations} className="hover:text-ink transition-colors">Violations</Link>
          <span>/</span>
          <span className="text-ink font-mono">{violation.uovr_number}</span>
        </div>

        {suspended && (
          <AutoSuspensionBanner
            licenseNumber={violation.license_number}
            driverName={violation.driver_name}
          />
        )}

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight font-mono">{violation.uovr_number}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge status={violation.violation_status} />
                <Badge status={violation.payment_status} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => { setSaveError(null); setEditOpen(true); }}>
                Edit Status / Payment
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete</Button>
            </div>
          </div>

          {saveError && (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Date</p>
              <p className="text-sm text-ink">{formatDate(violation.violation_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">City</p>
              <p className="text-sm text-ink">{violation.violation_location_city}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Region</p>
              <p className="text-sm text-ink">{violation.violation_location_region}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Officer</p>
              <p className="text-sm text-ink">{violation.officer ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Driver</p>
              <Link
                to={buildRoute.driverProfile(violation.license_number)}
                className="text-sm text-brand-600 hover:underline"
              >
                {violation.driver_name}
              </Link>
              <p className="text-xs text-ink-muted font-mono mt-0.5">{violation.license_number}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Vehicle</p>
              <Link
                to={buildRoute.vehicleDetail(violation.plate_number)}
                className="text-sm text-brand-600 hover:underline font-mono"
              >
                {violation.plate_number}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Registration</p>
              {violation.registration_number ? (
                <p className="text-sm font-mono text-ink">{violation.registration_number}</p>
              ) : (
                <p className="text-sm text-ink-muted">—</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">Violation Types</h2>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-surface-inset">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Type
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-ink-muted uppercase tracking-wide w-36">
                  Base Fine
                </th>
              </tr>
            </thead>
            <tbody>
              {violation.violation_types.map((vt: ViolationTypeLineItem) => (
                <tr key={vt.violation_type} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm text-ink">{vt.violation_type}</td>
                  <td className="px-5 py-3 text-right text-sm text-ink">
                    ₱{vt.base_fine.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-inset border-t border-border">
                <td className="px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Total Fine
                </td>
                <td className="px-5 py-3 text-right text-sm font-semibold text-ink">
                  ₱{violation.total_fine.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      <Modal
        open={editOpen}
        onClose={() => { setSaveError(null); setEditOpen(false); }}
        title="Edit Violation"
        size="xl"
      >
        <ViolationForm
          violation={violation}
          onSubmit={handleEditSubmit}
          onCancel={() => { setSaveError(null); setEditOpen(false); }}
          saving={saving}
          saveError={saveError}
        />
      </Modal>

      <Modal open={deleteOpen} title="Delete Violation" onClose={() => setDeleteOpen(false)} size="sm">
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink">
            Are you sure you want to delete violation{' '}
            <span className="font-mono font-semibold">{violation.uovr_number}</span>
            ? This action cannot be undone.
          </p>
          {saveError && (
            <p className="text-sm text-danger-600">{saveError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

    </Layout>
  );
}