import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { DriverWithAge } from '../../types/driver';
import { getFullName } from '../../types/driver';
import { LicenseStatus, PaymentStatus, ViolationStatus } from '../../constants/enums';
import { mockViolations } from '../../mock/violations';

interface RenewLicenseModalProps {
  open:      boolean;
  onClose:   () => void;
  driver:    DriverWithAge;
  onRenewed: (newExpiry: string) => void;
}

type ModalStep =
  | { step: 'confirm' }
  | { step: 'result'; success: boolean; message: string; newExpiry?: string };

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

function getUnpaidCount(licenseNumber: string): number {
  return mockViolations.filter(
    (v) =>
      v.license_number === licenseNumber &&
      v.payment_status === PaymentStatus.Unpaid &&
      v.violation_status !== ViolationStatus.Dismissed &&
      v.violation_status !== ViolationStatus.Contested
  ).length;
}

export default function RenewLicenseModal({
  open,
  onClose,
  driver,
  onRenewed,
}: RenewLicenseModalProps) {
  const [modalStep, setModalStep] = useState<ModalStep>({ step: 'confirm' });

  useEffect(() => {
    if (open) setModalStep({ step: 'confirm' });
  }, [open]);

  const unpaidCount = getUnpaidCount(driver.license_number);

  function handleConfirm() {
    if (driver.license_status === LicenseStatus.Revoked) {
      setModalStep({
        step:    'result',
        success: false,
        message: 'License is revoked and cannot be renewed.',
      });
      return;
    }

    if (driver.license_status === LicenseStatus.Suspended) {
      setModalStep({
        step:    'result',
        success: false,
        message: 'License is suspended. Resolve all pending violations before renewing.',
      });
      return;
    }

    if (unpaidCount > 0) {
      setModalStep({
        step:    'result',
        success: false,
        message: `Driver has ${unpaidCount} unpaid violation(s). All fines must be settled before renewal.`,
      });
      return;
    }

    const today         = new Date();
    today.setHours(0, 0, 0, 0);
    const currentExpiry = new Date(driver.license_expiry_date);
    const base          = currentExpiry > today ? currentExpiry : today;
    const newExpiry     = new Date(base);
    newExpiry.setFullYear(newExpiry.getFullYear() + 5);
    const newExpiryStr  = newExpiry.toISOString().slice(0, 10);

    onRenewed(newExpiryStr);
    setModalStep({
      step:      'result',
      success:   true,
      message:   'License renewed successfully.',
      newExpiry: newExpiryStr,
    });
  }

  function handleClose() {
    onClose();
  }

  const isResult  = modalStep.step === 'result';
  const isSuccess = isResult && modalStep.success;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isResult ? (isSuccess ? 'License Renewed' : 'Renewal Failed') : 'Renew License'}
      size="sm"
    >
      {modalStep.step === 'confirm' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-muted">
            Renewing license for{' '}
            <span className="font-semibold text-ink">{getFullName(driver)}</span>.
          </p>

          <div className="flex flex-col gap-3 bg-surface-inset border border-border rounded-md px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Current Status</span>
              <Badge status={driver.license_status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Current Expiry</span>
              <span className="text-ink">{formatDate(driver.license_expiry_date)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Unpaid Violations</span>
              <span className={unpaidCount > 0 ? 'text-danger-600 font-medium' : 'text-ink'}>
                {unpaidCount}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirm}>Confirm Renewal</Button>
          </div>
        </div>
      )}

      {modalStep.step === 'result' && (
        <div className="flex flex-col gap-5">
          <p className={[
            'text-sm',
            modalStep.success ? 'text-ink' : 'text-danger-600',
          ].join(' ')}>
            {modalStep.message}
          </p>

          {modalStep.success && modalStep.newExpiry && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
              <span className="text-sm text-emerald-700 font-medium">New Expiry Date</span>
              <span className="text-sm text-emerald-800 font-semibold">
                {formatDate(modalStep.newExpiry)}
              </span>
            </div>
          )}

          <div className="flex justify-end border-t border-border pt-4">
            <Button variant="ghost" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}