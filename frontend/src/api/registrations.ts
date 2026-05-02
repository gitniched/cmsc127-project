import { apiFetch } from './base';
import type { VehicleRegistration } from '../types/registration';
import type { CreateRegistrationDTO } from '../types/registration';

export interface RegistrationFilters {
    plate_number?: string;
    registration_status?: string;
    registration_date?: string;
    active_only?: boolean;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export function getRegistrations(filters?: RegistrationFilters): Promise<VehicleRegistration[]> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== undefined && val !== '') params.set(key, String(val));
        });
    }
    const qs = params.toString();
    return apiFetch<VehicleRegistration[]>(`/registrations${qs ? `?${qs}` : ''}`);
}

export function getRegistrationByNumber(registrationNumber: string): Promise<VehicleRegistration> {
    return apiFetch<VehicleRegistration>(`/registrations/${registrationNumber}`);
}

export function createRegistration(data: CreateRegistrationDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/registrations', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}