import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ViolationForm from '../components/violations/ViolationForm';
import { mockViolations } from '../mock/violations';
import { mockDrivers } from '../mock/drivers';
import { mockVehicles } from '../mock/vehicles';
import { mockRegistrations } from '../mock/registrations';
import type { TrafficViolationFull, CreateViolationDTO } from '../types/violation';
import { buildViolationLineItems, getTotalFineFromLineItems } from '../types/violation';
import { getFullName } from '../types/driver';
import { buildRoute, ROUTES } from '../constants/routes';

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'edit' }
  | { mode: 'delete' };

export default function ViolationDetail() {
  const { uovrNumber } = useParams<{ uovrNumber: string }>();
  const navigate       = useNavigate();

  const [violations, setViolations] = useState<TrafficViolationFull[]>(mockViolations);
  const [modal, setModal]           = useState<ModalState>({ mode: 'closed' });

  const violation = violations.find((v) => v.uovr_number === uovrNumber);
  const currentUovr = violation?.uovr_number ?? '';

  if (!violation) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-ink-muted">Violation not found.</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.violations)}>
            ← Back to Violations
          </Button>
        </div>
      </Layout>
    );
  }

  const driver       = mockDrivers.find((d) => d.license_number === violation.license_number);
  const vehicle      = mockVehicles.find((v) => v.plate_number === violation.plate_number);
  const registration = violation.registration_number
    ? mockRegistrations.find((r) => r.registration_number === violation.registration_number)
    : null;

  function handleEditSubmit(data: CreateViolationDTO) {
    const lineItems = buildViolationLineItems(data.violation_types);
    setViolations((prev) =>
      prev.map((v) =>
        v.uovr_number === data.uovr_number
          ? {
              ...v,
              officer:                   data.officer ?? null,
              violation_status:          data.violation_status,
              violation_location_city:   data.violation_location_city,
              violation_location_region: data.violation_location_region,
              violation_date:            data.violation_date,
              payment_status:            data.payment_status,
              license_number:            data.license_number,
              plate_number:              data.plate_number,
              registration_number:       data.registration_number ?? null,
              violation_types:           lineItems,
              total_fine:                getTotalFineFromLineItems(lineItems),
            }
          : v
      )
    );
    setModal({ mode: 'closed' });
  }

  function handleConfirmDelete() {
    setViolations((prev) => prev.filter((v) => v.uovr_number !== currentUovr));
    navigate(ROUTES.violations);
  }

  function closeModal() {
    setModal({ mode: 'closed' });
  }

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to={ROUTES.violations} className="hover:text-ink transition-colors">Violations</Link>
          <span>/</span>
          <span className="text-ink font-mono">{violation.uovr_number}</span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-6">

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight font-mono">
                {violation.uovr_number}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge status={violation.violation_status} />
                <Badge status={violation.payment_status} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setModal({ mode: 'edit' })}>
                Edit Violation
              </Button>
              <Button variant="danger" onClick={() => setModal({ mode: 'delete' })}>
                Delete
              </Button>
            </div>
          </div>

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
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-ink">Violation Types</h2>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border bg-surface-inset">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Violation Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wide w-36">
                    Base Fine
                  </th>
                </tr>
              </thead>
              <tbody>
                {violation.violation_types.map((vt) => (
                  <tr key={vt.violation_type} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm text-ink">{vt.violation_type}</td>
                    <td className="px-4 py-3 text-sm text-right text-ink">
                      ₱{vt.base_fine.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-inset border-t border-border">
                  <td className="px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Total Fine
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                    ₱{violation.total_fine.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-ink">Linked Records</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Driver</p>
              {driver ? (
                <Link
                  to={buildRoute.driverProfile(driver.license_number)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {getFullName(driver)}
                </Link>
              ) : (
                <p className="text-sm font-mono text-ink">{violation.license_number}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Vehicle</p>
              {vehicle ? (
                <Link
                  to={buildRoute.vehicleDetail(vehicle.plate_number)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  <span className="font-mono text-xs">{vehicle.plate_number}</span>
                  {' '}— {vehicle.make} {vehicle.model}
                </Link>
              ) : (
                <p className="text-sm font-mono text-ink">{violation.plate_number}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Registration</p>
              {registration ? (
                <p className="text-sm font-mono text-ink">{registration.registration_number}</p>
              ) : (
                <p className="text-sm text-ink-faint">—</p>
              )}
            </div>
          </div>
        </div>

        <Modal
          open={modal.mode === 'edit'}
          title="Edit Violation"
          onClose={closeModal}
          size="xl"
        >
          <ViolationForm
            violation={violation}
            onSubmit={handleEditSubmit}
            onCancel={closeModal}
          />
        </Modal>

        <Modal
          open={modal.mode === 'delete'}
          title="Delete Violation"
          onClose={closeModal}
          size="sm"
        >
          <div className="flex flex-col gap-6">
            <p className="text-sm text-ink">
              Are you sure you want to delete violation{' '}
              <span className="font-mono text-xs font-semibold text-ink">
                {violation.uovr_number}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete}>Delete</Button>
            </div>
          </div>
        </Modal>

      </div>
    </Layout>
  );
}