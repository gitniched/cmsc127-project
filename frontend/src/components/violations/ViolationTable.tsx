import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TrafficViolationFull } from '../../types/violation.types';
import { VIOLATION_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../constants/enums';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Table from '../ui/Table';
import type { ColumnDef } from '../ui/Table';
import FilterBar from '../ui/FilterBar';
import type { FilterControl } from '../ui/FilterBar';

interface ViolationTableProps {
  violations: TrafficViolationFull[];
  onEdit:     (violation: TrafficViolationFull) => void;
  onDelete:   (uovr_number: string) => void;
}

export default function ViolationTable({ violations, onEdit, onDelete }: ViolationTableProps) {
  const navigate = useNavigate();

  const [search,                setSearch]                = useState('');
  const [filterViolationStatus, setFilterViolationStatus] = useState('');
  const [filterPaymentStatus,   setFilterPaymentStatus]   = useState('');
  const [filterYear,            setFilterYear]            = useState('');
  const [filterCity,            setFilterCity]            = useState('');
  const [filterRegion,          setFilterRegion]          = useState('');

  const years = useMemo(() => {
    const set = new Set(violations.map((v) => v.violation_date.slice(0, 4)));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [violations]);

  const cities = useMemo(() => {
    const set = new Set(violations.map((v) => v.violation_location_city));
    return Array.from(set).sort();
  }, [violations]);

  const regions = useMemo(() => {
    const set = new Set(violations.map((v) => v.violation_location_region));
    return Array.from(set).sort();
  }, [violations]);

  function handleReset() {
    setSearch('');
    setFilterViolationStatus('');
    setFilterPaymentStatus('');
    setFilterYear('');
    setFilterCity('');
    setFilterRegion('');
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return violations.filter((v) => {
      if (filterViolationStatus && v.violation_status !== filterViolationStatus) return false;
      if (filterPaymentStatus   && v.payment_status   !== filterPaymentStatus)   return false;
      if (filterYear            && v.violation_date.slice(0, 4) !== filterYear)  return false;
      if (filterCity            && v.violation_location_city    !== filterCity)   return false;
      if (filterRegion          && v.violation_location_region  !== filterRegion) return false;
      if (q) {
        const types = v.violation_types.map((t) => t.violation_type.toLowerCase()).join(' ');
        return (
          v.uovr_number.toLowerCase().includes(q) ||
          v.driver_name.toLowerCase().includes(q) ||
          v.plate_number.toLowerCase().includes(q) ||
          v.violation_location_city.toLowerCase().includes(q) ||
          types.includes(q)
        );
      }
      return true;
    });
  }, [violations, search, filterViolationStatus, filterPaymentStatus, filterYear, filterCity, filterRegion]);

  const controls: FilterControl[] = [
    {
      type:        'search',
      key:         'search',
      placeholder: 'Search UOVR, driver, plate, city…',
      value:       search,
      onChange:    setSearch,
    },
    {
      type:     'select',
      key:      'violationStatus',
      label:    'Violation Status',
      value:    filterViolationStatus,
      onChange: setFilterViolationStatus,
      options:  VIOLATION_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
    },
    {
      type:     'select',
      key:      'paymentStatus',
      label:    'Payment Status',
      value:    filterPaymentStatus,
      onChange: setFilterPaymentStatus,
      options:  PAYMENT_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
    },
    {
      type:     'select',
      key:      'year',
      label:    'Year',
      value:    filterYear,
      onChange: setFilterYear,
      options:  years.map((y) => ({ label: y, value: y })),
    },
    {
      type:     'select',
      key:      'city',
      label:    'City',
      value:    filterCity,
      onChange: setFilterCity,
      options:  cities.map((c) => ({ label: c, value: c })),
    },
    {
      type:     'select',
      key:      'region',
      label:    'Region',
      value:    filterRegion,
      onChange: setFilterRegion,
      options:  regions.map((r) => ({ label: r, value: r })),
    },
  ];

  const columns: ColumnDef<TrafficViolationFull>[] = [
    {
      key:      'uovr_number',
      header:   'UOVR Number',
      sortable: true,
      render:   (v) => (
        <button
          className="font-mono text-xs text-brand-600 hover:underline text-left"
          onClick={() => navigate(`/violations/${v.uovr_number}`)}
        >
          {v.uovr_number}
        </button>
      ),
    },
    {
      key:      'violation_date',
      header:   'Date',
      sortable: true,
      render: (r) => new Date(r.violation_date).toLocaleDateString('en-CA'),
    },
    {
      key:      'violation_location_city',
      header:   'City',
      sortable: true,
      render:   (v) => v.violation_location_city,
    },
    {
      key:      'driver_name',
      header:   'Driver',
      sortable: true,
      render:   (v) => (
        <button
          className="text-brand-600 hover:underline text-left"
          onClick={() => navigate(`/drivers/${v.license_number}`)}
        >
          {v.driver_name}
        </button>
      ),
    },
    {
      key:      'plate_number',
      header:   'Plate Number',
      sortable: true,
      render:   (v) => (
        <button
          className="font-mono text-xs text-brand-600 hover:underline text-left"
          onClick={() => navigate(`/vehicles/${v.plate_number}`)}
        >
          {v.plate_number}
        </button>
      ),
    },
    {
      key:    'violation_types',
      header: 'Violation Types',
      render: (v) => (
        <span className="text-ink-muted">
          {v.violation_types.map((t) => t.violation_type).join(', ')}
        </span>
      ),
    },
    {
      key:      'total_fine',
      header:   'Total Fine',
      sortable: true,
      render:   (v) => <span className="font-medium">₱{v.total_fine.toLocaleString()}</span>,
    },
    {
      key:      'violation_status',
      header:   'Violation Status',
      sortable: true,
      width:    '130px',
      render:   (v) => <Badge status={v.violation_status} />,
    },
    {
      key:      'payment_status',
      header:   'Payment Status',
      sortable: true,
      width:    '120px',
      render:   (v) => <Badge status={v.payment_status} />,
    },
    {
      key:    'actions',
      header: 'Actions',
      width:  '160px',
      render: (v) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/violations/${v.uovr_number}`)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(v)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(v.uovr_number)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
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

    

    <div className="flex flex-col gap-4">
      <FilterBar controls={controls} onReset={handleReset} />
      <div className="glass-card px-4 py-2 self-start flex items-center gap-2 text-sm text-ink-muted">
        Showing {filtered.length} of {violations.length} violations
      </div>
      <div className="glass-card overflow-hidden">
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(v) => v.uovr_number}
          emptyMessage="No violations found."
        />
      </div>
    </div>
    </>
  );
}