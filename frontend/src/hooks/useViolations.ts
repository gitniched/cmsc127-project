import { useState, useEffect, useCallback } from 'react';
import {
  getViolations,
  getViolationByUOVR,
  createViolation,
  updateViolation,
  deleteViolation,
} from '../api/violations';
import type { ViolationFilters, ViolationListRow } from '../api/violations';
import type {
  TrafficViolationFull,
  CreateViolationDTO,
  UpdateViolationDTO,
  ViolationTypeLineItem,
} from '../types/violation';
import { FINE_SCHEDULE } from '../constants/fineSchedule';
import type { ViolationTypeEnum } from '../constants/enums';
import { getDrivers } from '../api/driver';

function mapTypeStringsToLineItems(types: string[]): ViolationTypeLineItem[] {
  return types.map((t) => ({
    violation_type: t as ViolationTypeEnum,
    base_fine:      FINE_SCHEDULE[t as ViolationTypeEnum] ?? 0,
  }));
}

async function enrichListRows(rows: ViolationListRow[]): Promise<TrafficViolationFull[]> {
  let nameMap = new Map<string, string>();
  try {
    const drivers = await getDrivers();
    nameMap = new Map(drivers.map((d) => [d.license_number, `${d.first_name} ${d.last_name}`]));
  } catch {}

  return rows.map((row) => {
    const typeStrings = row.violation_types
      ? row.violation_types.split(', ').map((s) => s.trim()).filter(Boolean)
      : [];
    const lineItems = mapTypeStringsToLineItems(typeStrings);
    return {
      ...row,
      driver_name:     nameMap.get(row.license_number) ?? row.license_number,
      violation_types: lineItems,
      total_fine:      lineItems.reduce((sum, i) => sum + i.base_fine, 0),
    };
  });
}

export function useViolations(filters?: ViolationFilters) {
  const [violations, setViolations] = useState<TrafficViolationFull[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw  = await getViolations(filters);
      const data = await enrichListRows(raw);
      setViolations(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  async function add(data: CreateViolationDTO): Promise<string> {
    const res = await createViolation(data);
    await fetch();
    return res.message;
  }

  async function edit(uovrNumber: string, data: UpdateViolationDTO): Promise<string> {
    const res = await updateViolation(uovrNumber, data);
    await fetch();
    return res.message;
  }

  async function remove(uovrNumber: string): Promise<string> {
    const res = await deleteViolation(uovrNumber);
    await fetch();
    return res.message;
  }

  return { violations, loading, error, refetch: fetch, add, edit, remove };
}

export function useViolation(uovrNumber: string | undefined) {
  const [violation, setViolation] = useState<TrafficViolationFull | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!uovrNumber) return;
    setLoading(true);
    setError(null);
    try {
      const raw       = await getViolationByUOVR(uovrNumber);
      const lineItems = mapTypeStringsToLineItems(raw.violation_types as unknown as string[]);

      let driverName = raw.license_number;
      try {
        const drivers = await getDrivers();
        const d = drivers.find((dr) => dr.license_number === raw.license_number);
        if (d) driverName = `${d.first_name} ${d.last_name}`;
      } catch {}

      setViolation({
        ...raw,
        driver_name:     driverName,
        violation_types: lineItems,
        total_fine:      lineItems.reduce((sum, i) => sum + i.base_fine, 0),
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to load violation');
    } finally {
      setLoading(false);
    }
  }, [uovrNumber]);

  useEffect(() => { fetch(); }, [fetch]);

  async function edit(data: UpdateViolationDTO): Promise<string> {
    if (!uovrNumber) throw new Error('No UOVR number');
    const res = await updateViolation(uovrNumber, data);
    await fetch();
    return res.message;
  }

  async function remove(): Promise<string> {
    if (!uovrNumber) throw new Error('No UOVR number');
    const res = await deleteViolation(uovrNumber);
    return res.message;
  }

  return { violation, loading, error, refetch: fetch, edit, remove };
}