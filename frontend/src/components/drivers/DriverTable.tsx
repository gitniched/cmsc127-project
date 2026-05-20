import { useState } from 'react';
import Table from '../ui/Table';
import type { ColumnDef } from '../ui/Table';
import FilterBar from '../ui/FilterBar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import type { DriverWithAge } from '@shared/types/driver.types';
import { getFullName } from '@shared/types/driver.types';
import type { LicenseType, LicenseStatus, Sex } from '../../constants/enums';
import { LICENSE_TYPE_OPTIONS, LICENSE_STATUS_OPTIONS } from '../../constants/enums';

interface DriverTableProps {
  drivers:    DriverWithAge[];
  onView:     (driver: DriverWithAge) => void;
  onEdit:     (driver: DriverWithAge) => void;
  onDelete:   (driver: DriverWithAge) => void;
}

interface Filters {
  search:        string;
  licenseType:   LicenseType | '';
  licenseStatus: LicenseStatus | '';
  sex:           Sex | '';
  ageMin:        number | '';
  ageMax:        number | '';
}

const DEFAULT_FILTERS: Filters = {
  search:        '',
  licenseType:   '',
  licenseStatus: '',
  sex:           '',
  ageMin:        '',
  ageMax:        '',
};

export default function DriverTable({ drivers, onView, onEdit, onDelete }: DriverTableProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = useState(0);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setResetKey((prev) => prev + 1);
  }

  const filtered = drivers.filter((d) => {
    const fullName = getFullName(d).toLowerCase();
    const q = filters.search.toLowerCase();

    if (q && !fullName.includes(q) && !d.license_number.toLowerCase().includes(q)) return false;
    if (filters.licenseType   && d.license_type   !== filters.licenseType)   return false;
    if (filters.licenseStatus && d.license_status !== filters.licenseStatus) return false;
    if (filters.sex           && d.sex            !== filters.sex)           return false;
    if (filters.ageMin !== '' && d.age < filters.ageMin) return false;
    if (filters.ageMax !== '' && d.age > filters.ageMax) return false;
    return true;
  });

  const columns: ColumnDef<DriverWithAge>[] = [
    {
      key:      'license_number',
      header:   'License Number',
      sortable: true,
      render:   (d) => <span className="font-mono text-xs">{d.license_number}</span>,
    },
    {
      key:      'full_name',
      header:   'Full Name',
      sortable: true,
      sortValue: (d) => getFullName(d),
      render:   (d) => <span className="font-medium text-ink">{getFullName(d)}</span>,
    },
    {
      key:      'age',
      header:   'Age',
      sortable: true,
      width:    '72px',
      render:   (d) => d.age,
    },
    {
      key:      'sex',
      header:   'Sex',
      sortable: true,
      width:    '60px',
      render:   (d) => (d.sex === 'M' ? 'Male' : 'Female'),
    },
    {
      key:      'license_type',
      header:   'License Type',
      sortable: true,
      render:   (d) => <Badge status={d.license_type} />,
    },
    {
      key:      'license_status',
      header:   'Status',
      sortable: true,
      width:    '110px',
      render:   (d) => <Badge status={d.license_status} />,
    },
    {
      key:      'license_expiry_date',
      header:   'Expiry Date',
      sortable: true,
      render:   (d) => new Date(d.license_expiry_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    {
      key:    'actions',
      header: '',
      width:  '140px',
      render: (d) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => onView(d)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(d)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(d)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        controls={[
          {
            type:        'search',
            key:         'search',
            placeholder: 'Search by name or license number…',
            value:       filters.search,
            onChange:    (v) => setFilter('search', v),
          },
          {
            type:     'select',
            key:      'licenseType',
            label:    'License Type',
            options:  LICENSE_TYPE_OPTIONS.map((v) => ({ label: v, value: v })),
            value:    filters.licenseType,
            onChange: (v) => setFilter('licenseType', v as LicenseType | ''),
          },
          {
            type:     'select',
            key:      'licenseStatus',
            label:    'Status',
            options:  LICENSE_STATUS_OPTIONS.map((v) => ({ label: v, value: v })),
            value:    filters.licenseStatus,
            onChange: (v) => setFilter('licenseStatus', v as LicenseStatus | ''),
          },
          {
            type:     'select',
            key:      'sex',
            label:    'Sex',
            options:  [
              { label: 'Male',   value: 'M' },
              { label: 'Female', value: 'F' },
            ],
            value:    filters.sex,
            onChange: (v) => setFilter('sex', v as Sex | ''),
          },
          {
            type:            'number-range',
            key:             'age',
            label:           'Age Range',
            minValue:        filters.ageMin,
            maxValue:        filters.ageMax,
            minPlaceholder:  'Min',
            maxPlaceholder:  'Max',
            onMinChange:     (v) => setFilter('ageMin', v),
            onMaxChange:     (v) => setFilter('ageMax', v),
          },
        ]}
        onReset={resetFilters}
      />

      <div className="glass-card px-4 py-2 self-start flex items-center gap-2 text-sm text-ink-muted">
        Showing {filtered.length} of {drivers.length} drivers
      </div>

      <div className="glass-card overflow-hidden">
        <Table
          key={resetKey}
          columns={columns}
          rows={filtered}
          rowKey={(d) => d.license_number}
          onRowClick={onView}
          emptyMessage="No drivers match the current filters."
          stickyHeader
        />
      </div>
    </div>
  );
}