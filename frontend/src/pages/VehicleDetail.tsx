import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import VehicleForm from '../components/vehicles/VehicleForm';
import RegistrationTable from '../components/registrations/RegistrationTable';
import RegistrationForm from '../components/registrations/RegistrationForm';
import ViolationTable from '../components/violations/ViolationTable';
import { useVehicle } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { useRegistrations } from '../hooks/useRegistrations';
import { useViolations } from '../hooks/useViolations';
import type { CreateVehicleDTO } from '@shared/types/vehicle.types';
import type { CreateRegistrationDTO } from '@shared/types/registration.types';
import { getFullName } from '@shared/types/driver.types';
import { buildRoute, ROUTES } from '../constants/routes';

export default function VehicleDetail() {
  const { plateNumber } = useParams<{ plateNumber: string }>();
  const navigate        = useNavigate();

  const { vehicle, loading, error, refetch: refetchVehicle, edit: editVehicle, remove: removeVehicle } =
    useVehicle(plateNumber);
  const { drivers }    = useDrivers();
  const { registrations, loading: regsLoading, error: regsError, add: addRegistration } =
    useRegistrations(plateNumber ? { plate_number: plateNumber } : undefined);
  const { violations, loading: violationsLoading, error: violationsError } =
    useViolations(plateNumber ? { plate_number: plateNumber } : undefined);

  const [editOpen, setEditOpen]       = useState(false);
  const [regFormOpen, setRegFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  if (loading) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex items-center gap-2 text-sm text-ink-muted">
          <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading vehicle…
        </div>
      </Layout>
    );
  }

  if (error || !vehicle) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-danger-600">{error ?? 'Vehicle not found.'}</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.vehicles)}>← Back to Vehicles</Button>
        </div>
      </Layout>
    );
  }

  const owner = drivers.find((d) => d.license_number === vehicle.owner_license_number);

  async function handleEditSubmit(data: CreateVehicleDTO) {
    setSaveError(null);
    setSaving(true);
    try {
      await editVehicle(data);
      await refetchVehicle();
      setEditOpen(false);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRegistration(data: CreateRegistrationDTO) {
    setSaveError(null);
    setSaving(true);
    try {
      await addRegistration(data);
      setRegFormOpen(false);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to add registration');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setSaveError(null);
    try {
      await removeVehicle();
      navigate(ROUTES.vehicles);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete vehicle');
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to={ROUTES.vehicles} className="hover:text-ink transition-colors">Vehicles</Link>
          <span>/</span>
          <span className="text-ink font-mono">{vehicle.plate_number}</span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{vehicle.make} {vehicle.model}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-ink-muted bg-surface-inset border border-border px-2 py-0.5 rounded">{vehicle.plate_number}</span>
                <Badge status={vehicle.vehicle_type} />
                <span className="text-xs text-ink-muted">{vehicle.year}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => { setSaveError(null); setEditOpen(true); }}>Edit Vehicle</Button>
              <Button variant="primary" onClick={() => setRegFormOpen(true)}>Add Registration</Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete Vehicle</Button>
            </div>
          </div>

          {saveError && (
            <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Engine Number</p><p className="text-sm font-mono text-ink">{vehicle.engine_number}</p></div>
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Chassis Number</p><p className="text-sm font-mono text-ink">{vehicle.chassis_number}</p></div>
            <div><p className="text-xs font-medium text-ink-muted mb-0.5">Color</p><p className="text-sm text-ink">{vehicle.color}</p></div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Owner</p>
              {owner ? (
                <Link to={buildRoute.driverProfile(owner.license_number)} className="text-sm text-brand-600 hover:underline">
                  {getFullName(owner)}
                </Link>
              ) : (
                <p className="text-sm font-mono text-ink">{vehicle.owner_license_number}</p>
              )}
            </div>
          </div>
        </div>

        {regsLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-2">
            <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading registrations…
          </div>
        ) : regsError ? (
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {regsError}
          </div>
        ) : (
          <RegistrationTable
            registrations={registrations}
            onAdd={() => setRegFormOpen(true)}
          />
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Violations</h2>
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
            <ViolationTable
              violations={violations}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        </div>

      </div>

      <VehicleForm
        open={editOpen}
        onClose={() => { setSaveError(null); setEditOpen(false); }}
        onSubmit={handleEditSubmit}
        initial={vehicle}
        drivers={drivers}
        saveError={saveError}
        saving={saving}
      />

      <RegistrationForm
        open={regFormOpen}
        onClose={() => setRegFormOpen(false)}
        onSubmit={handleAddRegistration}
        plateNumber={vehicle.plate_number}
      />

      <Modal open={deleteOpen} title="Delete Vehicle" onClose={() => setDeleteOpen(false)} size="sm">
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{vehicle.make} {vehicle.model}</span>{' '}
            <span className="font-mono text-xs text-ink-muted">({vehicle.plate_number})</span>
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