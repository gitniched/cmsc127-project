import { apiFetch } from './base.api';
import type { Vehicle } from '../types/vehicle.types';
import type { CreateVehicleDTO, UpdateVehicleDTO } from '../types/vehicle.types';

export interface VehicleFilters {
    vehicle_type?: string;
    make?: string;
    year?: number;
    owner_license_number?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface ExpiredVehicleRow extends Vehicle {
    registration_number: string;
    expiration_date: string;
    registration_status: string;
}

export function getVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== undefined && val !== '') params.set(key, String(val));
        });
    }
    const qs = params.toString();
    return apiFetch<Vehicle[]>(`/vehicles${qs ? `?${qs}` : ''}`);
}

export function getVehicleByPlate(plateNumber: string): Promise<Vehicle> {
    return apiFetch<Vehicle>(`/vehicles/${plateNumber}`);
}

export function getExpiredVehicles(asOfDate: string): Promise<ExpiredVehicleRow[]> {
    return apiFetch<ExpiredVehicleRow[]>(`/vehicles/expired?as_of_date=${asOfDate}`);
}

export function createVehicle(data: CreateVehicleDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateVehicle(plateNumber: string, data: UpdateVehicleDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vehicles/${plateNumber}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteVehicle(plateNumber: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vehicles/${plateNumber}`, {
        method: 'DELETE',
    });
}