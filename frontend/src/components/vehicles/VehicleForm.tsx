import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Vehicle, VehicleWithOwner, CreateVehicleDTO } from '@shared/types/vehicle.types';
import type { DriverWithAge } from '@shared/types/driver.types';
import { getFullName } from '@shared/types/driver.types';
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

const MAKE_MODELS: Record<string, string[]> = {
  Toyota:         ['Vios', 'Innova', 'Fortuner', 'Hilux', 'Avanza', 'Rush', 'Wigo', 'Land Cruiser', 'Camry', 'Corolla Altis'],
  Honda:          ['City', 'Civic', 'BR-V', 'CR-V', 'HR-V', 'Jazz', 'Brio', 'Accord'],
  Mitsubishi:     ['Montero Sport', 'Strada', 'Xpander', 'Mirage', 'Mirage G4', 'Eclipse Cross'],
  Suzuki:         ['Ertiga', 'Celerio', 'Dzire', 'Jimny', 'Swift', 'Vitara', 'Carry'],
  Ford:           ['Everest', 'Ranger', 'Explorer', 'Escape', 'EcoSport', 'Territory'],
  Hyundai:        ['Tucson', 'Santa Fe', 'Accent', 'Reina', 'Starex', 'Kona', 'Creta'],
  Kia:            ['Picanto', 'Soluto', 'Stonic', 'Sportage', 'Sorento', 'Carnival'],
  Nissan:         ['Navara', 'Terra', 'Almera', 'Juke', 'Patrol', 'NV350 Urvan'],
  Mazda:          ['2', '3', 'CX-3', 'CX-5', 'CX-9', 'BT-50'],
  Isuzu:          ['D-Max', 'mu-X', 'Crosswind', 'Sportivo'],
  Chevrolet:      ['Trailblazer', 'Colorado', 'Spark', 'Trax'],
  Subaru:         ['Forester', 'XV', 'Outback', 'Levorg'],
  Yamaha:         ['Mio', 'NMAX', 'Aerox', 'Sniper', 'MT-15', 'XSR155'],
  Kawasaki:       ['Dominar 400', 'Ninja 400', 'KLX 150', 'Barako II'],
  'Honda Moto':   ['Click 125i', 'Beat', 'PCX 160', 'ADV 160', 'CBR 150R', 'XRM 125'],
  'Suzuki Moto':  ['Raider R150', 'Address 115', 'Gixxer 150'],
  Foton:          ['Transvan', 'Toano', 'Thunder'],
  JAC:            ['T8', 'S3', 'S4'],
};

const ALL_MAKES = Object.keys(MAKE_MODELS).sort();

const MOTO_TYPES = new Set<VehicleType>([VehicleType.Motorcycle, VehicleType.Tricycle]);

const COLORS = [
  'White', 'Pearl White', 'Black', 'Midnight Black', 'Silver', 'Gray',
  'Red', 'Dark Red', 'Maroon', 'Blue', 'Dark Blue', 'Navy Blue',
  'Green', 'Olive Green', 'Yellow', 'Orange', 'Brown', 'Beige', 'Champagne', 'Gold',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = Array.from(
  { length: CURRENT_YEAR + 1 - 1990 + 1 },
  (_, i) => CURRENT_YEAR + 1 - i,
);

function platePlaceholder(vehicleType: VehicleType): string {
  return MOTO_TYPES.has(vehicleType) ? 'AB-1234' : 'ABC-1234';
}

function plateFormatHint(vehicleType: VehicleType): string {
  return MOTO_TYPES.has(vehicleType)
    ? 'Format: XX-#### (post-2018) or XX-### (pre-2018)'
    : 'Format: XXX-#### (post-2018) or XXX-### (pre-2018)';
}

function validatePlateFormat(plate: string, vehicleType: VehicleType): boolean {
  const upper = plate.trim().toUpperCase();
  const patterns = MOTO_TYPES.has(vehicleType)
    ? [/^[A-Z]{2}-\d{4}$/, /^[A-Z]{2}-\d{3}$/]
    : [/^[A-Z]{3}-\d{4}$/, /^[A-Z]{3}-\d{3}$/];
  return patterns.some((p) => p.test(upper));
}

function generateEngineNumber(): string {
  const seq = String(Math.floor(Math.random() * 90000000) + 10000000);
  return `ENG-${seq}`;
}

function generateChassisNumber(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) vin += chars[Math.floor(Math.random() * chars.length)];
  return vin;
}

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const inputErr  = 'border-danger-400 focus:border-danger-400 focus:ring-danger-100';
const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

interface FieldError { [key: string]: string; }

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-danger-500">{msg}</p>;
}

function PortalDropdown({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement>;
  children:  React.ReactNode;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
  });

  return createPortal(<div style={style}>{children}</div>, document.body);
}

const dropdownList = 'bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto';
const dropdownItem = 'w-full px-3 py-2 text-left text-sm hover:bg-surface-inset cursor-pointer block';

