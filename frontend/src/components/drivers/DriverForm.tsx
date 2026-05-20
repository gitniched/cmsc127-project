import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Driver, DriverWithAge, CreateDriverDTO } from '@shared/types/driver.types';
import { LicenseType, LicenseStatus } from '../../constants/enums';
import {
  Sex,
  LICENSE_TYPE_OPTIONS,
  LICENSE_STATUS_OPTIONS,
  MIN_AGE_FOR_LICENSE,
} from '../../constants/enums';

interface CityEntry {
  city: string;
  province: string;
  region: string;
}

const PH_CITIES: CityEntry[] = [
  // NCR
  { city: 'Manila', province: 'Metro Manila', region: 'NCR' },
  { city: 'Quezon City', province: 'Metro Manila', region: 'NCR' },
  { city: 'Caloocan', province: 'Metro Manila', region: 'NCR' },
  { city: 'Pasig', province: 'Metro Manila', region: 'NCR' },
  { city: 'Taguig', province: 'Metro Manila', region: 'NCR' },
  { city: 'Makati', province: 'Metro Manila', region: 'NCR' },
  { city: 'Mandaluyong', province: 'Metro Manila', region: 'NCR' },
  { city: 'Marikina', province: 'Metro Manila', region: 'NCR' },
  { city: 'Parañaque', province: 'Metro Manila', region: 'NCR' },
  { city: 'Las Piñas', province: 'Metro Manila', region: 'NCR' },
  { city: 'Muntinlupa', province: 'Metro Manila', region: 'NCR' },
  { city: 'Valenzuela', province: 'Metro Manila', region: 'NCR' },
  { city: 'Malabon', province: 'Metro Manila', region: 'NCR' },
  { city: 'Navotas', province: 'Metro Manila', region: 'NCR' },
  { city: 'Pasay', province: 'Metro Manila', region: 'NCR' },
  { city: 'Pateros', province: 'Metro Manila', region: 'NCR' },
  // CAR
  { city: 'Baguio City', province: 'Benguet', region: 'CAR' },
  // Region I
  { city: 'San Fernando', province: 'La Union', region: 'Region I' },
  { city: 'Dagupan', province: 'Pangasinan', region: 'Region I' },
  { city: 'Laoag', province: 'Ilocos Norte', region: 'Region I' },
  { city: 'Vigan', province: 'Ilocos Sur', region: 'Region I' },
  // Region II
  { city: 'Tuguegarao', province: 'Cagayan', region: 'Region II' },
  { city: 'Santiago', province: 'Isabela', region: 'Region II' },
  // Region III
  { city: 'Angeles City', province: 'Pampanga', region: 'Region III' },
  { city: 'Olongapo', province: 'Zambales', region: 'Region III' },
  { city: 'Malolos', province: 'Bulacan', region: 'Region III' },
  { city: 'Meycauayan', province: 'Bulacan', region: 'Region III' },
  { city: 'Cabanatuan', province: 'Nueva Ecija', region: 'Region III' },
  { city: 'San Jose del Monte', province: 'Bulacan', region: 'Region III' },
  // Region IV-A
  { city: 'Antipolo', province: 'Rizal', region: 'Region IV-A' },
  { city: 'Calamba', province: 'Laguna', region: 'Region IV-A' },
  { city: 'Santa Rosa', province: 'Laguna', region: 'Region IV-A' },
  { city: 'Bacoor', province: 'Cavite', region: 'Region IV-A' },
  { city: 'Imus', province: 'Cavite', region: 'Region IV-A' },
  { city: 'Dasmariñas', province: 'Cavite', region: 'Region IV-A' },
  // Region V
  { city: 'Legazpi', province: 'Albay', region: 'Region V' },
  { city: 'Naga', province: 'Camarines Sur', region: 'Region V' },
  // Region VI
  { city: 'Iloilo City', province: 'Iloilo', region: 'Region VI' },
  { city: 'Bacolod', province: 'Negros Occidental', region: 'Region VI' },
  // Region VII
  { city: 'Cebu City', province: 'Cebu', region: 'Region VII' },
  { city: 'Lapu-Lapu', province: 'Cebu', region: 'Region VII' },
  { city: 'Mandaue', province: 'Cebu', region: 'Region VII' },
  { city: 'Tagbilaran', province: 'Bohol', region: 'Region VII' },
  // Region VIII
  { city: 'Tacloban', province: 'Leyte', region: 'Region VIII' },
  // Region IX
  { city: 'Zamboanga City', province: 'Zamboanga del Sur', region: 'Region IX' },
  // Region X
  { city: 'Cagayan de Oro', province: 'Misamis Oriental', region: 'Region X' },
  { city: 'Iligan', province: 'Lanao del Norte', region: 'Region X' },
  // Region XI
  { city: 'Davao City', province: 'Davao del Sur', region: 'Region XI' },
  { city: 'Tagum', province: 'Davao del Norte', region: 'Region XI' },
  // Region XII
  { city: 'General Santos', province: 'South Cotabato', region: 'Region XII' },
  { city: 'Cotabato City', province: 'Maguindanao', region: 'Region XII' },
  // Region XIII
  { city: 'Butuan', province: 'Agusan del Norte', region: 'Region XIII' },
].sort((a, b) => a.city.localeCompare(b.city));

