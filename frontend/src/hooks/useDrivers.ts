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

function parseDateParts(dateStr: string) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1, // 0-indexed month
      day: parseInt(match[3], 10)
    };
  }
  const d = new Date(dateStr);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate()
  };
}

export function adjustDriverExpiry<T extends {
  license_type: string;
  birth_date: string;
  license_issue_date: string;
  license_expiry_date: string;
  license_status?: string;
}>(driver: T): T {
  if (!driver.license_issue_date || !driver.birth_date) return driver;

  const issueParts = parseDateParts(driver.license_issue_date);
  const dobParts = parseDateParts(driver.birth_date);
  if (isNaN(issueParts.year) || isNaN(dobParts.year)) return driver;

  let validityYears = 5;
  if (driver.license_type === 'Student Permit') {
    validityYears = 1;
  } else if (driver.license_expiry_date) {
    const expParts = parseDateParts(driver.license_expiry_date);
    if (!isNaN(expParts.year)) {
      const diffYears = expParts.year - issueParts.year;
      if (diffYears === 1 || diffYears === 5 || diffYears === 10) {
        validityYears = diffYears;
      }
    }
  }

  const expiryYear = issueParts.year + validityYears;
  let month = dobParts.month;
  let day = dobParts.day;

  // Handle Feb 29 leap year fallback
  if (month === 1 && day === 29) {
    const isLeap = (expiryYear % 4 === 0 && expiryYear % 100 !== 0) || (expiryYear % 400 === 0);
    if (!isLeap) day = 28;
  }

  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const adjustedExpiry = `${expiryYear}-${mm}-${dd}`;

  const today = new Date();
  const year = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${m}-${d}`;

  let adjustedStatus = driver.license_status;
  if (driver.license_status === 'Active' && adjustedExpiry < todayStr) {
    adjustedStatus = 'Expired';
  } else if (driver.license_status === 'Expired' && adjustedExpiry >= todayStr) {
    adjustedStatus = 'Active';
  }

  return {
    ...driver,
    license_expiry_date: adjustedExpiry,
    ...(driver.license_status !== undefined ? { license_status: adjustedStatus } : {}),
  };
}

export function useDrivers(filters?: DriverFilters) {
  const [drivers, setDrivers] = useState<DriverWithAge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDrivers(filters);
      setDrivers(data.map(adjustDriverExpiry) as DriverWithAge[]);
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
      setDriver(adjustDriverExpiry(data) as DriverWithAge);
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