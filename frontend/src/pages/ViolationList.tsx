import { useState } from 'react';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ViolationTable from '../components/violations/ViolationTable';
import ViolationForm from '../components/violations/ViolationForm';
import { mockViolations as initialViolations } from '../mock/violations';
import { mockDrivers } from '../mock/drivers';
import type { TrafficViolationFull, CreateViolationDTO } from '../types/violation';
import { buildViolationLineItems, getTotalFineFromLineItems } from '../types/violation';
import { getFullName } from '../types/driver';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; violation: TrafficViolationFull }
  | { mode: 'delete'; violation: TrafficViolationFull };

export default function ViolationList() {
  const [violations, setViolations] = useState<TrafficViolationFull[]>(initialViolations);
  const [modal, setModal]           = useState<ModalState>({ mode: 'closed' });

  function handleEdit(violation: TrafficViolationFull) {
    setModal({ mode: 'edit', violation });
  }

  function handleDelete(uovr_number: string) {
    const violation = violations.find((v) => v.uovr_number === uovr_number);
    if (violation) setModal({ mode: 'delete', violation });
  }

  function handleAddSubmit(data: CreateViolationDTO) {
    const lineItems = buildViolationLineItems(data.violation_types);
    const newViolation: TrafficViolationFull = {
      uovr_number:               data.uovr_number,
      officer:                   data.officer ?? null,
      violation_status:          data.violation_status,
      violation_location_city:   data.violation_location_city,
      violation_location_region: data.violation_location_region,
      violation_date:            data.violation_date,
      payment_status:            data.payment_status,
      license_number:            data.license_number,
      plate_number:              data.plate_number,
      registration_number:       data.registration_number ?? null,
      driver_name:               (() => {
        const d = mockDrivers.find((dr) => dr.license_number === data.license_number);
        return d ? getFullName(d) : data.license_number;
      })(),
      violation_types:           lineItems,
      total_fine:                getTotalFineFromLineItems(lineItems),
    };
    setViolations((prev) => [newViolation, ...prev]);
    setModal({ mode: 'closed' });
  }

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
    if (modal.mode !== 'delete') return;
    setViolations((prev) => prev.filter((v) => v.uovr_number !== modal.violation.uovr_number));
    setModal({ mode: 'closed' });
  }

  function closeModal() {
    setModal({ mode: 'closed' });
  }

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Violations</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all recorded traffic violations and their payment statuses.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModal({ mode: 'add' })}>
            Add Violation
          </Button>
        </div>

        <ViolationTable
          violations={violations}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Modal
          open={modal.mode === 'add'}
          title="Add Violation"
          onClose={closeModal}
          size="xl"
        >
          <ViolationForm
            onSubmit={handleAddSubmit}
            onCancel={closeModal}
          />
        </Modal>

        <Modal
          open={modal.mode === 'edit'}
          title="Edit Violation"
          onClose={closeModal}
          size="xl"
        >
          {modal.mode === 'edit' && (
            <ViolationForm
              violation={modal.violation}
              onSubmit={handleEditSubmit}
              onCancel={closeModal}
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
                <span className="font-mono text-xs font-semibold text-ink">
                  {modal.violation.uovr_number}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmDelete}>Delete</Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </Layout>
  );
}