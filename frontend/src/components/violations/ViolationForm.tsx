import { useState, useEffect, useMemo, useRef } from 'react';
import type { TrafficViolationFull, CreateViolationDTO } from '@shared/types/violation.types';
import { createPortal } from 'react-dom';
import {
  ViolationStatus,
  PaymentStatus,
  ViolationTypeEnum,
  VIOLATION_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  VIOLATION_TYPE_OPTIONS,
} from '../../constants/enums';
import { FINE_SCHEDULE } from '../../constants/fineSchedule';
import { getFullName } from '@shared/types/driver.types';
import { useDrivers } from '../../hooks/useDrivers';
import { useVehicles } from '../../hooks/useVehicles';
import { useRegistrations } from '../../hooks/useRegistrations';
import Button from '../ui/Button';

// ---------------------------------------------------------------------------
// UOVR number generation
// Format: [CityPrefix][YY]-[7-digit seq]-[1-digit checksum]
// Prefix: M = NCR/MMDA, C = Cebu, D = Davao, B = Baguio, I = Iloilo
// ---------------------------------------------------------------------------
const CITY_PREFIX_MAP: Record<string, string> = {
  // NCR
  'Manila':       'M', 'Quezon City': 'M', 'Caloocan': 'M', 'Pasig': 'M',
  'Taguig':       'M', 'Makati': 'M', 'Mandaluyong': 'M', 'Marikina': 'M',
  'Parañaque':    'M', 'Las Piñas': 'M', 'Muntinlupa': 'M', 'Valenzuela': 'M',
  'Malabon':      'M', 'Navotas': 'M', 'Pasay': 'M', 'Pateros': 'M',
  // Cebu
  'Cebu City':    'C', 'Lapu-Lapu': 'C', 'Mandaue': 'C',
  // Davao
  'Davao City':   'D',
  // Baguio
  'Baguio City':  'B', 'Baguio': 'B',
  // Iloilo
  'Iloilo City':  'I', 'Iloilo': 'I',
};

const CITY_REGION_MAP: Record<string, string> = {
  // NCR
  'Manila':         'NCR', 'Quezon City': 'NCR', 'Caloocan': 'NCR', 'Pasig': 'NCR',
  'Taguig':         'NCR', 'Makati': 'NCR', 'Mandaluyong': 'NCR', 'Marikina': 'NCR',
  'Parañaque':      'NCR', 'Las Piñas': 'NCR', 'Muntinlupa': 'NCR', 'Valenzuela': 'NCR',
  'Malabon':        'NCR', 'Navotas': 'NCR', 'Pasay': 'NCR', 'Pateros': 'NCR',
  // Luzon
  'Baguio City':    'CAR', 'Baguio': 'CAR',
  'San Fernando':   'Region I',
  'Dagupan':        'Region I',
  'Laoag':          'Region I',
  'Vigan':          'Region I',
  'Tuguegarao':     'Region II',
  'Santiago':       'Region II',
  'Angeles':        'Region III', 'Angeles City': 'Region III',
  'Olongapo':       'Region III',
  'San Jose del Monte': 'Region III',
  'Malolos':        'Region III',
  'Meycauayan':     'Region III',
  'Cabanatuan':     'Region III',
  'Antipolo':       'Region IV-A', 'Antipolo City': 'Region IV-A',
  'Calamba':        'Region IV-A',
  'Santa Rosa':     'Region IV-A',
  'Bacoor':         'Region IV-A',
  'Imus':           'Region IV-A',
  'Dasmariñas':     'Region IV-A',
  'General Santos': 'Region XII',
  'Cagayan de Oro': 'Region X',
  // Visayas
  'Cebu City':      'Region VII', 'Lapu-Lapu': 'Region VII', 'Mandaue': 'Region VII',
  'Bacolod':        'Region VI', 'Iloilo City': 'Region VI', 'Iloilo': 'Region VI',
  'Tacloban':       'Region VIII',
  // Mindanao
  'Davao City':     'Region XI',
  'Zamboanga':      'Region IX', 'Zamboanga City': 'Region IX',
  'Butuan':         'Region XIII',
  'Cotabato':       'Region XII', 'Cotabato City': 'Region XII',
};

