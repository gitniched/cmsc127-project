import { useState, useEffect, useCallback } from 'react';
import {
  getVehicles,
  getVehicleByPlate,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../api/vehicles.api';
import type { VehicleFilters } from '../api/vehicles.api';
import type { Vehicle, VehicleWithOwner, CreateVehicleDTO, UpdateVehicleDTO } from '../types/vehicle.types';
import { getDrivers } from '../api/driver.api';

async function enrichWithOwner(vehicles: Vehicle[]): Promise<VehicleWithOwner[]> {
  if (vehicles.length === 0) return [];
  try {
    const drivers = await getDrivers();
    const map = new Map(drivers.map((d) => [d.license_number, `${d.first_name} ${d.last_name}`]));
    return vehicles.map((v) => ({
      ...v,
      owner_name: map.get(v.owner_license_number) ?? v.owner_license_number,
    }));
  } catch {
    return vehicles.map((v) => ({ ...v, owner_name: v.owner_license_number }));
  }
}

export function useVehicles(filters?: VehicleFilters) {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw  = await getVehicles(filters);
      const data = await enrichWithOwner(raw);
      setVehicles(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  async function add(data: CreateVehicleDTO): Promise<string> {
    const res = await createVehicle(data);
    await fetch();
    return res.message;
  }

  async function edit(plateNumber: string, data: UpdateVehicleDTO): Promise<string> {
    const res = await updateVehicle(plateNumber, data);
    await fetch();
    return res.message;
  }

  async function remove(plateNumber: string): Promise<string> {
    const res = await deleteVehicle(plateNumber);
    await fetch();
    return res.message;
  }

  return { vehicles, loading, error, refetch: fetch, add, edit, remove };
}

export function useVehicle(plateNumber: string | undefined) {
  const [vehicle, setVehicle]   = useState<VehicleWithOwner | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!plateNumber) return;
    setLoading(true);
    setError(null);
    try {
      const raw     = await getVehicleByPlate(plateNumber);
      const [enriched] = await enrichWithOwner([raw]);
      setVehicle(enriched);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  }, [plateNumber]);

  useEffect(() => { fetch(); }, [fetch]);

  async function edit(data: UpdateVehicleDTO): Promise<string> {
    if (!plateNumber) throw new Error('No plate number');
    const res = await updateVehicle(plateNumber, data);
    await fetch();
    return res.message;
  }

  async function remove(): Promise<string> {
    if (!plateNumber) throw new Error('No plate number');
    const res = await deleteVehicle(plateNumber);
    return res.message;
  }

  return { vehicle, loading, error, refetch: fetch, edit, remove };
}