function computeExpiry(birthDate: string, licenseType: LicenseType, issueDate: string): string {
  if (!issueDate) return '';
  const issue = new Date(issueDate);
  if (isNaN(issue.getTime())) return '';

  if (licenseType === LicenseType.StudentPermit) {
    const expiryYear = issue.getUTCFullYear() + 1;
    const mm = String(issue.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(issue.getUTCDate()).padStart(2, '0');
    return `${expiryYear}-${mm}-${dd}`;
  }

  if (!birthDate) return '';
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return '';

  const expiryYear = issue.getUTCFullYear() + 5;
  let month = dob.getUTCMonth();
  let day   = dob.getUTCDate();

  if (month === 1 && day === 29) {
    const isLeap = new Date(Date.UTC(expiryYear, 1, 29)).getUTCMonth() === 1;
    if (!isLeap) day = 28;
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${expiryYear}-${mm}-${dd}`;
}

function generateLicenseNumber(licenseType: LicenseType, issueDate: string): string {
  if (!issueDate) return '';
  const prefix =
    licenseType === LicenseType.StudentPermit ? 'S' :
      licenseType === LicenseType.Professional ? 'P' : 'N';
  const yy = issueDate.slice(2, 4);
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `${prefix}01-${yy}-${seq}`;
}

function getAge(birthDate: string): number {
  if (!birthDate) return 0;
  const dob = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function expiryRelativeLabel(expiryDateStr: string): string {
  if (!expiryDateStr) return '';
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  const isPast = expiry < today;
  const ref = isPast ? today : expiry;
  const base = isPast ? expiry : today;
  let years = ref.getFullYear() - base.getFullYear();
  let months = ref.getMonth() - base.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months !== 1 ? 's' : ''}`);
  if (parts.length === 0) parts.push('less than a month');
  return isPast
    ? `expired ${parts.join(' ')} ago`
    : `expires in ${parts.join(' ')}`;
}

const LICENSE_RANK: Record<LicenseType, number> = {
  [LicenseType.StudentPermit]: 0,
  [LicenseType.NonProfessional]: 1,
  [LicenseType.Professional]: 2,
};

const glassInput: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.45)',
  borderColor: 'rgba(226, 232, 240, 0.9)',
};
const glassInputDisabled: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.2)',
  borderColor: 'rgba(226, 232, 240, 0.7)',
  cursor: 'not-allowed',
};

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const inputErr = 'border-danger-400 focus:border-danger-400 focus:ring-danger-100';
const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-danger-500">{msg}</p> : null;
}

interface AddressComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

function AddressCombobox({ value, onChange, error }: AddressComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const cityQuery = useMemo(() => {
    const parts = value.split(',');
    return parts[parts.length - 1].trim();
  }, [value]);

  const filtered = useMemo(() => {
    const q = cityQuery.toLowerCase();
    if (!q) return PH_CITIES.slice(0, 30);
    return PH_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [cityQuery]);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !portalRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(entry: CityEntry) {
    const parts = value.split(',');
    const street = parts.slice(0, -1).join(',').trim();
    const newVal = street ? `${street}, ${entry.city}` : entry.city;
    onChange(newVal);
    setOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
      const len = newVal.length;
      inputRef.current?.setSelectionRange(len, len);
    }, 0);
  }

  const dropdown = open && rect && filtered.length > 0
    ? (
      <div
        ref={portalRef}
        style={{
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
          maxHeight: '12rem',
          overflowY: 'auto',
        }}
        className="bg-surface border border-border rounded-md shadow-xl"
      >
        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-ink-muted uppercase tracking-wide bg-surface-inset sticky top-0">
          Known cities / municipalities
        </p>
        {filtered.map((entry) => (
          <button
            key={entry.city}
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm text-ink hover:bg-surface-inset flex justify-between gap-3"
            onMouseDown={() => handleSelect(entry)}
          >
            <span>{entry.city}</span>
            <span className="text-xs text-ink-faint shrink-0">{entry.province} · {entry.region}</span>
          </button>
        ))}
      </div>
    )
    : null;

  return (
    <>
      <input
        ref={inputRef}
        className={[inputBase, error ? inputErr : ''].join(' ')}
        style={glassInput}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="House No., Street, City"
        autoComplete="off"
      />
      {open && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}

interface DriverFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDriverDTO) => void;
  initial?: DriverWithAge | Driver | null;
  saveError?: string | null;
  saving?: boolean;
}

