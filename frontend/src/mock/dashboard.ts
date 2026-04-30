import { LicenseStatus, RegistrationStatus, PaymentStatus, ViolationStatus } from '../constants/enums';
import type { DriverWithAge } from '../types/driver';
import type { VehicleRegistration } from '../types/registration';
import type { TrafficViolation } from '../types/violation';

export interface DashboardStats {
  totalDrivers:          number;
  totalVehicles:         number;
  activeRegistrations:   number;
  pendingViolations:     number;
}

export interface DashboardAlerts {
  expiredLicenseDrivers:        DriverWithAge[];
  expiredRegistrationVehicles:  { plate_number: string; make: string; model: string; expiration_date: string }[];
  approachingSuspensionDrivers: { license_number: string; full_name: string; pending_count: number }[];
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalDrivers:        15,
  totalVehicles:       19,
  activeRegistrations: 15,
  pendingViolations:   8,
};

export const MOCK_DASHBOARD_ALERTS: DashboardAlerts = {
  expiredLicenseDrivers: [
    {
      license_number:      'N09-19-900009',
      first_name:          'Isabella',
      middle_name:         'Cruz',
      last_name:           'Reyes',
      birth_date:          '1994-11-30',
      age:                 30,
      sex:                 'F',
      address:             '321 Iloilo St, Iloilo City',
      license_type:        'Non-Professional',
      license_status:      LicenseStatus.Expired,
      license_issue_date:  '2019-11-30',
      license_expiry_date: '2024-11-30',
    },
    {
      license_number:      'N10-17-101010',
      first_name:          'Jose',
      middle_name:         null,
      last_name:           'Mendoza',
      birth_date:          '1985-03-25',
      age:                 40,
      sex:                 'M',
      address:             '654 Laguna Blvd, Santa Rosa',
      license_type:        'Professional',
      license_status:      LicenseStatus.Expired,
      license_issue_date:  '2017-03-25',
      license_expiry_date: '2024-03-25',
    },
  ],

  expiredRegistrationVehicles: [
    { plate_number: 'HKN-1230', make: 'Mitsubishi', model: 'Strada',    expiration_date: '2023-10-15' },
    { plate_number: 'FHL-3455', make: 'Toyota',     model: 'Fortuner',  expiration_date: '2023-05-10' },
    { plate_number: 'GJM-9018', make: 'Hyundai',    model: 'Accent',    expiration_date: '2023-08-20' },
    { plate_number: 'JLP-2345', make: 'BMW',         model: 'M3',        expiration_date: '2024-05-01' },
  ],

  approachingSuspensionDrivers: [
    {
      license_number: 'N05-23-500005',
      full_name:      'Eduardo Reyes Santos',
      pending_count:  2,
    },
    {
      license_number: 'N07-22-700007',
      full_name:      'Gloria Navarro',
      pending_count:  2,
    },
  ],
};