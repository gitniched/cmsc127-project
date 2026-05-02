import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { CreateRegistrationDTO } from '../../types/registration';
import { getRenewalMonthFromPlate, MONTH_NAMES } from '../../types/registration';
import { RegistrationStatus, REGISTRATION_STATUS_OPTIONS } from '../../constants/enums';

interface RegistrationFormProps {
  open:         boolean;
  onClose:      () => void;
  onSubmit:     (data: CreateRegistrationDTO) => void;
  plateNumber:  string;
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

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const inputReadOnly = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface-inset border border-border text-ink-muted',
  'cursor-not-allowed select-none',
].join(' ');

const labelBase = 'block text-xs font-medium text-ink-muted mb-1';

interface FieldError {
  [key: string]: string;
}

function computeExpiryLabel(plateNumber: string, registrationDate: string): string {
  const month = getRenewalMonthFromPlate(plateNumber);
  if (!month) return 'Auto-computed by trigger on save';
  if (!registrationDate) return `End of ${MONTH_NAMES[month]} (auto-computed)`;
  const regYear = new Date(registrationDate).getFullYear();
  const expiryYear = new Date(registrationDate).getMonth() + 1 >= month ? regYear + 1 : regYear;
  return `${MONTH_NAMES[month]} ${expiryYear} (auto-computed by trigger)`;
}

export default function RegistrationForm({ open, onClose, onSubmit, plateNumber }: RegistrationFormProps) {
  const [form, setForm]     = useState<FormState>(makeEmpty());
  const [errors, setErrors] = useState<FieldError>({});

  useEffect(() => {
    if (open) {
      setForm(makeEmpty());
      setErrors({});
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.registration_number.trim()) e.registration_number = 'Required';
    if (!form.registration_date)          e.registration_date   = 'Required';
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

  const expiryLabel = computeExpiryLabel(plateNumber, form.registration_date);

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
        <div>
          <label className={labelBase}>Vehicle Plate</label>
          <div className={inputReadOnly}>
            <span className="font-mono">{plateNumber}</span>
          </div>
        </div>

        <div>
          <label className={labelBase}>
            Registration Number <span className="text-danger-500">*</span>
          </label>
          <input
            className={[
              inputBase,
              'font-mono',
              errors.registration_number
                ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100'
                : '',
            ].join(' ')}
            value={form.registration_number}
            onChange={(e) => set('registration_number', e.target.value)}
            placeholder="REG-2026-001"
          />
          {errors.registration_number && (
            <p className="mt-1 text-xs text-danger-500">{errors.registration_number}</p>
          )}
        </div>

        <div>
          <label className={labelBase}>
            Registration Date <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            className={[
              inputBase,
              errors.registration_date
                ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100'
                : '',
            ].join(' ')}
            value={form.registration_date}
            onChange={(e) => set('registration_date', e.target.value)}
          />
          {errors.registration_date && (
            <p className="mt-1 text-xs text-danger-500">{errors.registration_date}</p>
          )}
        </div>

        <div>
          <label className={labelBase}>Expiry Date</label>
          <div className={inputReadOnly}>{expiryLabel}</div>
          <p className="mt-1 text-xs text-ink-faint">Auto-computed from the plate's last digit</p>
        </div>

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
        </div>
      </div>
    </Modal>
  );
}