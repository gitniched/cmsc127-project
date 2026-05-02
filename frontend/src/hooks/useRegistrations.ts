import { useState, useEffect, useCallback } from 'react';
import { getRegistrations, createRegistration } from '../api/registrations';
import type { RegistrationFilters } from '../api/registrations';
import type { VehicleRegistration, CreateRegistrationDTO } from '../types/registration';

export function useRegistrations(filters?: RegistrationFilters) {
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegistrations(filters);
      setRegistrations(data);
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