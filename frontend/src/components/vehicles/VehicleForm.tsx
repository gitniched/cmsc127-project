import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Vehicle, VehicleWithOwner, CreateVehicleDTO } from '../../types/vehicle.types';
import type { DriverWithAge } from '../../types/driver.types';
import { getFullName } from '../../types/driver.types';
import { VehicleType, VEHICLE_TYPE_OPTIONS } from '../../constants/enums';

interface VehicleFormProps {
  open:       boolean;
  onClose:    () => void;
  onSubmit:   (data: CreateVehicleDTO) => void;
  initial?:   VehicleWithOwner | Vehicle | null;
  drivers:    DriverWithAge[];
  saveError?: string | null;
  saving?:    boolean;
}

type FormState = {
  plate_number:         string;
  make:                 string;
  model:                string;
  engine_number:        string;
  chassis_number:       string;
  vehicle_type:         VehicleType;
  year:                 string;
  color:                string;
  owner_license_number: string;
  owner_search:         string;
};

const EMPTY: FormState = {
  plate_number:         '',
  make:                 '',
  model:                '',
  engine_number:        '',
  chassis_number:       '',
  vehicle_type:         VehicleType.Sedan,
  year:                 '',
  color:                '',
  owner_license_number: '',
  owner_search:         '',
};

function toFormState(v: Vehicle | VehicleWithOwner): FormState {
  return {
    plate_number:         v.plate_number,
    make:                 v.make,
    model:                v.model,
    engine_number:        v.engine_number,
    chassis_number:       v.chassis_number,
    vehicle_type:         v.vehicle_type,
    year:                 String(v.year),
    color:                v.color,
    owner_license_number: v.owner_license_number,
    owner_search:         'owner_name' in v ? (v as VehicleWithOwner).owner_name : '',
  };
}

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

interface FieldError {
  [key: string]: string;
}

export default function VehicleForm({ open, onClose, onSubmit, initial, drivers, saveError, saving }: VehicleFormProps) {
  const isEdit = !!initial;
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [errors, setErrors]       = useState<FieldError>({});
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? toFormState(initial) : EMPTY);
      setErrors({});
      setShowDropdown(false);
    }
  }, [open, initial]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  const filteredDrivers = drivers.filter((d) => {
    const q = form.owner_search.toLowerCase();
    if (!q) return true;
    return (
      getFullName(d).toLowerCase().includes(q) ||
      d.license_number.toLowerCase().includes(q)
    );
  });

  function selectDriver(driver: DriverWithAge) {
    setForm((prev) => ({
      ...prev,
      owner_license_number: driver.license_number,
      owner_search:         getFullName(driver),
    }));
    setErrors((prev) => ({ ...prev, owner_license_number: '' }));
    setShowDropdown(false);
  }

  function validate(): boolean {
    const e: FieldError = {};

    if (!form.plate_number.trim())         e.plate_number         = 'Required';
    if (!form.make.trim())                 e.make                 = 'Required';
    if (!form.model.trim())                e.model                = 'Required';
    if (!form.engine_number.trim())        e.engine_number        = 'Required';
    if (!form.chassis_number.trim())       e.chassis_number       = 'Required';
    if (!form.year.trim())                 e.year                 = 'Required';
    if (!form.color.trim())               e.color                = 'Required';
    if (!form.owner_license_number.trim()) e.owner_license_number = 'Required';

    if (form.year) {
      const y = Number(form.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(y) || y < 1886 || y > currentYear + 1) {
        e.year = `Enter a valid year (1886–${currentYear + 1})`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      plate_number:         form.plate_number.trim(),
      make:                 form.make.trim(),
      model:                form.model.trim(),
      engine_number:        form.engine_number.trim(),
      chassis_number:       form.chassis_number.trim(),
      vehicle_type:         form.vehicle_type,
      year:                 Number(form.year),
      color:                form.color.trim(),
      owner_license_number: form.owner_license_number,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {saveError && (
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {saveError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <label className={labelBase}>Plate Number <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, 'font-mono', errors.plate_number ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.plate_number}
            onChange={(e) => set('plate_number', e.target.value)}
            placeholder="ABC-1234"
            disabled={isEdit}
          />
          {errors.plate_number && <p className="mt-1 text-xs text-danger-500">{errors.plate_number}</p>}
        </div>

        <div>
          <label className={labelBase}>Vehicle Type <span className="text-danger-500">*</span></label>
          <select
            className={inputBase}
            value={form.vehicle_type}
            onChange={(e) => set('vehicle_type', e.target.value as VehicleType)}
          >
            {VEHICLE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelBase}>Make <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.make ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.make}
            onChange={(e) => set('make', e.target.value)}
            placeholder="Toyota"
          />
          {errors.make && <p className="mt-1 text-xs text-danger-500">{errors.make}</p>}
        </div>

        <div>
          <label className={labelBase}>Model <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.model ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.model}
            onChange={(e) => set('model', e.target.value)}
            placeholder="Vios"
          />
          {errors.model && <p className="mt-1 text-xs text-danger-500">{errors.model}</p>}
        </div>

        <div>
          <label className={labelBase}>Year <span className="text-danger-500">*</span></label>
          <input
            type="number"
            className={[inputBase, errors.year ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="2021"
            min={1886}
            max={new Date().getFullYear() + 1}
          />
          {errors.year && <p className="mt-1 text-xs text-danger-500">{errors.year}</p>}
        </div>

        <div>
          <label className={labelBase}>Color <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.color ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.color}
            onChange={(e) => set('color', e.target.value)}
            placeholder="White"
          />
          {errors.color && <p className="mt-1 text-xs text-danger-500">{errors.color}</p>}
        </div>

        <div>
          <label className={labelBase}>Engine Number <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, 'font-mono', errors.engine_number ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.engine_number}
            onChange={(e) => set('engine_number', e.target.value)}
            placeholder="ENG-10001"
          />
          {errors.engine_number && <p className="mt-1 text-xs text-danger-500">{errors.engine_number}</p>}
        </div>

        <div>
          <label className={labelBase}>Chassis Number <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, 'font-mono', errors.chassis_number ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.chassis_number}
            onChange={(e) => set('chassis_number', e.target.value)}
            placeholder="CHAS-10001"
          />
          {errors.chassis_number && <p className="mt-1 text-xs text-danger-500">{errors.chassis_number}</p>}
        </div>

        <div className="sm:col-span-2 relative">
          <label className={labelBase}>Owner <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.owner_license_number ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.owner_search}
            onChange={(e) => {
              set('owner_search', e.target.value);
              set('owner_license_number', '');
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search by name or license number…"
          />
          {errors.owner_license_number && <p className="mt-1 text-xs text-danger-500">{errors.owner_license_number}</p>}
          {form.owner_license_number && (
            <p className="mt-1 text-xs text-ink-faint font-mono">{form.owner_license_number}</p>
          )}
          {showDropdown && filteredDrivers.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredDrivers.map((d) => (
                <li
                  key={d.license_number}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-surface-inset flex items-center justify-between gap-2"
                  onMouseDown={() => selectDriver(d)}
                >
                  <span className="font-medium text-ink">{getFullName(d)}</span>
                  <span className="font-mono text-xs text-ink-muted">{d.license_number}</span>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && filteredDrivers.length === 0 && form.owner_search && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg px-3 py-2 text-sm text-ink-muted">
              No drivers found.
            </div>
          )}
        </div>
      </div>
      </div>
    </Modal>
  );
}