type FormState = {
  first_name: string;
  last_name: string;
  middle_name: string;
  birth_date: string;
  sex: Sex;
  address: string;
  license_number: string;
  license_type: LicenseType;
  license_status: LicenseStatus;
  license_issue_date: string;
};

const EMPTY: FormState = {
  first_name: '',
  last_name: '',
  middle_name: '',
  birth_date: '',
  sex: Sex.Male,
  address: '',
  license_number: '',
  license_type: LicenseType.NonProfessional,
  license_status: LicenseStatus.Active,
  license_issue_date: '',
};

function toFormState(d: Driver | DriverWithAge): FormState {
  return {
    first_name: d.first_name,
    last_name: d.last_name,
    middle_name: d.middle_name ?? '',
    birth_date: d.birth_date,
    sex: d.sex,
    address: d.address,
    license_number: d.license_number,
    license_type: d.license_type,
    license_status: d.license_status,
    license_issue_date: d.license_issue_date,
  };
}

export default function DriverForm({ open, onClose, onSubmit, initial, saveError, saving }: DriverFormProps) {
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [originalLicenseType, setOriginalLicenseType] = useState<LicenseType | null>(null);

  useEffect(() => {
    if (open) {
      const state = initial ? toFormState(initial) : EMPTY;
      setForm(state);
      setErrors({});
      setOriginalLicenseType(initial ? initial.license_type : null);
    }
  }, [open, initial]);

  useEffect(() => {
    if (isEdit || !open) return;
    if (form.license_issue_date) {
      setForm((prev) => ({
        ...prev,
        license_number: generateLicenseNumber(prev.license_type, prev.license_issue_date),
      }));
    }
  }, [form.license_type, form.license_issue_date, isEdit, open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function regenerate() {
    const s = generateLicenseNumber(form.license_type, form.license_issue_date);
    if (s) set('license_number', s);
  }

  const age = getAge(form.birth_date);
  const minAge = MIN_AGE_FOR_LICENSE[form.license_type];
  const ageOk = !form.birth_date || age >= minAge;
  const ageMargin = form.birth_date ? age - minAge : null; // years above minimum

  const computedExpiry = computeExpiry(form.birth_date, form.license_type, form.license_issue_date);
  const expiryRelative = expiryRelativeLabel(computedExpiry);

  const isDowngrade = isEdit &&
    originalLicenseType !== null &&
    LICENSE_RANK[form.license_type] < LICENSE_RANK[originalLicenseType];

  const issueFuture = form.license_issue_date
    ? new Date(form.license_issue_date) > new Date()
    : false;

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.birth_date) e.birth_date = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.license_number.trim()) e.license_number = 'Required';
    if (!form.license_issue_date) e.license_issue_date = 'Required';

    if (form.birth_date && !ageOk) {
      e.birth_date = `Must be at least ${minAge} years old for ${form.license_type}`;
    }
    if (issueFuture) {
      e.license_issue_date = 'Issue date cannot be in the future';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name.trim() || null,
      birth_date: form.birth_date,
      sex: form.sex,
      address: form.address.trim(),
      license_number: form.license_number.trim(),
      license_type: form.license_type,
      license_status: form.license_status,
      license_issue_date: form.license_issue_date,
    });
  }

  function AgeBadge() {
    if (!form.birth_date) return null;
    if (!ageOk) return null; // error state handled by FieldErr
    const color =
      ageMargin !== null && ageMargin <= 1
        ? 'bg-warning-50 border-warning-200 text-warning-700'
        : 'bg-surface-inset border-border text-ink-muted';
    return (
      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-xs font-medium ${color}`}>
        {age} yrs old
        {ageMargin !== null && ageMargin <= 1 && (
          <span> · only {ageMargin === 0 ? 'just meets' : `${ageMargin} yr above`} minimum</span>
        )}
      </span>
    );
  }

  function ExpiryBadge() {
    if (!computedExpiry) return null;
    const past = new Date(computedExpiry) < new Date();
    const color = past
      ? 'bg-danger-50 border-danger-200 text-danger-700'
      : 'bg-surface-inset border-border text-ink-muted';
    return (
      <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full border text-xs font-medium ${color}`}>
        {expiryRelative}
      </span>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Driver' : 'Add Driver'}
      size="lg"
      className={isEdit ? 'h-[610px]' : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Driver'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">

        {saveError && (
          <div className="rounded-md bg-danger-50/60 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <label className={labelBase}>First Name <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.first_name ? inputErr : ''].join(' ')}
              style={glassInput}
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              placeholder="Juan"
            />
            <FieldErr msg={errors.first_name} />
          </div>

          <div>
            <label className={labelBase}>Last Name <span className="text-danger-500">*</span></label>
            <input
              className={[inputBase, errors.last_name ? inputErr : ''].join(' ')}
              style={glassInput}
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              placeholder="dela Cruz"
            />
            <FieldErr msg={errors.last_name} />
          </div>

          <div>
            <label className={labelBase}>Middle Name</label>
            <input
              className={inputBase}
              style={glassInput}
              value={form.middle_name}
              onChange={(e) => set('middle_name', e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={labelBase}>Sex <span className="text-danger-500">*</span></label>
            <select
              className={inputBase}
              style={glassInput}
              value={form.sex}
              onChange={(e) => set('sex', e.target.value as Sex)}
            >
              <option value={Sex.Male}>Male</option>
              <option value={Sex.Female}>Female</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelBase}>Birth Date <span className="text-danger-500">*</span></label>
            <input
              type="date"
              className={[inputBase, errors.birth_date ? inputErr : ''].join(' ')}
              style={glassInput}
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <AgeBadge />
              {errors.birth_date && <p className="mt-1 text-xs text-danger-500">{errors.birth_date}</p>}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelBase}>Address <span className="text-danger-500">*</span></label>
            <AddressCombobox
              value={form.address}
              onChange={(val) => set('address', val)}
              error={!!errors.address}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Type street first, then ", City", or type the city name to pick from the list
            </p>
            <FieldErr msg={errors.address} />
          </div>

          <div
            className="sm:col-span-2 pt-4 mt-1"
            style={{ borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}
          >
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
              License Information
            </p>
          </div>
          <div>
            <label className={labelBase}>License Number <span className="text-danger-500">*</span></label>
            <div className="flex gap-2">
              <input
                className={[inputBase, 'font-mono flex-1', errors.license_number ? inputErr : ''].join(' ')}
                style={isEdit ? glassInputDisabled : glassInput}
                value={form.license_number}
                onChange={(e) => set('license_number', e.target.value)}
                placeholder="N01-23-100001"
                disabled={isEdit}
              />
              {!isEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerate}
                  disabled={!form.license_issue_date}
                  title="Generate a new suggestion"
                >
                  ↺
                </Button>
              )}
            </div>
            {isEdit && (
              <p className="mt-1 text-xs text-ink-faint">
                Primary key, cannot be changed after creation
              </p>
            )}
            {!isEdit && form.license_issue_date && (
              <p className="mt-1 text-xs text-ink-faint">
                Auto-suggested, edit freely or click ↺ to regenerate
              </p>
            )}
            {!isEdit && !form.license_issue_date && (
              <p className="mt-1 text-xs text-ink-faint">
                Set the issue date first to auto-generate
              </p>
            )}
            <FieldErr msg={errors.license_number} />
          </div>

          <div>
            <label className={labelBase}>License Type <span className="text-danger-500">*</span></label>
            <select
              className={inputBase}
              style={glassInput}
              value={form.license_type}
              onChange={(e) => set('license_type', e.target.value as LicenseType)}
            >
              {LICENSE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {isDowngrade && (
              <p className="mt-1 text-xs text-warning-600">
                ⚠ Downgrading from {originalLicenseType}, confirm this is intentional
              </p>
            )}
          </div>

          <div>
            <label className={labelBase}>License Status <span className="text-danger-500">*</span></label>
            <select
              className={inputBase}
              style={glassInput}
              value={form.license_status}
              onChange={(e) => set('license_status', e.target.value as LicenseStatus)}
            >
              {LICENSE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {form.license_status === LicenseStatus.Revoked && (
              <p className="mt-1 text-xs text-danger-600">
                Revoked licenses cannot be renewed via the system
              </p>
            )}
            {form.license_status === LicenseStatus.Suspended && (
              <p className="mt-1 text-xs text-warning-600">
                Suspension must be served before renewal is allowed
              </p>
            )}
          </div>

          <div>
            <label className={labelBase}>Issue Date <span className="text-danger-500">*</span></label>
            <input
              type="date"
              className={[inputBase, errors.license_issue_date ? inputErr : ''].join(' ')}
              style={glassInput}
              value={form.license_issue_date}
              onChange={(e) => set('license_issue_date', e.target.value)}
            />
            <FieldErr msg={errors.license_issue_date} />
          </div>

          <div>
            <label className={labelBase}>Expiry Date</label>
            <input
              className={[inputBase, 'text-ink-muted'].join(' ')}
              style={glassInputDisabled}
              value={computedExpiry}
              readOnly
              disabled
              placeholder="Set issue date to compute"
            />
            <div className="flex items-center gap-2">
              <ExpiryBadge />
              {!computedExpiry && (
                <p className="mt-1 text-xs text-ink-faint">Auto-computed by trigger</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}