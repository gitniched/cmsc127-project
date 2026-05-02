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
import { mockVehicles } from '../mock/vehicles';
import { mockDrivers } from '../mock/drivers';
import { mockRegistrations } from '../mock/registrations';
import { mockViolations } from '../mock/violations';
import type { VehicleWithOwner, CreateVehicleDTO } from '../types/vehicle';
import type { CreateRegistrationDTO } from '../types/registration';
import type { VehicleRegistration } from '../types/registration';
import { getFullName } from '../types/driver';
import { buildRoute, ROUTES } from '../constants/routes';

export default function VehicleDetail() {
  const { plateNumber } = useParams<{ plateNumber: string }>();
  const navigate        = useNavigate();

  const [vehicles, setVehicles]           = useState(mockVehicles);
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>(mockRegistrations);
  const [editOpen, setEditOpen]           = useState(false);
  const [regFormOpen, setRegFormOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]       = useState(false);

  const vehicle = vehicles.find((v) => v.plate_number === plateNumber);

  if (!vehicle) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-ink-muted">Vehicle not found.</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.vehicles)}>
            ← Back to Vehicles
          </Button>
        </div>
      </Layout>
    );
  }

  const vehicleRegistrations = registrations
    .filter((r) => r.plate_number === vehicle.plate_number)
    .sort((a, b) => b.registration_date.localeCompare(a.registration_date));

  const vehicleViolations = mockViolations.filter(
    (v) => v.plate_number === vehicle.plate_number
  );

  const owner = mockDrivers.find((d) => d.license_number === vehicle.owner_license_number);

  function handleEditSubmit(data: CreateVehicleDTO) {
    const driver = mockDrivers.find((d) => d.license_number === data.owner_license_number);
    setVehicles((prev) =>
      prev.map((v) =>
        v.plate_number === data.plate_number
          ? { ...v, ...data, owner_name: driver ? getFullName(driver) : data.owner_license_number }
          : v
      )
    );
    setEditOpen(false);
  }

  function handleAddRegistration(data: CreateRegistrationDTO) {
    const newReg: VehicleRegistration = {
      ...data,
      expiration_date: '',
    };
    setRegistrations((prev) => [newReg, ...prev]);
    setRegFormOpen(false);
  }

  function handleDelete() {
    setVehicles((prev) => prev.filter((v) => v.plate_number !== vehicle!.plate_number));
    navigate(ROUTES.vehicles);
  }

  const vehicleAsWithOwner: VehicleWithOwner = {
    ...vehicle,
    owner_name: vehicle.owner_name ?? (owner ? getFullName(owner) : vehicle.owner_license_number),
  };

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
              <h1 className="text-2xl font-bold text-ink tracking-tight">
                {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-ink-muted bg-surface-inset border border-border px-2 py-0.5 rounded">
                  {vehicle.plate_number}
                </span>
                <Badge status={vehicle.vehicle_type} />
                <span className="text-xs text-ink-muted">{vehicle.year}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setEditOpen(true)}>Edit Vehicle</Button>
              <Button variant="primary" onClick={() => setRegFormOpen(true)}>Add Registration</Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete Vehicle</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Engine Number</p>
              <p className="text-sm font-mono text-ink">{vehicle.engine_number}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Chassis Number</p>
              <p className="text-sm font-mono text-ink">{vehicle.chassis_number}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Color</p>
              <p className="text-sm text-ink">{vehicle.color}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Owner</p>
              {owner ? (
                <Link
                  to={buildRoute.driverProfile(owner.license_number)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {getFullName(owner)}
                </Link>
              ) : (
                <p className="text-sm font-mono text-ink">{vehicle.owner_license_number}</p>
              )}
            </div>
          </div>
        </div>

        <RegistrationTable
          registrations={vehicleRegistrations}
          onAdd={() => setRegFormOpen(true)}
        />

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Violations</h2>
          <ViolationTable
            violations={vehicleViolations}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>

      </div>

      <VehicleForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initial={vehicleAsWithOwner}
        drivers={mockDrivers}
      />

      <RegistrationForm
        open={regFormOpen}
        onClose={() => setRegFormOpen(false)}
        onSubmit={handleAddRegistration}
        plateNumber={vehicle.plate_number}
      />

      <Modal
        open={deleteOpen}
        title="Delete Vehicle"
        onClose={() => setDeleteOpen(false)}
        size="sm"
      >
        <div className="flex flex-col gap-6">
          <p className="text-sm text-ink">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{vehicle.make} {vehicle.model}</span>{' '}
            <span className="font-mono text-xs text-ink-muted">({vehicle.plate_number})</span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

    </Layout>
  );
}