import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DriverTable from '../components/drivers/DriverTable';
import DriverForm from '../components/drivers/DriverForm';
import { mockDrivers as initialDrivers } from '../mock/drivers';
import type { DriverWithAge, CreateDriverDTO } from '../types/driver';
import { buildRoute } from '../constants/routes';

function computeAge(birthDate: string): number {
  const today = new Date();
  const dob   = new Date(birthDate);
  let age     = today.getFullYear() - dob.getFullYear();
  const m     = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; driver: DriverWithAge }
  | { mode: 'delete'; driver: DriverWithAge };

export default function DriverList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverWithAge[]>(initialDrivers);
  const [modal, setModal]     = useState<ModalState>({ mode: 'closed' });

  function handleView(driver: DriverWithAge) {
    navigate(buildRoute.driverProfile(driver.license_number));
  }

  function handleEdit(driver: DriverWithAge) {
    setModal({ mode: 'edit', driver });
  }

  function handleDelete(driver: DriverWithAge) {
    setModal({ mode: 'delete', driver });
  }

  function handleAddSubmit(data: CreateDriverDTO) {
    const newDriver: DriverWithAge = {
      ...data,
      license_expiry_date: '',
      age: computeAge(data.birth_date),
    };
    setDrivers((prev) => [newDriver, ...prev]);
    setModal({ mode: 'closed' });
  }

  function handleEditSubmit(data: CreateDriverDTO) {
    setDrivers((prev) =>
      prev.map((d) =>
        d.license_number === data.license_number
          ? { ...d, ...data, age: computeAge(data.birth_date) }
          : d
      )
    );
    setModal({ mode: 'closed' });
  }

  function handleConfirmDelete() {
    if (modal.mode !== 'delete') return;
    setDrivers((prev) => prev.filter((d) => d.license_number !== modal.driver.license_number));
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
            <h1 className="text-2xl font-bold text-ink tracking-tight">Drivers</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all registered drivers and their license information.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModal({ mode: 'add' })}>
            Add Driver
          </Button>
        </div>

        <DriverTable
          drivers={drivers}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <DriverForm
          open={modal.mode === 'add'}
          onClose={closeModal}
          onSubmit={handleAddSubmit}
        />

        <DriverForm
          open={modal.mode === 'edit'}
          onClose={closeModal}
          onSubmit={handleEditSubmit}
          initial={modal.mode === 'edit' ? modal.driver : null}
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