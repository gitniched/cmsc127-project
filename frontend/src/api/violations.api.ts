import { apiFetch } from './base.api';
import type { TrafficViolation, CreateViolationDTO, UpdateViolationDTO } from '../types/violation.types';

export interface ViolationFilters {
    violation_status?: string;
    payment_status?: string;
    violation_location_city?: string;
    violation_location_region?: string;
    year?: number;
    license_number?: string;
    plate_number?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface ViolationListRow extends TrafficViolation {
    violation_types: string;
}

export interface ViolationDetailRow extends TrafficViolation {
    violation_types: string[];
}

export function getViolations(filters?: ViolationFilters): Promise<ViolationListRow[]> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== undefined && val !== '') params.set(key, String(val));
        });
    }
    const qs = params.toString();
    return apiFetch<ViolationListRow[]>(`/violations${qs ? `?${qs}` : ''}`);
}

export function getViolationByUOVR(uovrNumber: string): Promise<ViolationDetailRow> {
    return apiFetch<ViolationDetailRow>(`/violations/${uovrNumber}`);
}

export function createViolation(data: CreateViolationDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/violations', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateViolation(uovrNumber: string, data: UpdateViolationDTO): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/violations/${uovrNumber}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteViolation(uovrNumber: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/violations/${uovrNumber}`, {
        method: 'DELETE',
    });
}