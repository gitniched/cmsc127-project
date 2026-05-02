import { useState, useEffect, useMemo, useRef } from 'react';
import type { TrafficViolationFull, CreateViolationDTO } from '../../types/violation';
import {
  ViolationStatus,
  PaymentStatus,
  ViolationTypeEnum,
  VIOLATION_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  VIOLATION_TYPE_OPTIONS,
  INVALID_STATUS_COMBOS,
} from '../../constants/enums';
import { FINE_SCHEDULE } from '../../constants/fineSchedule';
import { mockDrivers } from '../../mock/drivers';
import { mockVehicles } from '../../mock/vehicles';
import { mockRegistrations } from '../../mock/registrations';
import { getFullName } from '../../types/driver';
import Button from '../ui/Button';

interface ViolationFormProps {
  violation?: TrafficViolationFull;
  onSubmit:   (dto: CreateViolationDTO) => void;
  onCancel:   () => void;
}

interface TypeRow {
  id:             number;
  violation_type: ViolationTypeEnum | '';
  base_fine:      number;
}

let _uid = 0;
function nextId() { return ++_uid; }
function blankRow(): TypeRow { return { id: nextId(), violation_type: '', base_fine: 0 }; }

const inputBase = [
  'h-9 px-3 text-sm rounded-md w-full',
  'bg-surface border border-border text-ink placeholder:text-ink-faint',
  'outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
  'transition-colors duration-150',
].join(' ');

const labelBase = 'block text-xs font-medium text-ink-muted mb-1';
const errorText = 'mt-1 text-xs text-danger-600';

function fieldError(errors: Record<string, string>, key: string) {
  return errors[key] ? <p className={errorText}>{errors[key]}</p> : null;
}

