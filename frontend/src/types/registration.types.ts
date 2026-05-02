
import { RegistrationStatus } from '../constants/enums';

export interface VehicleRegistration {
  registration_number: string;             // VARCHAR(20) PK
  plate_number:        string;             // FK → vehicle.plate_number
  registration_date:   string;             // DATE as ISO string 'YYYY-MM-DD'
  expiration_date:     string;             // DATE as ISO string — auto-computed by trg_registration_before_insert
  registration_status: RegistrationStatus;
}

export type CreateRegistrationDTO = Omit<VehicleRegistration, 'expiration_date'>;

export type UpdateRegistrationDTO = Partial<Pick<VehicleRegistration, 'registration_status'>>;

export function getRenewalMonthFromPlate(plateNumber: string): number | null {
  if (!plateNumber) return null;
  const lastChar = plateNumber.trim().slice(-1);
  const map: Record<string, number> = {
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '0': 10,
  };
  return map[lastChar] ?? null; // null = non-numeric ending, fallback to +1 year
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December',
];