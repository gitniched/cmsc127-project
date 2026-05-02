import { useEffect, useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { CreateRegistrationDTO } from '@shared/types/registration.types';
import { getRenewalMonthFromPlate, MONTH_NAMES } from '@shared/types/registration.types';
import { RegistrationStatus, REGISTRATION_STATUS_OPTIONS } from '../../constants/enums';

interface RegistrationFormProps {
  open:        boolean;
  onClose:     () => void;
  onSubmit:    (data: CreateRegistrationDTO) => void;
  plateNumber: string;
}

type FormState = {
  registration_number: string;
  registration_date:   string;
  registration_status: RegistrationStatus;
};

const makeEmpty = (): FormState => ({
  registration_number: '',
  registration_date:   new Date().toISOString().slice(0, 10),
  registration_status: RegistrationStatus.Active,
});

// ---------------------------------------------------------------------------
// Registration number helpers
// Format from README / seed data: REG-YYYY-NNN
// ---------------------------------------------------------------------------
const REG_NUMBER_RE = /^REG-\d{4}-\d{3,}$/;

function generateRegistrationNumber(registrationDate: string): string {
  const year = registrationDate ? registrationDate.slice(0, 4) : String(new Date().getFullYear());
  const seq  = String(Math.floor(Math.random() * 900) + 100);
  return `REG-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// Expiry computation — mirrors trg_registration_before_insert exactly:
//   MONTH(reg_date) <= renewal_month  → year + 1
//   MONTH(reg_date) >  renewal_month  → year + 2
//   non-numeric plate ending          → reg_date + 1 year (flat)
// Returns a human-readable label; the DB trigger is the authoritative source.
// ---------------------------------------------------------------------------
function computeExpiryLabel(plateNumber: string, registrationDate: string): string {
  if (!registrationDate) return 'Set a registration date to preview';

  const renewalMonth = getRenewalMonthFromPlate(plateNumber);

  if (!renewalMonth) {
    const flat = new Date(registrationDate);
    flat.setFullYear(flat.getFullYear() + 1);
    return `${flat.toISOString().slice(0, 7)} — 12 months flat (non-numeric plate ending)`;
  }

  const regDate    = new Date(registrationDate);
  const regMonth   = regDate.getMonth() + 1;
  const regYear    = regDate.getFullYear();
  const expiryYear = regMonth <= renewalMonth ? regYear + 1 : regYear + 2;

  const lastDay = new Date(expiryYear, renewalMonth, 0).getDate();
  return `${MONTH_NAMES[renewalMonth]} ${lastDay}, ${expiryYear} (last day of renewal month)`;
}

// ---------------------------------------------------------------------------
// Style tokens
// ---------------------------------------------------------------------------
const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const inputReadOnly = [
  'h-9 px-3 text-sm rounded-md w-full flex items-center',
  'bg-surface-inset border border-border text-ink-muted',
  'cursor-not-allowed select-none text-sm',
].join(' ');

const inputErr  = 'border-danger-400 focus:border-danger-400 focus:ring-danger-100';
const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

interface FieldError { [key: string]: string; }

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-danger-500">{msg}</p>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegistrationForm({
  open, onClose, onSubmit, plateNumber,
}: RegistrationFormProps) {
  const [form, setForm]     = useState<FormState>(makeEmpty());
  const [errors, setErrors] = useState<FieldError>({});

  useEffect(() => {
    if (open) {
      const empty = makeEmpty();
      setForm({
        ...empty,
        registration_number: generateRegistrationNumber(empty.registration_date),
      });
      setErrors({});
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function regenerate() {
    set('registration_number', generateRegistrationNumber(form.registration_date));
  }

  const regNumberValid = useMemo(
    () => REG_NUMBER_RE.test(form.registration_number.trim()),
    [form.registration_number],
  );

  const expiryLabel = useMemo(
    () => computeExpiryLabel(plateNumber, form.registration_date),
    [plateNumber, form.registration_date],
  );

  const renewalMonth = getRenewalMonthFromPlate(plateNumber);

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.registration_number.trim()) {
      e.registration_number = 'Required';
    } else if (!REG_NUMBER_RE.test(form.registration_number.trim())) {
      e.registration_number = 'Format must be REG-YYYY-NNN';
    }
    if (!form.registration_date) e.registration_date = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      registration_number: form.registration_number.trim(),
      plate_number:        plateNumber,
      registration_date:   form.registration_date,
      registration_status: form.registration_status,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Registration"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add Registration</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">

        {/* ── Vehicle Plate (read-only context) ── */}
        <div>
          <label className={labelBase}>Vehicle Plate</label>
          <div className={inputReadOnly}>
            <span className="font-mono">{plateNumber}</span>
            {renewalMonth && (
              <span className="ml-auto text-xs text-ink-faint">
                renewal month: {MONTH_NAMES[renewalMonth]}
              </span>
            )}
          </div>
        </div>

        {/* ── Registration Number ── */}
        <div>
          <label className={labelBase}>
            Registration Number <span className="text-danger-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              className={[
                inputBase, 'font-mono flex-1',
                errors.registration_number ? inputErr : '',
              ].join(' ')}
              value={form.registration_number}
              onChange={(e) => set('registration_number', e.target.value)}
              placeholder="REG-2026-001"
              autoComplete="off"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerate}
              title="Generate a new suggestion"
            >
              ↺
            </Button>
          </div>
          {errors.registration_number
            ? <FieldErr msg={errors.registration_number} />
            : !regNumberValid && form.registration_number
              ? <p className="mt-1 text-xs text-warning-600">⚠ Format should be REG-YYYY-NNN</p>
              : <p className="mt-1 text-xs text-ink-faint">Edit freely or click ↺ to regenerate</p>
          }
        </div>

        {/* ── Registration Date ── */}
        <div>
          <label className={labelBase}>
            Registration Date <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            className={[inputBase, errors.registration_date ? inputErr : ''].join(' ')}
            value={form.registration_date}
            onChange={(e) => set('registration_date', e.target.value)}
          />
          <FieldErr msg={errors.registration_date} />
        </div>

        {/* ── Expiry Date (computed preview) ── */}
        <div>
          <label className={labelBase}>Expiry Date</label>
          <div className={inputReadOnly}>{expiryLabel}</div>
          <p className="mt-1 text-xs text-ink-faint">
            {renewalMonth
              ? `Plate ends in "${plateNumber.slice(-1)}" → renewal month is ${MONTH_NAMES[renewalMonth]}. Set by DB trigger on save.`
              : 'Non-numeric plate ending → 12 months flat. Set by DB trigger on save.'
            }
          </p>
        </div>

        {/* ── Status ── */}
        <div>
          <label className={labelBase}>Status</label>
          <select
            className={inputBase}
            value={form.registration_status}
            onChange={(e) => set('registration_status', e.target.value as RegistrationStatus)}
          >
            {REGISTRATION_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {form.registration_status === RegistrationStatus.Suspended && (
            <p className="mt-1 text-xs text-warning-600">
              ⚠ Suspended is uncommon for a new registration — confirm this is intentional
            </p>
          )}
        </div>

      </div>
    </Modal>
  );
}