import { apiFetch } from './base';
import type { DriverWithAge } from '../types/driver';
import type { Vehicle } from '../types/vehicle';
import type { ViolationListRow } from './violations';

export interface Report3Row extends Vehicle {
    registration_number: string;
    expiration_date: string;
    registration_status: string;
}

export interface Report6Row {
    violation_type: string;
    total_violations: number;
}

export interface Report7Row extends Vehicle {}

export function getReport1(params: {
    license_type?: string;
    license_status?: string;
    sex?: string;
    age_min?: number;
    age_max?: number;
}): Promise<DriverWithAge[]> {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') p.set(key, String(val));
    });
    const qs = p.toString();
    return apiFetch<DriverWithAge[]>(`/reports/1${qs ? `?${qs}` : ''}`);
}

export function getReport2(licenseNumber: string): Promise<Vehicle[]> {
    return apiFetch<Vehicle[]>(`/reports/2?license_number=${licenseNumber}`);
}

export function getReport3(asOfDate: string): Promise<Report3Row[]> {
    return apiFetch<Report3Row[]>(`/reports/3?as_of_date=${asOfDate}`);
}

export function getReport4(): Promise<DriverWithAge[]> {
    return apiFetch<DriverWithAge[]>('/reports/4');
}

export function getReport5(params: {
    license_number: string;
    start_date?: string;
    end_date?: string;
}): Promise<ViolationListRow[]> {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') p.set(key, String(val));
    });
    return apiFetch<ViolationListRow[]>(`/reports/5?${p.toString()}`);
}

export function getReport6(year: number): Promise<Report6Row[]> {
    return apiFetch<Report6Row[]>(`/reports/6?year=${year}`);
}

export function getReport7(params: { city?: string; region?: string }): Promise<Report7Row[]> {
    const p = new URLSearchParams();
    if (params.city) p.set('city', params.city);
    if (params.region) p.set('region', params.region);
    return apiFetch<Report7Row[]>(`/reports/7?${p.toString()}`);
}