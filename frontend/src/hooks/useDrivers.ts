import { useState, useEffect, useCallback } from 'react';
import {
  getDrivers,
  getDriverByLicense,
  createDriver,
  updateDriver,
  deleteDriver,
  renewLicense,
} from '../api/driver.api';
import type { DriverFilters } from '../api/driver.api';
import type { DriverWithAge, CreateDriverDTO, UpdateDriverDTO, RenewLicenseResult } from '@shared/types/driver.types';

export function useDrivers(filters?: DriverFilters) {
  const [drivers, setDrivers] = useState<DriverWithAge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDrivers(filters);
      setDrivers(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  async function add(data: CreateDriverDTO): Promise<string> {
    const res = await createDriver(data);
    await fetch();
    return res.message;
  }

  async function edit(licenseNumber: string, data: UpdateDriverDTO): Promise<string> {
    const res = await updateDriver(licenseNumber, data);
    await fetch();
    return res.message;
  }

  async function remove(licenseNumber: string): Promise<string> {
    const res = await deleteDriver(licenseNumber);
    await fetch();
    return res.message;
  }

  async function renew(licenseNumber: string): Promise<RenewLicenseResult> {
    const res = await renewLicense(licenseNumber);
    await fetch();
    return res;
  }

  return { drivers, loading, error, refetch: fetch, add, edit, remove, renew };
}

export function useDriver(licenseNumber: string | undefined) {
  const [driver, setDriver]   = useState<DriverWithAge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!licenseNumber) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDriverByLicense(licenseNumber);
      setDriver(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load driver');
    } finally {
      setLoading(false);
    }
  }, [licenseNumber]);

  useEffect(() => { fetch(); }, [fetch]);

  async function edit(data: UpdateDriverDTO): Promise<string> {
    if (!licenseNumber) throw new Error('No license number');
    const res = await updateDriver(licenseNumber, data);
    await fetch();
    return res.message;
  }

  async function renew(): Promise<RenewLicenseResult> {
    if (!licenseNumber) throw new Error('No license number');
    const res = await renewLicense(licenseNumber);
    await fetch();
    return res;
  }

  return { driver, loading, error, refetch: fetch, edit, renew };
}