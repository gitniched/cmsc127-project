import { useState, useEffect, useCallback } from 'react';
import { getRegistrations, createRegistration } from '../api/registrations.api';
import type { RegistrationFilters } from '../api/registrations.api';
import type { VehicleRegistration, CreateRegistrationDTO } from '@shared/types/registration.types';

function adjustRegistrationExpiry(reg: VehicleRegistration): VehicleRegistration {
  if (!reg.expiration_date) return reg;

  const today = new Date();
  const year = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${m}-${d}`;

  const isPast = reg.expiration_date < todayStr;
  let adjustedStatus = reg.registration_status;

  if (reg.registration_status === 'Active' && isPast) {
    adjustedStatus = 'Expired' as any;
  } else if (reg.registration_status === 'Expired' && !isPast) {
    adjustedStatus = 'Active' as any;
  }

  return {
    ...reg,
    registration_status: adjustedStatus,
  };
}

export function useRegistrations(filters?: RegistrationFilters) {
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegistrations(filters);
      setRegistrations(data.map(adjustRegistrationExpiry));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  async function add(data: CreateRegistrationDTO): Promise<string> {
    const res = await createRegistration(data);
    await fetch();
    return res.message;
  }

  return { registrations, loading, error, refetch: fetch, add };
}