const KNOWN_CITIES = Object.keys(CITY_REGION_MAP).sort();

function getCityPrefix(city: string): string {
  return CITY_PREFIX_MAP[city] ?? city.charAt(0).toUpperCase();
}

function getRegionForCity(city: string): string {
  return CITY_REGION_MAP[city] ?? '';
}

function generateUovrNumber(city: string, date: string): string {
  if (!date) return '';
  const prefix = getCityPrefix(city.trim());
  const yy = date.slice(2, 4); // '2025-...' → '25'
  const seq = String(Math.floor(Math.random() * 9000000) + 1000000); // 7-digit
  const checksum = String(Math.floor(Math.random() * 10)); // 1-digit
  return `${prefix}${yy}-${seq}-${checksum}`;
}

// ---------------------------------------------------------------------------
// Valid payment statuses per violation status
// ---------------------------------------------------------------------------
const VALID_PAYMENT_FOR_STATUS: Record<ViolationStatus, PaymentStatus[]> = {
  [ViolationStatus.Pending]:   [PaymentStatus.Unpaid],
  [ViolationStatus.Resolved]:  [PaymentStatus.Paid, PaymentStatus.Waived],
  [ViolationStatus.Contested]: [PaymentStatus.Unpaid],
  [ViolationStatus.Dismissed]: [PaymentStatus.Waived],
};

// ---------------------------------------------------------------------------
// Violation type combobox helpers
// ---------------------------------------------------------------------------
type ViolationCategory =
  | 'Parking / Loading'
  | 'Traffic Flow'
  | 'Public Utility Vehicle'
  | 'Driver License'
  | 'Safety Equipment'
  | 'Speeding'
  | 'Conduct / Behavior'
  | 'Vehicle / Document'
  | 'Serious Offenses'
  | 'Other';

