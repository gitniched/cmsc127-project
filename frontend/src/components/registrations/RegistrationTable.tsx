import Table from '../ui/Table';
import type { ColumnDef } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import type { VehicleRegistration } from '../../types/registration.types';

interface RegistrationTableProps {
  registrations: VehicleRegistration[];
  onAdd:         () => void;
}

const columns: ColumnDef<VehicleRegistration>[] = [
  {
    key:      'registration_number',
    header:   'Reg. Number',
    sortable: true,
    render:   (r) => <span className="font-mono text-xs">{r.registration_number}</span>,
  },
  {
    key:      'registration_date',
    header:   'Registration Date',
    sortable: true,
    render:   (r) => r.registration_date,
  },
  {
    key:      'expiration_date',
    header:   'Expiry Date',
    sortable: true,
    render:   (r) => r.expiration_date,
  },
  {
    key:      'registration_status',
    header:   'Status',
    sortable: true,
    width:    '110px',
    render:   (r) => <Badge status={r.registration_status} />,
  },
];

export default function RegistrationTable({ registrations, onAdd }: RegistrationTableProps) {
  const sorted = [...registrations].sort(
    (a, b) => b.registration_date.localeCompare(a.registration_date),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Registration History</h3>
        <Button variant="primary" size="sm" onClick={onAdd}>
          Add Registration
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table
          columns={columns}
          rows={sorted}
          rowKey={(r) => r.registration_number}
          emptyMessage="No registrations found for this vehicle."
        />
      </div>
    </div>
  );
}