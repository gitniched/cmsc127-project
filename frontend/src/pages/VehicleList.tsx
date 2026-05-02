import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import VehicleTable from '../components/vehicles/VehicleTable';
import VehicleForm from '../components/vehicles/VehicleForm';
import { mockVehicles as initialVehicles } from '../mock/vehicles';
import { mockDrivers } from '../mock/drivers';
import type { VehicleWithOwner, CreateVehicleDTO } from '../types/vehicle';
import { buildRoute } from '../constants/routes';
import { getFullName } from '../types/driver';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; vehicle: VehicleWithOwner }
  | { mode: 'delete'; vehicle: VehicleWithOwner };

export default function VehicleList() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>(initialVehicles);
  const [modal, setModal]       = useState<ModalState>({ mode: 'closed' });

  function handleView(vehicle: VehicleWithOwner) {
    navigate(buildRoute.vehicleDetail(vehicle.plate_number));
  }

  function handleEdit(vehicle: VehicleWithOwner) {
    setModal({ mode: 'edit', vehicle });
  }

  function handleDelete(vehicle: VehicleWithOwner) {
    setModal({ mode: 'delete', vehicle });
  }

  function handleAddSubmit(data: CreateVehicleDTO) {
    const driver = mockDrivers.find((d) => d.license_number === data.owner_license_number);
    const newVehicle: VehicleWithOwner = {
      ...data,
      owner_name: driver ? getFullName(driver) : data.owner_license_number,
    };
    setVehicles((prev) => [newVehicle, ...prev]);
    setModal({ mode: 'closed' });
  }

  function handleEditSubmit(data: CreateVehicleDTO) {
    const driver = mockDrivers.find((d) => d.license_number === data.owner_license_number);
    setVehicles((prev) =>
      prev.map((v) =>
        v.plate_number === data.plate_number
          ? { ...v, ...data, owner_name: driver ? getFullName(driver) : data.owner_license_number }
          : v
      )
    );
    setModal({ mode: 'closed' });
  }

  function handleConfirmDelete() {
    if (modal.mode !== 'delete') return;
    setVehicles((prev) => prev.filter((v) => v.plate_number !== modal.vehicle.plate_number));
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
            <h1 className="text-2xl font-bold text-ink tracking-tight">Vehicles</h1>
            <p className="text-sm text-ink-muted mt-1">
              Manage all registered vehicles and their ownership information.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModal({ mode: 'add' })}>
            Add Vehicle
          </Button>
        </div>

        <VehicleTable
          vehicles={vehicles}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <VehicleForm
          open={modal.mode === 'add'}
          onClose={closeModal}
          onSubmit={handleAddSubmit}
          drivers={mockDrivers}
        />

        <VehicleForm
          open={modal.mode === 'edit'}
          onClose={closeModal}
          onSubmit={handleEditSubmit}
          initial={modal.mode === 'edit' ? modal.vehicle : null}
          drivers={mockDrivers}
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