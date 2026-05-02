import { useNavigate } from 'react-router-dom';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import type { ColumnDef } from '../ui/Table';
import type { ReportId } from './ReportRunner';
import type { DriverWithAge } from '@shared/types/driver.types';
import type { VehicleWithOwner } from '@shared/types/vehicle.types';
import type { TrafficViolationFull } from '@shared/types/violation.types';
import { ROUTES } from '../../constants/routes';

export type Report1Row = DriverWithAge;
export type Report2Row = VehicleWithOwner;
export type Report3Row = VehicleWithOwner & { expired_registration_date: string };
export type Report4Row = DriverWithAge;
export type Report5Row = TrafficViolationFull;
export type Report6Row = { violation_type: string; total_count: number; total_fine: number };
export type Report7Row = VehicleWithOwner & { violation_count: number };

export type ReportRow =
  | Report1Row
  | Report2Row
  | Report3Row
  | Report4Row
  | Report5Row
  | Report6Row
  | Report7Row;

interface ReportTableProps {
  reportId:     ReportId;
  rows:         ReportRow[];
  emptyMessage?: string;
}

function exportCSV(rows: ReportRow[], reportId: ReportId) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]) as (keyof ReportRow)[];
  const header = keys.join(',');
  const body = rows.map((row) =>
    keys
      .map((k) => {
        const val = (row as Record<string, unknown>)[k as string];
        if (val === null || val === undefined) return '';
        const str = Array.isArray(val)
          ? val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('; ')
          : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );
  const csv  = [header, ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `report_${reportId}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DriverLink({ licenseNumber, name }: { licenseNumber: string; name: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="text-brand-600 hover:underline text-left"
      onClick={(e) => { e.stopPropagation(); navigate(`${ROUTES.drivers}/${licenseNumber}`); }}
    >
      {name}
    </button>
  );
}

function VehicleLink({ plateNumber }: { plateNumber: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="font-mono text-brand-600 hover:underline text-left"
      onClick={(e) => { e.stopPropagation(); navigate(`${ROUTES.vehicles}/${plateNumber}`); }}
    >
      {plateNumber}
    </button>
  );
}

function ViolationLink({ uovrNumber }: { uovrNumber: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="font-mono text-brand-600 hover:underline text-left"
      onClick={(e) => { e.stopPropagation(); navigate(`${ROUTES.violations}/${uovrNumber}`); }}
    >
      {uovrNumber}
    </button>
  );
}

const REPORT1_COLS: ColumnDef<Report1Row>[] = [
  {
    key: 'license_number', header: 'License No.', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.license_number} name={r.license_number} />,
  },
  {
    key: 'last_name', header: 'Name', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.license_number} name={`${r.last_name}, ${r.first_name}`} />,
  },
  {
    key: 'age', header: 'Age', sortable: true,
    render: (r) => r.age,
  },
  {
    key: 'sex', header: 'Sex', sortable: true,
    render: (r) => r.sex === 'M' ? 'Male' : 'Female',
  },
  {
    key: 'license_type', header: 'Type', sortable: true,
    render: (r) => <Badge status={r.license_type} />,
  },
  {
    key: 'license_status', header: 'Status', sortable: true,
    render: (r) => <Badge status={r.license_status} />,
  },
  {
    key: 'license_expiry_date', header: 'Expiry', sortable: true,
    render: (r) => r.license_expiry_date,
  },
];

const REPORT2_COLS: ColumnDef<Report2Row>[] = [
  {
    key: 'plate_number', header: 'Plate', sortable: true,
    render: (r) => <VehicleLink plateNumber={r.plate_number} />,
  },
  {
    key: 'make', header: 'Make', sortable: true,
    render: (r) => r.make,
  },
  {
    key: 'model', header: 'Model', sortable: true,
    render: (r) => r.model,
  },
  {
    key: 'year', header: 'Year', sortable: true,
    render: (r) => r.year,
  },
  {
    key: 'vehicle_type', header: 'Type', sortable: true,
    render: (r) => r.vehicle_type,
  },
  {
    key: 'color', header: 'Color', sortable: false,
    render: (r) => r.color,
  },
];

const REPORT3_COLS: ColumnDef<Report3Row>[] = [
  {
    key: 'plate_number', header: 'Plate', sortable: true,
    render: (r) => <VehicleLink plateNumber={r.plate_number} />,
  },
  {
    key: 'make', header: 'Make / Model', sortable: true,
    render: (r) => `${r.make} ${r.model}`,
  },
  {
    key: 'year', header: 'Year', sortable: true,
    render: (r) => r.year,
  },
  {
    key: 'owner_name', header: 'Owner', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.owner_license_number} name={r.owner_name} />,
  },
  {
    key: 'expired_registration_date', header: 'Expired On', sortable: true,
    render: (r) => r.expired_registration_date,
  },
];

const REPORT4_COLS: ColumnDef<Report4Row>[] = [
  {
    key: 'license_number', header: 'License No.', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.license_number} name={r.license_number} />,
  },
  {
    key: 'last_name', header: 'Name', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.license_number} name={`${r.last_name}, ${r.first_name}`} />,
  },
  {
    key: 'license_type', header: 'Type', sortable: true,
    render: (r) => <Badge status={r.license_type} />,
  },
  {
    key: 'license_status', header: 'Status', sortable: true,
    render: (r) => <Badge status={r.license_status} />,
  },
  {
    key: 'license_expiry_date', header: 'Expiry', sortable: true,
    render: (r) => r.license_expiry_date,
  },
  {
    key: 'address', header: 'Address', sortable: false,
    render: (r) => r.address,
  },
];

const REPORT5_COLS: ColumnDef<Report5Row>[] = [
  {
    key: 'uovr_number', header: 'UOVR No.', sortable: true,
    render: (r) => <ViolationLink uovrNumber={r.uovr_number} />,
  },
  {
    key: 'violation_date', header: 'Date', sortable: true,
    render: (r) => r.violation_date,
  },
  {
    key: 'violation_location_city', header: 'Location', sortable: true,
    render: (r) => `${r.violation_location_city}, ${r.violation_location_region}`,
  },
  {
    key: 'plate_number', header: 'Plate', sortable: true,
    render: (r) => <VehicleLink plateNumber={r.plate_number} />,
  },
  {
    key: 'violation_types', header: 'Violation Types', sortable: false,
    render: (r) => r.violation_types.map((vt) => vt.violation_type).join(', '),
  },
  {
    key: 'total_fine', header: 'Total Fine', sortable: true,
    render: (r) => `₱${r.total_fine.toLocaleString()}`,
  },
  {
    key: 'violation_status', header: 'Status', sortable: true,
    render: (r) => <Badge status={r.violation_status} />,
  },
  {
    key: 'payment_status', header: 'Payment', sortable: true,
    render: (r) => <Badge status={r.payment_status} />,
  },
];

const REPORT6_COLS: ColumnDef<Report6Row>[] = [
  {
    key: 'violation_type', header: 'Violation Type', sortable: true,
    render: (r) => r.violation_type,
  },
  {
    key: 'total_count', header: 'Count', sortable: true,
    render: (r) => r.total_count,
  },
  {
    key: 'total_fine', header: 'Total Fines', sortable: true,
    render: (r) => `₱${r.total_fine.toLocaleString()}`,
  },
];

const REPORT7_COLS: ColumnDef<Report7Row>[] = [
  {
    key: 'plate_number', header: 'Plate', sortable: true,
    render: (r) => <VehicleLink plateNumber={r.plate_number} />,
  },
  {
    key: 'make', header: 'Make / Model', sortable: true,
    render: (r) => `${r.make} ${r.model}`,
  },
  {
    key: 'year', header: 'Year', sortable: true,
    render: (r) => r.year,
  },
  {
    key: 'vehicle_type', header: 'Type', sortable: true,
    render: (r) => r.vehicle_type,
  },
  {
    key: 'owner_name', header: 'Owner', sortable: true,
    render: (r) => <DriverLink licenseNumber={r.owner_license_number} name={r.owner_name} />,
  },
  {
    key: 'violation_count', header: 'Violations', sortable: true,
    render: (r) => r.violation_count,
  },
];

function getColumns(reportId: ReportId): ColumnDef<ReportRow>[] {
  switch (reportId) {
    case 1: return REPORT1_COLS as ColumnDef<ReportRow>[];
    case 2: return REPORT2_COLS as ColumnDef<ReportRow>[];
    case 3: return REPORT3_COLS as ColumnDef<ReportRow>[];
    case 4: return REPORT4_COLS as ColumnDef<ReportRow>[];
    case 5: return REPORT5_COLS as ColumnDef<ReportRow>[];
    case 6: return REPORT6_COLS as ColumnDef<ReportRow>[];
    case 7: return REPORT7_COLS as ColumnDef<ReportRow>[];
  }
}

function getRowKey(reportId: ReportId, row: ReportRow): string {
  switch (reportId) {
    case 1:
    case 4: return (row as Report1Row).license_number;
    case 2: return (row as Report2Row).plate_number;
    case 3: return (row as Report3Row).plate_number;
    case 5: return (row as Report5Row).uovr_number;
    case 6: return (row as Report6Row).violation_type;
    case 7: return (row as Report7Row).plate_number;
  }
}

export default function ReportTable({ reportId, rows, emptyMessage }: ReportTableProps) {
  const columns = getColumns(reportId);
  const resolvedEmptyMessage = emptyMessage ?? 'No results found.';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {rows.length} {rows.length === 1 ? 'result' : 'results'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={rows.length === 0}
          onClick={() => exportCSV(rows, reportId)}
          icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
        >
          Export CSV
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table
          columns={columns}
          rows={rows}
          rowKey={(row) => getRowKey(reportId, row)}
          emptyMessage={resolvedEmptyMessage}
          stickyHeader
        />
      </div>
    </div>
  );
}