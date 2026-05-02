import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ViolationTable from '../components/violations/ViolationTable';
import ViolationForm from '../components/violations/ViolationForm';
import { useViolations } from '../hooks/useViolations';
import type { TrafficViolationFull, CreateViolationDTO } from '../types/violation.types';
import { buildRoute } from '../constants/routes';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; violation: TrafficViolationFull }
  | { mode: 'delete'; uovrNumber: string; label: string };

export default function ViolationList() {
  const navigate = useNavigate();
  const { violations, loading, error, add, edit, remove } = useViolations();
  const [modal, setModal]         = useState<ModalState>({ mode: 'closed' });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleView(violation: TrafficViolationFull) {
    navigate(buildRoute.violationDetail(violation.uovr_number));
  }

  function handleEdit(violation: TrafficViolationFull) {
    setSaveError(null);
    setModal({ mode: 'edit', violation });
  }

  function handleDelete(uovrNumber: string) {
    setSaveError(null);
    const v = violations.find((v) => v.uovr_number === uovrNumber);
    setModal({ mode: 'delete', uovrNumber, label: uovrNumber + (v ? ` (${v.driver_name})` : '') });
  }

  async function handleAddSubmit(data: CreateViolationDTO) {
    setSaving(true);
    setSaveError(null);
    try {
      await add(data);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to add violation');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(data: CreateViolationDTO) {
    if (modal.mode !== 'edit') return;
    setSaving(true);
    setSaveError(null);
    try {
      await edit(modal.violation.uovr_number, {
        violation_status: data.violation_status,
        payment_status:   data.payment_status,
      });
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to update violation');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (modal.mode !== 'delete') return;
    setSaving(true);
    setSaveError(null);
    try {
      await remove(modal.uovrNumber);
      setModal({ mode: 'closed' });
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to delete violation');
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

        <div className="glass-card px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Violations</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all traffic violation records and their payment status.
            </p>
          </div>
          <Button variant="primary" onClick={() => { setSaveError(null); setModal({ mode: 'add' }); }}>
            Add Violation
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-4">
            <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading violations…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ViolationTable
            violations={violations}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Modal
          open={modal.mode === 'add'}
          onClose={closeModal}
          title="Add Violation"
          size="xl"
        >
          <ViolationForm
            onSubmit={handleAddSubmit}
            onCancel={closeModal}
            saving={saving}
            saveError={saveError}
          />
        </Modal>

        <Modal
          open={modal.mode === 'edit'}
          onClose={closeModal}
          title="Edit Violation"
          size="xl"
        >
          {modal.mode === 'edit' && (
            <ViolationForm
              violation={modal.violation}
              onSubmit={handleEditSubmit}
              onCancel={closeModal}
              saving={saving}
              saveError={saveError}
            />
          )}
        </Modal>

        <Modal
          open={modal.mode === 'delete'}
          title="Delete Violation"
          onClose={closeModal}
          size="sm"
        >
          {modal.mode === 'delete' && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-ink">
                Are you sure you want to delete violation{' '}
                <span className="font-mono font-semibold">{modal.label}</span>
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