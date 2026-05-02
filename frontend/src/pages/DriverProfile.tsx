import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DriverForm from '../components/drivers/DriverForm';
import RenewLicenseModal from '../components/drivers/RenewLicenseModal';
import type { ColumnDef } from '../components/ui/Table';
import Table from '../components/ui/Table';
import { mockDrivers } from '../mock/drivers';
import { mockVehicles } from '../mock/vehicles';
import { mockViolations } from '../mock/violations';
import type { CreateDriverDTO } from '../types/driver';
import { getFullName } from '../types/driver';
import type { VehicleWithOwner } from '../types/vehicle';
import type { TrafficViolationFull } from '../types/violation';
import { isCountedAsUnpaid } from '../types/violation';
import { LicenseStatus } from '../constants/enums';
import { buildRoute, ROUTES } from '../constants/routes';

function computeAge(birthDate: string): number {
  const today = new Date();
  const dob   = new Date(birthDate);
  let age     = today.getFullYear() - dob.getFullYear();
  const m     = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

export default function DriverProfile() {
  const { licenseNumber } = useParams<{ licenseNumber: string }>();
  const navigate          = useNavigate();

  const [drivers, setDrivers]   = useState(mockDrivers);
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const driver = drivers.find((d) => d.license_number === licenseNumber);

  if (!driver) {
    return (
      <Layout>
        <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-4">
          <p className="text-sm text-ink-muted">Driver not found.</p>
          <Button variant="ghost" onClick={() => navigate(ROUTES.drivers)}>
            ← Back to Drivers
          </Button>
        </div>
      </Layout>
    );
  }

  const driverLicenseNumber = driver.license_number;

  const ownedVehicles = mockVehicles.filter((v) => v.owner_license_number === driverLicenseNumber);
  const violations    = mockViolations.filter((v) => v.license_number === driverLicenseNumber);
  const unpaidCount   = violations.filter(isCountedAsUnpaid).length;
  const days          = daysUntilExpiry(driver.license_expiry_date);

  function handleEditSubmit(data: CreateDriverDTO) {
    setDrivers((prev) =>
      prev.map((d) =>
        d.license_number === data.license_number
          ? { ...d, ...data, age: computeAge(data.birth_date) }
          : d
      )
    );
    setEditOpen(false);
  }

  function handleRenewed(newExpiry: string) {
    setDrivers((prev) =>
      prev.map((d) =>
        d.license_number === driverLicenseNumber
          ? { ...d, license_status: LicenseStatus.Active, license_expiry_date: newExpiry }
          : d
      )
    );
  }

  const vehicleColumns: ColumnDef<VehicleWithOwner>[] = [
    {
      key:    'plate_number',
      header: 'Plate Number',
      render: (v) => (
        <Link
          to={buildRoute.vehicleDetail(v.plate_number)}
          className="font-mono text-xs text-brand-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {v.plate_number}
        </Link>
      ),
    },
    {
      key:    'make_model',
      header: 'Make / Model',
      render: (v) => `${v.make} ${v.model}`,
    },
    {
      key:    'year',
      header: 'Year',
      render: (v) => v.year,
    },
    {
      key:    'vehicle_type',
      header: 'Type',
      render: (v) => <Badge status={v.vehicle_type} />,
    },
  ];

  const violationColumns: ColumnDef<TrafficViolationFull>[] = [
    {
      key:    'uovr_number',
      header: 'UOVR Number',
      render: (v) => (
        <Link
          to={buildRoute.violationDetail(v.uovr_number)}
          className="font-mono text-xs text-brand-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {v.uovr_number}
        </Link>
      ),
    },
    {
      key:    'violation_date',
      header: 'Date',
      render: (v) => formatDate(v.violation_date),
    },
    {
      key:    'violation_location_city',
      header: 'Location',
      render: (v) => `${v.violation_location_city}, ${v.violation_location_region}`,
    },
    {
      key:    'violation_types',
      header: 'Violation Types',
      render: (v) => (
        <span className="text-xs text-ink-muted">
          {v.violation_types.map((vt) => vt.violation_type).join(', ')}
        </span>
      ),
    },
    {
      key:    'total_fine',
      header: 'Total Fine',
      render: (v) => `₱${v.total_fine.toLocaleString()}`,
    },
    {
      key:    'violation_status',
      header: 'Status',
      render: (v) => <Badge status={v.violation_status} />,
    },
    {
      key:    'payment_status',
      header: 'Payment',
      render: (v) => <Badge status={v.payment_status} />,
    },
  ];

  return (
    <Layout>
      <div className="pl-20 pr-6 py-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to={ROUTES.drivers} className="hover:text-ink transition-colors">Drivers</Link>
          <span>/</span>
          <span className="text-ink">{getFullName(driver)}</span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-6">

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{getFullName(driver)}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-ink-muted bg-surface-inset border border-border px-2 py-0.5 rounded">
                  {driver.license_number}
                </span>
                <Badge status={driver.license_type} />
                <Badge status={driver.license_status} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setEditOpen(true)}>Edit Driver</Button>
              <Button variant="primary" onClick={() => setRenewOpen(true)}>Renew License</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Date of Birth</p>
              <p className="text-sm text-ink">{formatDate(driver.birth_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Age</p>
              <p className="text-sm text-ink">{driver.age}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Sex</p>
              <p className="text-sm text-ink">{driver.sex === 'M' ? 'Male' : 'Female'}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-ink-muted mb-0.5">Address</p>
              <p className="text-sm text-ink">{driver.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Issue Date</p>
              <p className="text-sm text-ink">{formatDate(driver.license_issue_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Expiry Date</p>
              <p className="text-sm text-ink">{formatDate(driver.license_expiry_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Days Until Expiry</p>
              <p className={[
                'text-sm font-medium',
                days < 0 ? 'text-danger-600' : days < 30 ? 'text-amber-600' : 'text-ink',
              ].join(' ')}>
                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted mb-0.5">Unpaid Violations</p>
              <p className={[
                'text-sm font-medium',
                unpaidCount > 0 ? 'text-danger-600' : 'text-ink',
              ].join(' ')}>
                {unpaidCount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Owned Vehicles</h2>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <Table
              columns={vehicleColumns}
              rows={ownedVehicles}
              rowKey={(v) => v.plate_number}
              onRowClick={(v) => navigate(buildRoute.vehicleDetail(v.plate_number))}
              emptyMessage="No vehicles registered to this driver."
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">Violation History</h2>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <Table
              columns={violationColumns}
              rows={violations}
              rowKey={(v) => v.uovr_number}
              onRowClick={(v) => navigate(buildRoute.violationDetail(v.uovr_number))}
              emptyMessage="No violations on record for this driver."
            />
          </div>
        </div>

      </div>

      <DriverForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initial={driver}
      />

      <RenewLicenseModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        driver={driver}
        onRenewed={handleRenewed}
      />

    </Layout>
  );
}