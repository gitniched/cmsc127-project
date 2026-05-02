import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { DriverWithAge } from '../../types/driver.types';
import { getFullName } from '../../types/driver.types';
import { renewLicense } from '../../api/driver.api';

interface RenewLicenseModalProps {
  open:      boolean;
  onClose:   () => void;
  driver:    DriverWithAge;
  onRenewed: () => void;
}

type ModalStep =
  | { step: 'confirm' }
  | { step: 'loading' }
  | { step: 'result'; success: boolean; message: string; newExpiry?: string };

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
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

  async function handleConfirm() {
    setModalStep({ step: 'loading' });
    try {
      const result = await renewLicense(driver.license_number);
      if (result.success) {
        onRenewed();
      }
      setModalStep({
        step:      'result',
        success:   result.success,
        message:   result.message,
        newExpiry: result.new_expiry_date,
      });
    } catch (err: any) {
      setModalStep({
        step:    'result',
        success: false,
        message: err.message ?? 'Renewal failed. Please try again.',
      });
    }
  }

  const isResult  = modalStep.step === 'result';
  const isSuccess = isResult && modalStep.success;
  const isLoading = modalStep.step === 'loading';

  return (
    <Modal
      open={open}
      onClose={isLoading ? undefined : onClose}
      title={isResult ? (isSuccess ? 'License Renewed' : 'Renewal Failed') : 'Renew License'}
      size="sm"
    >
      {modalStep.step === 'confirm' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-muted">
            Renewing license for{' '}
            <span className="font-semibold text-ink">{getFullName(driver)}</span>.
            The server will check eligibility and return the result.
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
              <span className="text-ink-muted">License Type</span>
              <span className="text-ink">{driver.license_type}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirm}>Confirm Renewal</Button>
          </div>
        </div>
      )}

      {modalStep.step === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <svg className="animate-spin h-6 w-6 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-ink-muted">Processing renewal…</p>
        </div>
      )}

      {modalStep.step === 'result' && (
        <div className="flex flex-col gap-5">
          <p className={['text-sm', modalStep.success ? 'text-ink' : 'text-danger-600'].join(' ')}>
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
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}