export default function ViolationForm({ violation, onSubmit, onCancel }: ViolationFormProps) {
  const isEdit = !!violation;

  const [uovrNumber,       setUovrNumber]       = useState(violation?.uovr_number ?? '');
  const [officer,          setOfficer]          = useState(violation?.officer ?? '');
  const [violationDate,    setViolationDate]    = useState(violation?.violation_date ?? '');
  const [city,             setCity]             = useState(violation?.violation_location_city ?? '');
  const [region,           setRegion]           = useState(violation?.violation_location_region ?? '');
  const [violationStatus,  setViolationStatus]  = useState<ViolationStatus>(
    violation?.violation_status ?? ViolationStatus.Pending
  );
  const [paymentStatus,    setPaymentStatus]    = useState<PaymentStatus>(
    violation?.payment_status ?? PaymentStatus.Unpaid
  );
  const [licenseNumber,    setLicenseNumber]    = useState(violation?.license_number ?? '');
  const [plateNumber,      setPlateNumber]      = useState(violation?.plate_number ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(violation?.registration_number ?? '');
  const [typeRows,         setTypeRows]         = useState<TypeRow[]>(() =>
    violation?.violation_types.length
      ? violation.violation_types.map((t) => ({
          id:             nextId(),
          violation_type: t.violation_type,
          base_fine:      t.base_fine,
        }))
      : [blankRow()]
  );

  const [driverQuery,       setDriverQuery]       = useState(() => {
    if (!violation) return '';
    const d = mockDrivers.find((d) => d.license_number === violation.license_number);
    return d ? getFullName(d) : '';
  });
  const [driverOpen, setDriverOpen] = useState(false);
  const driverRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehiclesForDriver = useMemo(
    () => mockVehicles.filter((v) => v.owner_license_number === licenseNumber),
    [licenseNumber]
  );

  const registrationsForVehicle = useMemo(
    () => mockRegistrations.filter((r) => r.plate_number === plateNumber),
    [plateNumber]
  );

  const filteredDrivers = useMemo(() => {
    const q = driverQuery.toLowerCase();
    if (!q) return mockDrivers;
    return mockDrivers.filter(
      (d) =>
        getFullName(d).toLowerCase().includes(q) ||
        d.license_number.toLowerCase().includes(q)
    );
  }, [driverQuery]);

  const selectedTypes = useMemo(
    () => new Set(typeRows.map((r) => r.violation_type).filter(Boolean)),
    [typeRows]
  );

  const totalFine = useMemo(
    () => typeRows.reduce((sum, r) => sum + r.base_fine, 0),
    [typeRows]
  );

  const statusComboError = useMemo(
    () => INVALID_STATUS_COMBOS.some((c) => c.violation === violationStatus && c.payment === paymentStatus),
    [violationStatus, paymentStatus]
  );

  useEffect(() => {
    if (!licenseNumber) return;
    const stillOwned = vehiclesForDriver.find((v) => v.plate_number === plateNumber);
    if (!stillOwned) {
      setPlateNumber('');
      setRegistrationNumber('');
    }
  }, [licenseNumber]);

  useEffect(() => {
    if (!plateNumber) return;
    const stillLinked = registrationsForVehicle.find((r) => r.registration_number === registrationNumber);
    if (!stillLinked) setRegistrationNumber('');
  }, [plateNumber]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (driverRef.current && !driverRef.current.contains(e.target as Node)) {
        setDriverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectDriver(licNum: string, name: string) {
    setLicenseNumber(licNum);
    setDriverQuery(name);
    setDriverOpen(false);
    setPlateNumber('');
    setRegistrationNumber('');
    setErrors((prev) => ({ ...prev, licenseNumber: '' }));
  }

  function addTypeRow() {
    setTypeRows((prev) => [...prev, blankRow()]);
  }

  function removeTypeRow(id: number) {
    setTypeRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  }

  function updateTypeRow(id: number, type: ViolationTypeEnum | '') {
    setTypeRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, violation_type: type, base_fine: type ? (FINE_SCHEDULE[type] ?? 0) : 0 }
          : r
      )
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!uovrNumber.trim())   e.uovrNumber    = 'UOVR Number is required.';
    if (!violationDate)       e.violationDate  = 'Date is required.';
    if (!city.trim())         e.city           = 'City is required.';
    if (!region.trim())       e.region         = 'Region is required.';
    if (!licenseNumber)       e.licenseNumber  = 'Driver is required.';
    if (!plateNumber)         e.plateNumber    = 'Vehicle is required.';
    if (statusComboError)     e.statusCombo    = 'invalid';
    const hasType = typeRows.some((r) => r.violation_type !== '');
    if (!hasType)             e.typeRows       = 'At least one violation type is required.';
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

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>UOVR Number *</label>
          <input
            className={[inputBase, isEdit ? 'opacity-60 cursor-not-allowed' : ''].join(' ')}
            value={uovrNumber}
            onChange={(e) => setUovrNumber(e.target.value)}
            placeholder="e.g. M25-0000001-1"
            readOnly={isEdit}
          />
          {fieldError(errors, 'uovrNumber')}
        </div>
        <div>
          <label className={labelBase}>Date *</label>
          <input
            type="date"
            className={inputBase}
            value={violationDate}
            onChange={(e) => setViolationDate(e.target.value)}
          />
          {fieldError(errors, 'violationDate')}
        </div>
        <div>
          <label className={labelBase}>City *</label>
          <input
            className={inputBase}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Manila"
          />
          {fieldError(errors, 'city')}
        </div>
        <div>
          <label className={labelBase}>Region *</label>
          <input
            className={inputBase}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. NCR"
          />
          {fieldError(errors, 'region')}
        </div>
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
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {statusComboError && (
          <div className="col-span-2">
            <p className={errorText}>This violation/payment status combination is not allowed.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div ref={driverRef} className="relative">
          <label className={labelBase}>Driver * (search by name or license number)</label>
          <input
            className={inputBase}
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
          {fieldError(errors, 'licenseNumber')}
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

        <div>
          <label className={labelBase}>Vehicle * (auto-filtered to selected driver)</label>
          <select
            className={[inputBase, !licenseNumber ? 'opacity-60 cursor-not-allowed' : ''].join(' ')}
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
          {fieldError(errors, 'plateNumber')}
        </div>

        <div>
          <label className={labelBase}>Registration (optional, auto-filtered to selected vehicle)</label>
          <select
            className={[inputBase, !plateNumber ? 'opacity-60 cursor-not-allowed' : ''].join(' ')}
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink-muted">Violation Types *</label>
          <Button variant="ghost" size="sm" onClick={addTypeRow}>
            + Add Type
          </Button>
        </div>

        {typeRows.length > 0 && (
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
                  );
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <select
                          className={inputBase}
                          value={row.violation_type}
                          onChange={(e) => updateTypeRow(row.id, e.target.value as ViolationTypeEnum | '')}
                        >
                          <option value="">Select type…</option>
                          {VIOLATION_TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t} disabled={usedTypes.has(t)}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-ink">
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
                  <td className="px-3 py-2 text-right text-sm font-semibold text-ink">
                    ₱{totalFine.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {fieldError(errors, 'typeRows')}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Violation'}
        </Button>
      </div>
    </div>
  );
}