const TYPE_CATEGORIES: Record<ViolationTypeEnum, ViolationCategory> = {
  [ViolationTypeEnum.IllegalParkingAttended]:          'Parking / Loading',
  [ViolationTypeEnum.IllegalParkingUnattended]:        'Parking / Loading',
  [ViolationTypeEnum.ViolationOfLoadingZones]:         'Parking / Loading',
  [ViolationTypeEnum.ObstructionToTraffic]:            'Traffic Flow',
  [ViolationTypeEnum.ViolationOfOneWayStreet]:         'Traffic Flow',
  [ViolationTypeEnum.DrivingAgainstTraffic]:           'Traffic Flow',
  [ViolationTypeEnum.IllegalCounterflow]:              'Traffic Flow',
  [ViolationTypeEnum.NoUTurn]:                         'Traffic Flow',
  [ViolationTypeEnum.ColorumTricycles]:                'Public Utility Vehicle',
  [ViolationTypeEnum.FiftyFiftyScheme]:                'Public Utility Vehicle',
  [ViolationTypeEnum.NonDisplayOfNotForHire]:          'Public Utility Vehicle',
  [ViolationTypeEnum.NotPostingPassengerFareMatrix]:   'Public Utility Vehicle',
  [ViolationTypeEnum.RefusalToConveyPassenger]:        'Public Utility Vehicle',
  [ViolationTypeEnum.Overcharging]:                    'Public Utility Vehicle',
  [ViolationTypeEnum.SmokingInsidePUV]:                'Public Utility Vehicle',
  [ViolationTypeEnum.NoOverloading]:                   'Public Utility Vehicle',
  [ViolationTypeEnum.NoDriversLicense]:                'Driver License',
  [ViolationTypeEnum.NoProfessionalDriversLicense]:    'Driver License',
  [ViolationTypeEnum.ExpiredDriversLicense]:           'Driver License',
  [ViolationTypeEnum.DrivingWithoutLicense]:           'Driver License',
  [ViolationTypeEnum.DrivingWithSuspendedLicense]:     'Driver License',
  [ViolationTypeEnum.DrivingWithRevokedLicense]:       'Driver License',
  [ViolationTypeEnum.UnauthorizedDriver]:              'Driver License',
  [ViolationTypeEnum.NoSeatbelt]:                      'Safety Equipment',
  [ViolationTypeEnum.FailureToUseSeatbelt]:            'Safety Equipment',
  [ViolationTypeEnum.NoSafetyHelmet]:                  'Safety Equipment',
  [ViolationTypeEnum.ChildrenSafetyOnMotorcycle]:      'Safety Equipment',
  [ViolationTypeEnum.NoICCPSMarkStickerOnHelmet]:      'Safety Equipment',
  [ViolationTypeEnum.NoInteriorLight]:                 'Safety Equipment',
  [ViolationTypeEnum.WithoutProperLight]:              'Safety Equipment',
  [ViolationTypeEnum.OverSpeeding]:                    'Speeding',
  [ViolationTypeEnum.NoContactOverspeeding]:           'Speeding',
  [ViolationTypeEnum.OvespeedingPhysicalApprehension]: 'Speeding',
  [ViolationTypeEnum.DrivingUnderInfluenceOfLiquor]:   'Conduct / Behavior',
  [ViolationTypeEnum.RecklessDriving]:                 'Conduct / Behavior',
  [ViolationTypeEnum.DisobedienceToTrafficOfficer]:    'Conduct / Behavior',
  [ViolationTypeEnum.DisregardingTrafficSignSignal]:   'Conduct / Behavior',
  [ViolationTypeEnum.DiscourtesousConduct]:            'Conduct / Behavior',
  [ViolationTypeEnum.UntidyAttireOfDriver]:            'Conduct / Behavior',
  [ViolationTypeEnum.Jaywalking]:                      'Conduct / Behavior',
  [ViolationTypeEnum.DrivingThroughProcessions]:       'Conduct / Behavior',
  [ViolationTypeEnum.TruckBan]:                        'Vehicle / Document',
  [ViolationTypeEnum.NoisyMuffler]:                    'Vehicle / Document',
  [ViolationTypeEnum.ViolationOfEmissionStandard]:     'Vehicle / Document',
  [ViolationTypeEnum.SmokeBelching]:                   'Vehicle / Document',
  [ViolationTypeEnum.ExpiredTCT]:                      'Vehicle / Document',
  [ViolationTypeEnum.NoMayorPermit]:                   'Vehicle / Document',
  [ViolationTypeEnum.UnifiedVehicularVolumeReductionProgram]: 'Vehicle / Document',
  [ViolationTypeEnum.AntiDistractedDrivingActViolation]: 'Vehicle / Document',
  [ViolationTypeEnum.UsingMotorVehicleInCrime]:        'Serious Offenses',
  [ViolationTypeEnum.Others]:                          'Other',
};

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------
const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const inputError = 'border-danger-400 focus:border-danger-400 focus:ring-danger-100';
const inputDisabled = 'opacity-60 cursor-not-allowed';
const labelBase = 'block text-xs font-medium text-ink-muted mb-1';
const errorText = 'mt-1 text-xs text-danger-600';

function FieldError({ errors, field }: { errors: Record<string, string>; field: string }) {
  return errors[field] ? <p className={errorText}>{errors[field]}</p> : null;
}

// ---------------------------------------------------------------------------
// TypeRow shape
// ---------------------------------------------------------------------------
interface TypeRow {
  id:             number;
  violation_type: ViolationTypeEnum | '';
  base_fine:      number;
  query:          string; // local search string for the combobox
  open:           boolean;
}

let _uid = 0;
function nextId() { return ++_uid; }
function blankRow(): TypeRow {
  return { id: nextId(), violation_type: '', base_fine: 0, query: '', open: false };
}