export default function VehicleForm({
  open, onClose, onSubmit, initial, drivers, saveError, saving,
}: VehicleFormProps) {
  const isEdit = !!initial;

  const [form, setForm]     = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldError>({});

  const [makeOpen,  setMakeOpen]  = useState(false);
  const [makeQuery, setMakeQuery] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);

  const makeRef  = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? toFormState(initial) : EMPTY);
      setErrors({});
      setMakeOpen(false);
      setModelOpen(false);
      setColorOpen(false);
      setOwnerOpen(false);
      setMakeQuery('');
    }
  }, [open, initial]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (makeRef.current  && !makeRef.current.contains(t))  setMakeOpen(false);
      if (modelRef.current && !modelRef.current.contains(t)) setModelOpen(false);
      if (colorRef.current && !colorRef.current.contains(t)) setColorOpen(false);
      if (ownerRef.current && !ownerRef.current.contains(t)) setOwnerOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  const filteredMakes = useMemo(() => {
    const q = makeQuery.toLowerCase();
    return q ? ALL_MAKES.filter((m) => m.toLowerCase().includes(q)) : ALL_MAKES;
  }, [makeQuery]);

  const modelsForMake = useMemo(() => MAKE_MODELS[form.make] ?? [], [form.make]);

  const filteredModels = useMemo(() => {
    const q = form.model.toLowerCase();
    return q ? modelsForMake.filter((m) => m.toLowerCase().includes(q)) : modelsForMake;
  }, [modelsForMake, form.model]);

  const filteredColors = useMemo(() => {
    const q = form.color.toLowerCase();
    return q ? COLORS.filter((c) => c.toLowerCase().includes(q)) : COLORS;
  }, [form.color]);

  const filteredOwners = useMemo(() => {
    const q = form.owner_search.toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) => getFullName(d).toLowerCase().includes(q) || d.license_number.toLowerCase().includes(q),
    );
  }, [drivers, form.owner_search]);

  const plateFormatOk: boolean | null = form.plate_number
    ? validatePlateFormat(form.plate_number, form.vehicle_type)
    : null;

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.plate_number.trim()) {
      e.plate_number = 'Required';
    } else if (!validatePlateFormat(form.plate_number, form.vehicle_type)) {
      e.plate_number = 'Does not match LTO format for this vehicle type';
    }
    if (!form.make.trim())                 e.make                 = 'Required';
    if (!form.model.trim())                e.model                = 'Required';
    if (!form.engine_number.trim())        e.engine_number        = 'Required';
    if (!form.chassis_number.trim())       e.chassis_number       = 'Required';
    if (!form.year)                        e.year                 = 'Required';
    if (!form.color.trim())                e.color                = 'Required';
    if (!form.owner_license_number.trim()) e.owner_license_number = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      plate_number:         form.plate_number.trim().toUpperCase(),
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
            <label className={labelBase}>Vehicle Type <span className="text-danger-500">*</span></label>
            <select
              className={inputBase}
              value={form.vehicle_type}
              onChange={(e) => {
                set('vehicle_type', e.target.value as VehicleType);
                if (!isEdit) set('plate_number', '');
              }}
            >
              {VEHICLE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelBase}>Plate Number <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, 'font-mono uppercase', errors.plate_number ? inputErr : ''].join(' ')}
              value={form.plate_number}
              onChange={(e) => set('plate_number', e.target.value.toUpperCase())}
              placeholder={platePlaceholder(form.vehicle_type)}
              disabled={isEdit}
              autoComplete="off"
            />
            {errors.plate_number
              ? <FieldErr msg={errors.plate_number} />
              : <p className="mt-1 text-xs text-ink-faint">{plateFormatHint(form.vehicle_type)}</p>
            }
            {!errors.plate_number && plateFormatOk === false && (
              <p className="mt-1 text-xs text-warning-600">⚠ Format doesn't match LTO pattern yet</p>
            )}
          </div>
          <div ref={makeRef} className="relative">
            <label className={labelBase}>Make <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.make ? inputErr : ''].join(' ')}
              value={form.make}
              onChange={(e) => {
                set('make', e.target.value);
                set('model', '');
                setMakeQuery(e.target.value);
                setMakeOpen(true);
              }}
              onFocus={() => { setMakeQuery(form.make); setMakeOpen(true); }}
              placeholder="Toyota"
              autoComplete="off"
            />
            <FieldErr msg={errors.make} />
            {makeOpen && filteredMakes.length > 0 && (
              <PortalDropdown anchorRef={makeRef as React.RefObject<HTMLElement>}>
                <ul className={dropdownList}>
                  {filteredMakes.map((m) => (
                    <li key={m}>
                      <button
                        type="button"
                        className={dropdownItem}
                        onMouseDown={() => {
                          set('make', m);
                          set('model', '');
                          setMakeOpen(false);
                          setMakeQuery('');
                        }}
                      >
                        {m}
                      </button>
                    </li>
                  ))}
                </ul>
              </PortalDropdown>
            )}
          </div>
          <div ref={modelRef} className="relative">
            <label className={labelBase}>Model <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.model ? inputErr : ''].join(' ')}
              value={form.model}
              onChange={(e) => { set('model', e.target.value); setModelOpen(true); }}
              onFocus={() => setModelOpen(true)}
              placeholder={modelsForMake[0] ?? 'Vios'}
              autoComplete="off"
            />
            {!form.make && !errors.model && (
              <p className="mt-1 text-xs text-ink-faint">Select a make first for suggestions</p>
            )}
            <FieldErr msg={errors.model} />
            {modelOpen && filteredModels.length > 0 && (
              <PortalDropdown anchorRef={modelRef as React.RefObject<HTMLElement>}>
                <ul className={dropdownList}>
                  {filteredModels.map((m) => (
                    <li key={m}>
                      <button
                        type="button"
                        className={dropdownItem}
                        onMouseDown={() => { set('model', m); setModelOpen(false); }}
                      >
                        {m}
                      </button>
                    </li>
                  ))}
                </ul>
              </PortalDropdown>
            )}
          </div>
          <div>
            <label className={labelBase}>Year <span className="text-danger-500">*</span></label>
            <select
              className={[inputBase, errors.year ? inputErr : ''].join(' ')}
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            >
              <option value="">Select year…</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <FieldErr msg={errors.year} />
          </div>
          <div ref={colorRef} className="relative">
            <label className={labelBase}>Color <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.color ? inputErr : ''].join(' ')}
              value={form.color}
              onChange={(e) => { set('color', e.target.value); setColorOpen(true); }}
              onFocus={() => setColorOpen(true)}
              placeholder="White"
              autoComplete="off"
            />
            <FieldErr msg={errors.color} />
            {colorOpen && filteredColors.length > 0 && (
              <PortalDropdown anchorRef={colorRef as React.RefObject<HTMLElement>}>
                <ul className={dropdownList}>
                  {filteredColors.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        className={dropdownItem}
                        onMouseDown={() => { set('color', c); setColorOpen(false); }}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              </PortalDropdown>
            )}
          </div>

          <div>
            <label className={labelBase}>Engine Number <span className="text-danger-500">*</span></label>
            <div className="flex gap-2">
              <input
                className={[inputBase, 'font-mono flex-1', errors.engine_number ? inputErr : ''].join(' ')}
                value={form.engine_number}
                onChange={(e) => set('engine_number', e.target.value)}
                placeholder="ENG-10000001"
                autoComplete="off"
              />
              {!isEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set('engine_number', generateEngineNumber())}
                  title="Generate a suggestion"
                >
                  ↺
                </Button>
              )}
            </div>
            {!isEdit && !errors.engine_number && (
              <p className="mt-1 text-xs text-ink-faint">Edit freely or click ↺ to generate</p>
            )}
            <FieldErr msg={errors.engine_number} />
          </div>
          <div>
            <label className={labelBase}>Chassis Number <span className="text-danger-500">*</span></label>
            <div className="flex gap-2">
              <input
                className={[inputBase, 'font-mono flex-1', errors.chassis_number ? inputErr : ''].join(' ')}
                value={form.chassis_number}
                onChange={(e) => set('chassis_number', e.target.value)}
                placeholder="17-character VIN"
                autoComplete="off"
              />
              {!isEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set('chassis_number', generateChassisNumber())}
                  title="Generate a suggestion"
                >
                  ↺
                </Button>
              )}
            </div>
            {!isEdit && !errors.chassis_number && (
              <p className="mt-1 text-xs text-ink-faint">Edit freely or click ↺ to generate</p>
            )}
            <FieldErr msg={errors.chassis_number} />
          </div>
          <div ref={ownerRef} className="sm:col-span-2 relative">
            <label className={labelBase}>Owner <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.owner_license_number ? inputErr : ''].join(' ')}
              value={form.owner_search}
              onChange={(e) => {
                set('owner_search', e.target.value);
                set('owner_license_number', '');
                setOwnerOpen(true);
              }}
              onFocus={() => setOwnerOpen(true)}
              placeholder="Search by name or license number…"
              autoComplete="off"
            />
            {form.owner_license_number && (
              <p className="mt-1 text-xs text-ink-faint font-mono">{form.owner_license_number}</p>
            )}
            <FieldErr msg={errors.owner_license_number} />
            {ownerOpen && filteredOwners.length > 0 && (
              <PortalDropdown anchorRef={ownerRef as React.RefObject<HTMLElement>}>
                <ul className={dropdownList}>
                  {filteredOwners.map((d) => (
                    <li key={d.license_number}>
                      <button
                        type="button"
                        className={`${dropdownItem} flex items-center justify-between gap-4`}
                        onMouseDown={() => {
                          set('owner_license_number', d.license_number);
                          set('owner_search', getFullName(d));
                          setOwnerOpen(false);
                        }}
                      >
                        <span className="text-ink">{getFullName(d)}</span>
                        <span className="font-mono text-xs text-ink-faint shrink-0">{d.license_number}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </PortalDropdown>
            )}
            {ownerOpen && filteredOwners.length === 0 && form.owner_search && (
              <PortalDropdown anchorRef={ownerRef as React.RefObject<HTMLElement>}>
                <div className="bg-surface border border-border rounded-md shadow-lg px-3 py-2 text-sm text-ink-muted">
                  No drivers found.
                </div>
              </PortalDropdown>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
}