import { apiFetch } from './base.api';
import type { DriverWithAge } from '../types/driver.types';
import type { CreateDriverDTO, UpdateDriverDTO, RenewLicenseResult } from '../types/driver.types';

export interface DriverFilters {
    license_type?: string;
    license_status?: string;
    sex?: string;
    age_min?: number;
    age_max?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export function getDrivers(filters?: DriverFilters): Promise<DriverWithAge[]> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== undefined && val !== '') params.set(key, String(val));
        });
    }
    const qs = params.toString();
    return apiFetch<DriverWithAge[]>(`/drivers${qs ? `?${qs}` : ''}`);
}

export function getDriverByLicense(licenseNumber: string): Promise<DriverWithAge> {
    return apiFetch<DriverWithAge>(`/drivers/${licenseNumber}`);
}

export function createDriver(data: CreateDriverDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/drivers', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateDriver(licenseNumber: string, data: UpdateDriverDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/drivers/${licenseNumber}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteDriver(licenseNumber: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/drivers/${licenseNumber}`, {
        method: 'DELETE',
    });
}

export function renewLicense(licenseNumber: string): Promise<RenewLicenseResult> {
    return apiFetch<RenewLicenseResult>(`/drivers/${licenseNumber}/renew`, {
        method: 'POST',
    });
}