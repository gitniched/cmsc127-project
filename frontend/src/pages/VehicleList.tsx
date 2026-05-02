import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import VehicleTable from '../components/vehicles/VehicleTable';
import VehicleForm from '../components/vehicles/VehicleForm';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import type { VehicleWithOwner, CreateVehicleDTO } from '../types/vehicle.types';
import { buildRoute } from '../constants/routes';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; vehicle: VehicleWithOwner }
  | { mode: 'delete'; vehicle: VehicleWithOwner };

export default function VehicleList() {
  const navigate = useNavigate();
  const { vehicles, loading, error, add, edit, remove } = useVehicles();
  const { drivers } = useDrivers();
  const [modal, setModal]         = useState<ModalState>({ mode: 'closed' });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleView(vehicle: VehicleWithOwner) {
    navigate(buildRoute.vehicleDetail(vehicle.plate_number));
  }

  function handleEdit(vehicle: VehicleWithOwner) {
    setSaveError(null);
    setModal({ mode: 'edit', vehicle });
  }

  function handleDelete(vehicle: VehicleWithOwner) {
    setSaveError(null);
    setModal({ mode: 'delete', vehicle });
  }

  async function handleAddSubmit(data: CreateVehicleDTO) {
    setSaving(true);
    setSaveError(null);
    try {
      await add(data);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(data: CreateVehicleDTO) {
    if (modal.mode !== 'edit') return;
    setSaving(true);
    setSaveError(null);
    try {
      await edit(data.plate_number, data);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (modal.mode !== 'delete') return;
    setSaving(true);
    setSaveError(null);
    try {
      await remove(modal.vehicle.plate_number);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete vehicle');
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setModal({ mode: 'closed' });
    setSaveError(null);
  }

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Vehicles</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all registered vehicles and their ownership information.
            </p>
          </div>
          <Button variant="primary" onClick={() => { setSaveError(null); setModal({ mode: 'add' }); }}>
            Add Vehicle
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
            <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading vehicles…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <VehicleTable
            vehicles={vehicles}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <VehicleForm
          open={modal.mode === 'add'}
          onClose={closeModal}
          onSubmit={handleAddSubmit}
          drivers={drivers}
          saveError={saveError}
          saving={saving}
        />

        <VehicleForm
          open={modal.mode === 'edit'}
          onClose={closeModal}
          onSubmit={handleEditSubmit}
          initial={modal.mode === 'edit' ? modal.vehicle : null}
          drivers={drivers}
          saveError={saveError}
          saving={saving}
        />

        <Modal
          open={modal.mode === 'delete'}
          title="Delete Vehicle"
          onClose={closeModal}
          size="sm"
        >
          {modal.mode === 'delete' && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-ink">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {modal.vehicle.make} {modal.vehicle.model}
                </span>{' '}
                <span className="font-mono text-xs text-ink-muted">
                  ({modal.vehicle.plate_number})
                </span>
                ? This action cannot be undone.
              </p>
              {saveError && (
                <p className="text-sm text-danger-600">{saveError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmDelete} disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </Layout>
  );
}