import { useEffect, useState } from 'react';
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

interface DriverFormProps {
  open:       boolean;
  onClose:    () => void;
  onSubmit:   (data: CreateDriverDTO) => void;
  initial?:   DriverWithAge | Driver | null;
  saveError?: string | null;
  saving?:    boolean;
}

type FormState = {
  first_name:         string;
  last_name:          string;
  middle_name:        string;
  birth_date:         string;
  sex:                Sex;
  address:            string;
  license_number:     string;
  license_type:       LicenseType;
  license_status:     LicenseStatus;
  license_issue_date: string;
};

const EMPTY: FormState = {
  first_name:         '',
  last_name:          '',
  middle_name:        '',
  birth_date:         '',
  sex:                Sex.Male,
  address:            '',
  license_number:     '',
  license_type:       LicenseType.NonProfessional,
  license_status:     LicenseStatus.Active,
  license_issue_date: '',
};

function toFormState(d: Driver | DriverWithAge): FormState {
  return {
    first_name:         d.first_name,
    last_name:          d.last_name,
    middle_name:        d.middle_name ?? '',
    birth_date:         d.birth_date,
    sex:                d.sex,
    address:            d.address,
    license_number:     d.license_number,
    license_type:       d.license_type,
    license_status:     d.license_status,
    license_issue_date: d.license_issue_date,
  };
}

function computeExpiry(birthDate: string, licenseType: LicenseType, issueDate: string): string {
  if (!issueDate) return '';
  const issue = new Date(issueDate);
  if (isNaN(issue.getTime())) return '';

  if (licenseType === LicenseType.StudentPermit) {
    const expiry = new Date(issueDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString().slice(0, 10);
  }

  if (!birthDate) return '';
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return '';

  const expiryYear = issue.getFullYear() + 5;
  const month = dob.getMonth(); // 0-indexed
  let day   = dob.getDate();

  // Feb 29, if birth month/day doesn't exist in expiry year, fall back to Feb 28
  if (month === 1 && day === 29) {
    const isLeap = new Date(expiryYear, 1, 29).getMonth() === 1;
    if (!isLeap) day = 28;
  }

  const expiry = new Date(expiryYear, month, day);
  return expiry.toISOString().slice(0, 10);
}

function getAgeFromBirthDate(birthDate: string): number {
  if (!birthDate) return 0;
  const dob = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
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

export default function DriverForm({ open, onClose, onSubmit, initial, saveError, saving }: DriverFormProps) {
  const isEdit = !!initial;
  const [form, setForm]     = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldError>({});

  useEffect(() => {
    if (open) {
      setForm(initial ? toFormState(initial) : EMPTY);
      setErrors({});
    }
  }, [open, initial]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const e: FieldError = {};

    if (!form.first_name.trim())     e.first_name         = 'Required';
    if (!form.last_name.trim())      e.last_name          = 'Required';
    if (!form.birth_date)            e.birth_date         = 'Required';
    if (!form.address.trim())        e.address            = 'Required';
    if (!form.license_number.trim()) e.license_number     = 'Required';
    if (!form.license_issue_date)    e.license_issue_date = 'Required';

    if (form.birth_date) {
      const age    = getAgeFromBirthDate(form.birth_date);
      const minAge = MIN_AGE_FOR_LICENSE[form.license_type];
      if (age < minAge) {
        e.birth_date = `Must be at least ${minAge} years old for ${form.license_type}`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      first_name:         form.first_name.trim(),
      last_name:          form.last_name.trim(),
      middle_name:        form.middle_name.trim() || null,
      birth_date:         form.birth_date,
      sex:                form.sex,
      address:            form.address.trim(),
      license_number:     form.license_number.trim(),
      license_type:       form.license_type,
      license_status:     form.license_status,
      license_issue_date: form.license_issue_date,
    });
  }

  const computedExpiry = computeExpiry(form.birth_date, form.license_type, form.license_issue_date);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Driver' : 'Add Driver'}
      size="lg"
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
          <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            {saveError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <label className={labelBase}>First Name <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.first_name ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            placeholder="Juan"
          />
          {errors.first_name && <p className="mt-1 text-xs text-danger-500">{errors.first_name}</p>}
        </div>

        <div>
          <label className={labelBase}>Last Name <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.last_name ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            placeholder="dela Cruz"
          />
          {errors.last_name && <p className="mt-1 text-xs text-danger-500">{errors.last_name}</p>}
        </div>

        <div>
          <label className={labelBase}>Middle Name</label>
          <input
            className={inputBase}
            value={form.middle_name}
            onChange={(e) => set('middle_name', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className={labelBase}>Birth Date <span className="text-danger-500">*</span></label>
          <input
            type="date"
            className={[inputBase, errors.birth_date ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.birth_date}
            onChange={(e) => set('birth_date', e.target.value)}
          />
          {errors.birth_date && <p className="mt-1 text-xs text-danger-500">{errors.birth_date}</p>}
        </div>

        <div>
          <label className={labelBase}>Sex <span className="text-danger-500">*</span></label>
          <select
            className={inputBase}
            value={form.sex}
            onChange={(e) => set('sex', e.target.value as Sex)}
          >
            <option value={Sex.Male}>Male</option>
            <option value={Sex.Female}>Female</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelBase}>Address <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, errors.address ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="House No., Street, City"
          />
          {errors.address && <p className="mt-1 text-xs text-danger-500">{errors.address}</p>}
        </div>

        <div className="sm:col-span-2 border-t border-border pt-4 mt-1">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">License Information</p>
        </div>

        <div>
          <label className={labelBase}>License Number <span className="text-danger-500">*</span></label>
          <input
            className={[inputBase, 'font-mono', errors.license_number ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.license_number}
            onChange={(e) => set('license_number', e.target.value)}
            placeholder="N01-23-100001"
            disabled={isEdit}
          />
          {errors.license_number && <p className="mt-1 text-xs text-danger-500">{errors.license_number}</p>}
        </div>

        <div>
          <label className={labelBase}>License Type <span className="text-danger-500">*</span></label>
          <select
            className={inputBase}
            value={form.license_type}
            onChange={(e) => set('license_type', e.target.value as LicenseType)}
          >
            {LICENSE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelBase}>License Status <span className="text-danger-500">*</span></label>
          <select
            className={inputBase}
            value={form.license_status}
            onChange={(e) => set('license_status', e.target.value as LicenseStatus)}
          >
            {LICENSE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelBase}>Issue Date <span className="text-danger-500">*</span></label>
          <input
            type="date"
            className={[inputBase, errors.license_issue_date ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-100' : ''].join(' ')}
            value={form.license_issue_date}
            onChange={(e) => set('license_issue_date', e.target.value)}
          />
          {errors.license_issue_date && <p className="mt-1 text-xs text-danger-500">{errors.license_issue_date}</p>}
        </div>

        <div>
          <label className={labelBase}>Expiry Date</label>
          <input
            className={[inputBase, 'bg-surface-inset text-ink-muted cursor-not-allowed'].join(' ')}
            value={computedExpiry}
            readOnly
            disabled
            placeholder="Auto-computed from birth date"
          />
          <p className="mt-1 text-xs text-ink-faint">Auto-computed by trigger</p>
        </div>
      </div>
      </div>
    </Modal>
  );
}