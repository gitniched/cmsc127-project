import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DriverTable from '../components/drivers/DriverTable';
import DriverForm from '../components/drivers/DriverForm';
import { useDrivers } from '../hooks/useDrivers';
import type { DriverWithAge, CreateDriverDTO } from '@shared/types/driver.types';
import { buildRoute } from '../constants/routes';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; driver: DriverWithAge }
  | { mode: 'delete'; driver: DriverWithAge };

export default function DriverList() {
  const navigate = useNavigate();
  const { drivers, loading, error, add, edit, remove } = useDrivers();
  const [modal, setModal]       = useState<ModalState>({ mode: 'closed' });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleView(driver: DriverWithAge) {
    navigate(buildRoute.driverProfile(driver.license_number));
  }

  function handleEdit(driver: DriverWithAge) {
    setSaveError(null);
    setModal({ mode: 'edit', driver });
  }

  function handleDelete(driver: DriverWithAge) {
    setSaveError(null);
    setModal({ mode: 'delete', driver });
  }

  async function handleAddSubmit(data: CreateDriverDTO) {
    setSaving(true);
    setSaveError(null);
    try {
      await add(data);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to add driver');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(data: CreateDriverDTO) {
    if (modal.mode !== 'edit') return;
    setSaving(true);
    setSaveError(null);
    try {
      await edit(data.license_number, data);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update driver');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (modal.mode !== 'delete') return;
    setSaving(true);
    setSaveError(null);
    try {
      await remove(modal.driver.license_number);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete driver');
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
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(16px) saturate(1.6);
          -webkit-backdrop-filter: blur(16px) saturate(1.6);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
          border-radius: 12px;
        }
      `}</style>
      <div className="px-6 py-8 max-w-screen-xl mx-auto w-full flex flex-col gap-6">

        <div className="glass-card px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Drivers</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all registered drivers and their license information.
            </p>
          </div>
          <Button variant="primary" onClick={() => { setSaveError(null); setModal({ mode: 'add' }); }}>
            Add Driver
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
            <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading drivers…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <DriverTable
            drivers={drivers}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <DriverForm
          open={modal.mode === 'add'}
          onClose={closeModal}
          onSubmit={handleAddSubmit}
          saveError={saveError}
          saving={saving}
        />

        <DriverForm
          open={modal.mode === 'edit'}
          onClose={closeModal}
          onSubmit={handleEditSubmit}
          initial={modal.mode === 'edit' ? modal.driver : null}
          saveError={saveError}
          saving={saving}
        />

        <Modal
          open={modal.mode === 'delete'}
          title="Delete Driver"
          onClose={closeModal}
          size="sm"
        >
          {modal.mode === 'delete' && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-ink">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {modal.driver.first_name} {modal.driver.last_name}
                </span>{' '}
                <span className="font-mono text-xs text-ink-muted">
                  ({modal.driver.license_number})
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