// ---------------------------------------------------------------------------
// ViolationTypeCombobox , searchable combobox for a single type row
// ---------------------------------------------------------------------------
interface ViolationTypeComboboxProps {
  row:       TypeRow;
  usedTypes: Set<ViolationTypeEnum | ''>;
  onChange:  (id: number, type: ViolationTypeEnum | '', label: string) => void;
  onOpen:    (id: number, open: boolean) => void;
  onQuery:   (id: number, q: string) => void;
}

function ViolationTypeCombobox({ row, usedTypes, onChange, onOpen, onQuery }: ViolationTypeComboboxProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Track the input's position so the portal can follow it
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const filtered = useMemo(() => {
    const q = row.query.toLowerCase();
    return VIOLATION_TYPE_OPTIONS.filter(
      (t) => !usedTypes.has(t) && (!q || t.toLowerCase().includes(q))
    );
  }, [row.query, usedTypes]);

  const grouped = useMemo(() => {
    const map = new Map<ViolationCategory, ViolationTypeEnum[]>();
    for (const t of filtered as ViolationTypeEnum[]) {
      const cat = TYPE_CATEGORIES[t] ?? 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  }, [filtered]);

  // Recompute position when opening or on scroll/resize
  useEffect(() => {
    if (!row.open) return;
    function update() {
      if (!inputRef.current) return;
      const r = inputRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [row.open]);

  // Close on outside click (check both input and portal)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideInput  = inputRef.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideInput && !insidePortal) onOpen(row.id, false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [row.id, onOpen]);

  const dropdown = row.open && rect ? (
    <div
      ref={portalRef}
      style={{
        position:  'fixed',
        top:       rect.top,
        left:      rect.left,
        width:     rect.width,
        zIndex:    9999,
        maxHeight: '14rem',
        overflowY: 'auto',
      }}
      className="bg-surface border border-border rounded-md shadow-xl"
    >
      {grouped.size === 0 ? (
        <p className="px-3 py-2 text-sm text-ink-faint">No matching violation types.</p>
      ) : (
        Array.from(grouped.entries()).map(([cat, types]) => (
          <div key={cat}>
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-ink-muted uppercase tracking-wide bg-surface-inset sticky top-0">
              {cat}
            </p>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-ink hover:bg-surface-inset flex items-center justify-between gap-3"
                onMouseDown={() => {
                  onChange(row.id, t, t);
                  onOpen(row.id, false);
                }}
              >
                <span>{t}</span>
                <span className="text-xs text-ink-faint shrink-0">
                  ₱{(FINE_SCHEDULE[t] ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  ) : null;

  return (
    <>
      <input
        ref={inputRef}
        className={[inputBase, !row.violation_type ? inputError : ''].join(' ')}
        value={row.query}
        placeholder="Search violation type…"
        onChange={(e) => {
          onQuery(row.id, e.target.value);
          if (row.violation_type) onChange(row.id, '', '');
          onOpen(row.id, true);
        }}
        onFocus={() => onOpen(row.id, true)}
        autoComplete="off"
      />
      {/* Portal renders the dropdown directly on document.body, escaping any overflow:hidden ancestor */}
      {row.open && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}

// ---------------------------------------------------------------------------
// CityCombobox, searchable city input that auto-fills region
// ---------------------------------------------------------------------------
interface CityComboboxProps {
  value:     string;
  onChange:  (city: string) => void;
  onRegion:  (region: string) => void;
  error?:    boolean;
}

function CityCombobox({ value, onChange, onRegion, error }: CityComboboxProps) {
  const [query, setQuery]   = useState(value);
  const [open,  setOpen]    = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Keep local query in sync when value is reset externally
  useEffect(() => { setQuery(value); }, [value]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? KNOWN_CITIES.filter((c) => c.toLowerCase().includes(q)) : KNOWN_CITIES;
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(city: string) {
    setQuery(city);
    onChange(city);
    onRegion(getRegionForCity(city));
    setOpen(false);
  }

  function handleChange(raw: string) {
    setQuery(raw);
    onChange(raw);
    // If the user typed exactly a known city, auto-fill region
    const region = getRegionForCity(raw);
    if (region) onRegion(region);
    setOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      <input
        className={[inputBase, error ? inputError : ''].join(' ')}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Manila"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map((city) => (
            <li key={city}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-ink hover:bg-surface-inset flex justify-between gap-3"
                onMouseDown={() => handleSelect(city)}
              >
                <span>{city}</span>
                <span className="text-xs text-ink-faint shrink-0">{CITY_REGION_MAP[city]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
interface ViolationFormProps {
  violation?: TrafficViolationFull;
  onSubmit:   (dto: CreateViolationDTO) => void;
  onCancel:   () => void;
  saving?:    boolean;
  saveError?: string | null;
  hideFooter?: boolean;
}

export default function ViolationForm({ violation, onSubmit, onCancel, saving, saveError, hideFooter = false }: ViolationFormProps) {
  const isEdit = !!violation;

  const { drivers } = useDrivers();

  // ── Incident fields ──────────────────────────────────────────────────────
  const [uovrNumber,      setUovrNumber]      = useState(violation?.uovr_number ?? '');
  const [uovrSuggested,   setUovrSuggested]   = useState(false); // true once auto-generated
  const [officer,         setOfficer]         = useState(violation?.officer ?? '');
  const [violationDate,   setViolationDate]   = useState(violation?.violation_date ?? '');
  const [city,            setCity]            = useState(violation?.violation_location_city ?? '');
  const [region,          setRegion]          = useState(violation?.violation_location_region ?? '');

  // ── Status fields ────────────────────────────────────────────────────────
  const [violationStatus, setViolationStatus] = useState<ViolationStatus>(
    violation?.violation_status ?? ViolationStatus.Pending
  );
  const [paymentStatus,   setPaymentStatus]   = useState<PaymentStatus>(
    violation?.payment_status ?? PaymentStatus.Unpaid
  );

  // ── Driver / vehicle / registration ─────────────────────────────────────
  const [licenseNumber,      setLicenseNumber]      = useState(violation?.license_number ?? '');
  const [plateNumber,        setPlateNumber]        = useState(violation?.plate_number ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(violation?.registration_number ?? '');

  const [driverQuery, setDriverQuery] = useState(() => {
    if (!violation) return '';
    const d = drivers.find((dr) => dr.license_number === violation.license_number);
    return d ? getFullName(d) : violation.license_number;
  });
  const [driverOpen, setDriverOpen] = useState(false);
  const driverRef = useRef<HTMLDivElement>(null);

  // ── Violation type rows ──────────────────────────────────────────────────
  const [typeRows, setTypeRows] = useState<TypeRow[]>(() =>
    violation?.violation_types.length
      ? violation.violation_types.map((t) => ({
          id:             nextId(),
          violation_type: t.violation_type,
          base_fine:      t.base_fine,
          query:          t.violation_type,
          open:           false,
        }))
      : [blankRow()]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Dependent data hooks ─────────────────────────────────────────────────
  const { vehicles: vehiclesForDriver } = useVehicles(
    licenseNumber ? { owner_license_number: licenseNumber } : undefined
  );
  const { registrations: registrationsForVehicle } = useRegistrations(
    plateNumber ? { plate_number: plateNumber } : undefined
  );

  // ── Derived values ───────────────────────────────────────────────────────
  const filteredDrivers = useMemo(() => {
    const q = driverQuery.toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        getFullName(d).toLowerCase().includes(q) ||
        d.license_number.toLowerCase().includes(q)
    );
  }, [driverQuery, drivers]);

  const totalFine = useMemo(
    () => typeRows.reduce((sum, r) => sum + r.base_fine, 0),
    [typeRows]
  );

  // Valid payment options filtered to only what's legal given current violation status
  const validPaymentOptions = useMemo(
    () => VALID_PAYMENT_FOR_STATUS[violationStatus] ?? PAYMENT_STATUS_OPTIONS,
    [violationStatus]
  );

  // ── Auto-generate UOVR when city+date both known (add mode only) ─────────
  useEffect(() => {
    if (isEdit) return;
    if (!violationDate || uovrSuggested) return;
    const suggestion = generateUovrNumber(city || 'M', violationDate);
    setUovrNumber(suggestion);
    setUovrSuggested(true);
  }, [violationDate, city, isEdit, uovrSuggested]);

  // If city changes in add mode and UOVR hasn't been manually edited, regenerate
  function regenerateUovr() {
    const suggestion = generateUovrNumber(city || 'M', violationDate);
    if (suggestion) {
      setUovrNumber(suggestion);
      setErrors((prev) => ({ ...prev, uovrNumber: '' }));
    }
  }

  // ── Cascade resets when driver/vehicle changes ───────────────────────────
  useEffect(() => {
    if (!licenseNumber) return;
    const stillOwned = vehiclesForDriver.find((v) => v.plate_number === plateNumber);
    if (!stillOwned) {
      setPlateNumber('');
      setRegistrationNumber('');
    }
  }, [licenseNumber, vehiclesForDriver]);

  useEffect(() => {
    if (!plateNumber) return;
    const stillLinked = registrationsForVehicle.find((r) => r.registration_number === registrationNumber);
    if (!stillLinked) setRegistrationNumber('');
  }, [plateNumber, registrationsForVehicle]);

  // ── Payment status: auto-correct when violation status changes ───────────
  useEffect(() => {
    const validOptions = VALID_PAYMENT_FOR_STATUS[violationStatus];
    if (!validOptions.includes(paymentStatus)) {
      setPaymentStatus(validOptions[0]);
    }
  }, [violationStatus]);

  // ── Driver combobox click-outside ────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (driverRef.current && !driverRef.current.contains(e.target as Node)) {
        setDriverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function selectDriver(licNum: string, name: string) {
    setLicenseNumber(licNum);
    setDriverQuery(name);
    setDriverOpen(false);
    setPlateNumber('');
    setRegistrationNumber('');
    setErrors((prev) => ({ ...prev, licenseNumber: '' }));
    // Regenerate UOVR with city prefix if city already set
    if (!isEdit && violationDate) {
      setUovrNumber(generateUovrNumber(city || 'M', violationDate));
    }
  }

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setErrors((prev) => ({ ...prev, city: '' }));
    // Regenerate UOVR prefix if date is set
    if (!isEdit && violationDate) {
      setUovrNumber(generateUovrNumber(newCity || 'M', violationDate));
    }
  }

  function handleRegionFill(newRegion: string) {
    if (newRegion) {
      setRegion(newRegion);
      setErrors((prev) => ({ ...prev, region: '' }));
    }
  }

  // ── TypeRow handlers ─────────────────────────────────────────────────────
  function addTypeRow() {
    setTypeRows((prev) => [...prev, blankRow()]);
  }

  function removeTypeRow(id: number) {
    setTypeRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  }

  function updateTypeRowType(id: number, type: ViolationTypeEnum | '', label: string) {
    setTypeRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, violation_type: type, base_fine: type ? (FINE_SCHEDULE[type] ?? 0) : 0, query: label }
          : r
      )
    );
  }

  function updateTypeRowOpen(id: number, open: boolean) {
    setTypeRows((prev) => prev.map((r) => r.id === id ? { ...r, open } : r));
  }

  function updateTypeRowQuery(id: number, query: string) {
    setTypeRows((prev) => prev.map((r) => r.id === id ? { ...r, query } : r));
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!uovrNumber.trim()) e.uovrNumber   = 'UOVR Number is required.';
    if (!violationDate)     e.violationDate = 'Date is required.';
    if (!city.trim())       e.city          = 'City is required.';
    if (!region.trim())     e.region        = 'Region is required.';
    if (!licenseNumber)     e.licenseNumber = 'Driver is required.';
    if (!plateNumber)       e.plateNumber   = 'Vehicle is required.';
    const hasType = typeRows.some((r) => r.violation_type !== '');
    if (!hasType)           e.typeRows      = 'At least one violation type is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const dto: CreateViolationDTO = {
      uovr_number:               uovrNumber.trim(),
      officer:                   officer.trim() || undefined,
      violation_status:          violationStatus,
      violation_location_city:   city.trim(),
      violation_location_region: region.trim(),
      violation_date:            violationDate,
      payment_status:            paymentStatus,
      license_number:            licenseNumber,
      plate_number:              plateNumber,
      registration_number:       registrationNumber || undefined,
      violation_types:           typeRows
        .filter((r): r is TypeRow & { violation_type: ViolationTypeEnum } => r.violation_type !== '')
        .map((r) => r.violation_type),
    };
    onSubmit(dto);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form
      id="violation-form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-6"
    >

      {saveError && (
        <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
          {saveError}
        </div>
      )}

      {/* ── Section 1: Incident details ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* UOVR Number with auto-generate */}
        <div>
          <label className={labelBase}>UOVR Number *</label>
          <div className="flex gap-2">
            <input
              className={[
                inputBase,
                'font-mono flex-1',
                isEdit ? inputDisabled : '',
                errors.uovrNumber ? inputError : '',
              ].join(' ')}
              value={uovrNumber}
              onChange={(e) => {
                setUovrNumber(e.target.value);
                setErrors((prev) => ({ ...prev, uovrNumber: '' }));
              }}
              placeholder="M25-0000001-1"
              readOnly={isEdit}
            />
            {!isEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateUovr}
                disabled={!violationDate}
                title="Regenerate UOVR number"
              >
                ↺
              </Button>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className={labelBase}>Date *</label>
          <input
            type="date"
            className={[inputBase, errors.violationDate ? inputError : ''].join(' ')}
            value={violationDate}
            onChange={(e) => {
              setViolationDate(e.target.value);
              setErrors((prev) => ({ ...prev, violationDate: '' }));
              // Trigger UOVR suggestion once date is set for the first time
              if (!uovrSuggested && e.target.value) {
                setUovrNumber(generateUovrNumber(city || 'M', e.target.value));
                setUovrSuggested(true);
              }
            }}
          />
          <FieldError errors={errors} field="violationDate" />
        </div>

        {/* City, searchable combobox that auto-fills region */}
        <div>
          <label className={labelBase}>City *</label>
          <CityCombobox
            value={city}
            onChange={handleCityChange}
            onRegion={handleRegionFill}
            error={!!errors.city}
          />
          <FieldError errors={errors} field="city" />
        </div>

        {/* Region, auto-filled, still editable */}
        <div>
          <label className={labelBase}>Region *</label>
          <input
            className={[inputBase, errors.region ? inputError : ''].join(' ')}
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setErrors((prev) => ({ ...prev, region: '' }));
            }}
            placeholder="e.g. NCR"
          />
        </div>

        {/* Officer */}
        <div className="col-span-2">
          <label className={labelBase}>Officer</label>
          <input
            className={inputBase}
            value={officer}
            onChange={(e) => setOfficer(e.target.value)}
            placeholder="e.g. PO1 Santos (optional)"
          />
        </div>
      </div>

      {/* ── Section 2: Status, filtered to only valid combos ───────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Violation Status *</label>
          <select
            className={inputBase}
            value={violationStatus}
            onChange={(e) => setViolationStatus(e.target.value as ViolationStatus)}
          >
            {VIOLATION_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelBase}>Payment Status *</label>
          <select
            className={inputBase}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
          >
            {/* Only render options that are legal for the current violation status */}
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} disabled={!validPaymentOptions.includes(s)}>
                {s}{!validPaymentOptions.includes(s) ? ' (not allowed)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-faint">
            {violationStatus === ViolationStatus.Pending   && 'Pending violations must be Unpaid.'}
            {violationStatus === ViolationStatus.Contested && 'Contested violations must be Unpaid.'}
            {violationStatus === ViolationStatus.Resolved  && 'Resolved violations must be Paid or Waived.'}
            {violationStatus === ViolationStatus.Dismissed && 'Dismissed violations must be Waived.'}
          </p>
        </div>
      </div>

      {/* ── Section 3: Driver / vehicle / registration ───────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Driver combobox */}
        <div ref={driverRef} className="relative">
          <label className={labelBase}>Driver * (search by name or license number)</label>
          <input
            className={[inputBase, errors.licenseNumber ? inputError : ''].join(' ')}
            value={driverQuery}
            onChange={(e) => {
              setDriverQuery(e.target.value);
              setDriverOpen(true);
              setLicenseNumber('');
              setPlateNumber('');
              setRegistrationNumber('');
            }}
            onFocus={() => setDriverOpen(true)}
            placeholder="Search driver…"
            autoComplete="off"
          />
          <FieldError errors={errors} field="licenseNumber" />
          {driverOpen && filteredDrivers.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredDrivers.map((d) => (
                <li key={d.license_number}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface-inset flex justify-between gap-4"
                    onClick={() => selectDriver(d.license_number, getFullName(d))}
                  >
                    <span className="text-ink">{getFullName(d)}</span>
                    <span className="text-ink-faint font-mono text-xs shrink-0">{d.license_number}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Vehicle, filtered to driver */}
        <div>
          <label className={labelBase}>Vehicle * (auto-filtered to selected driver)</label>
          <select
            className={[inputBase, !licenseNumber ? inputDisabled : '', errors.plateNumber ? inputError : ''].join(' ')}
            value={plateNumber}
            onChange={(e) => {
              setPlateNumber(e.target.value);
              setRegistrationNumber('');
              setErrors((prev) => ({ ...prev, plateNumber: '' }));
            }}
            disabled={!licenseNumber}
          >
            <option value="">{licenseNumber ? 'Select vehicle…' : 'Select a driver first'}</option>
            {vehiclesForDriver.map((v) => (
              <option key={v.plate_number} value={v.plate_number}>
                {v.plate_number} — {v.make} {v.model} ({v.year})
              </option>
            ))}
          </select>
          <FieldError errors={errors} field="plateNumber" />
        </div>

        {/* Registration, filtered to vehicle, optional */}
        <div>
          <label className={labelBase}>Registration (optional, auto-filtered to selected vehicle)</label>
          <select
            className={[inputBase, !plateNumber ? inputDisabled : ''].join(' ')}
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            disabled={!plateNumber}
          >
            <option value="">{plateNumber ? 'None' : 'Select a vehicle first'}</option>
            {registrationsForVehicle.map((r) => (
              <option key={r.registration_number} value={r.registration_number}>
                {r.registration_number} ({r.registration_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Section 4: Violation types, searchable combobox per row ─────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink-muted">Violation Types *</label>
          <Button variant="ghost" size="sm" onClick={addTypeRow}>+ Add Type</Button>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-surface-inset">
                <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Violation Type
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-ink-muted uppercase tracking-wide w-32">
                  Base Fine
                </th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {typeRows.map((row) => {
                const usedTypes = new Set(
                  typeRows
                    .filter((r) => r.id !== row.id)
                    .map((r) => r.violation_type)
                    .filter(Boolean)
                ) as Set<ViolationTypeEnum | ''>;

                return (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <ViolationTypeCombobox
                        row={row}
                        usedTypes={usedTypes}
                        onChange={updateTypeRowType}
                        onOpen={updateTypeRowOpen}
                        onQuery={updateTypeRowQuery}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-ink whitespace-nowrap">
                      {row.base_fine > 0 ? `₱${row.base_fine.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeTypeRow(row.id)}
                        disabled={typeRows.length === 1}
                        className="text-ink-faint hover:text-danger-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove row"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-surface-inset border-t border-border">
                <td className="px-3 py-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Total Fine
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-ink whitespace-nowrap">
                  ₱{totalFine.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <FieldError errors={errors} field="typeRows" />
      </div>

      {!hideFooter && (
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Violation'}
          </Button>
        </div>
      )}

    </form>
  );
}