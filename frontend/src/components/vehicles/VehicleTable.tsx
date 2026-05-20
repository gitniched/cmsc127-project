import { useState } from 'react';
import Table from '../ui/Table';
import type { ColumnDef } from '../ui/Table';
import FilterBar from '../ui/FilterBar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import type { VehicleWithOwner } from '@shared/types/vehicle.types';
import { VehicleType, VEHICLE_TYPE_OPTIONS } from '../../constants/enums';

interface VehicleTableProps {
  vehicles: VehicleWithOwner[];
  onView:   (vehicle: VehicleWithOwner) => void;
  onEdit:   (vehicle: VehicleWithOwner) => void;
  onDelete: (vehicle: VehicleWithOwner) => void;
}

interface Filters {
  search:      string;
  vehicleType: VehicleType | '';
  make:        string;
  yearMin:     number | '';
  yearMax:     number | '';
}

const DEFAULT_FILTERS: Filters = {
  search:      '',
  vehicleType: '',
  make:        '',
  yearMin:     '',
  yearMax:     '',
};

export default function VehicleTable({ vehicles, onView, onEdit, onDelete }: VehicleTableProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = useState(0);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setResetKey((prev) => prev + 1);
  }

  const uniqueMakes = [...new Set(vehicles.map((v) => v.make))].sort();

  const filtered = vehicles.filter((v) => {
    const q = filters.search.toLowerCase();
    if (
      q &&
      !v.plate_number.toLowerCase().includes(q) &&
      !v.make.toLowerCase().includes(q) &&
      !v.model.toLowerCase().includes(q) &&
      !v.owner_name.toLowerCase().includes(q)
    )
      return false;
    if (filters.vehicleType && v.vehicle_type !== filters.vehicleType) return false;
    if (filters.make        && v.make         !== filters.make)         return false;
    if (filters.yearMin !== '' && v.year < filters.yearMin) return false;
    if (filters.yearMax !== '' && v.year > filters.yearMax) return false;
    return true;
  });

  const columns: ColumnDef<VehicleWithOwner>[] = [
    {
      key:      'plate_number',
      header:   'Plate Number',
      sortable: true,
      render:   (v) => <span className="font-mono text-xs">{v.plate_number}</span>,
    },
    {
      key:      'make',
      header:   'Make',
      sortable: true,
      render:   (v) => <span className="font-medium text-ink">{v.make}</span>,
    },
    {
      key:      'model',
      header:   'Model',
      sortable: true,
      render:   (v) => v.model,
    },
    {
      key:      'year',
      header:   'Year',
      sortable: true,
      width:    '72px',
      render:   (v) => v.year,
    },
    {
      key:      'vehicle_type',
      header:   'Type',
      sortable: true,
      render:   (v) => <Badge status={v.vehicle_type} />,
    },
    {
      key:      'color',
      header:   'Color',
      sortable: true,
      render:   (v) => v.color,
    },
    {
      key:      'owner_name',
      header:   'Owner',
      sortable: true,
      render:   (v) => <span className="font-medium text-ink">{v.owner_name}</span>,
    },
    {
      key:    'actions',
      header: '',
      width:  '140px',
      render: (v) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => onView(v)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(v)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(v)}>Delete</Button>
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
            placeholder: 'Search by plate, make, model, or owner…',
            value:       filters.search,
            onChange:    (v) => setFilter('search', v),
          },
          {
            type:     'select',
            key:      'vehicleType',
            label:    'Vehicle Type',
            options:  VEHICLE_TYPE_OPTIONS.map((v) => ({ label: v, value: v })),
            value:    filters.vehicleType,
            onChange: (v) => setFilter('vehicleType', v as VehicleType | ''),
          },
          {
            type:     'select',
            key:      'make',
            label:    'Make',
            options:  uniqueMakes.map((m) => ({ label: m, value: m })),
            value:    filters.make,
            onChange: (v) => setFilter('make', v),
          },
          {
            type:           'number-range',
            key:            'year',
            label:          'Year Range',
            minValue:       filters.yearMin,
            maxValue:       filters.yearMax,
            minPlaceholder: 'From',
            maxPlaceholder: 'To',
            onMinChange:    (v) => setFilter('yearMin', v),
            onMaxChange:    (v) => setFilter('yearMax', v),
          },
        ]}
        onReset={resetFilters}
      />

      <div className="glass-card px-4 py-2 self-start flex items-center gap-2 text-sm text-ink-muted">
        Showing {filtered.length} of {vehicles.length} vehicles
      </div>

      <div className="glass-card overflow-hidden">
        <Table
          key={resetKey}
          columns={columns}
          rows={filtered}
          rowKey={(v) => v.plate_number}
          onRowClick={onView}
          emptyMessage="No vehicles match the current filters."
          stickyHeader
        />
      </div>
    </div>
  );
}