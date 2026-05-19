import { LicenseType, LicenseStatus, Sex } from '../../frontend/src/constants/enums';

export interface Driver {
  license_number:      string;        // VARCHAR(13) PK
  first_name:          string;        // VARCHAR(50)
  last_name:           string;        // VARCHAR(50)
  middle_name:         string | null; // VARCHAR(50) nullable
  birth_date:          string;        // DATE as ISO string 'YYYY-MM-DD'
  sex:                 Sex;           // CHAR(1) — 'M' | 'F'
  address:             string;        // VARCHAR(255)
  license_type:        LicenseType;
  license_status:      LicenseStatus;
  license_issue_date:  string;        // DATE as ISO string 'YYYY-MM-DD'
  license_expiry_date: string;        // DATE as ISO string 'YYYY-MM-DD'
}

export interface DriverWithAge extends Driver {
  age: number; // TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
}

export type CreateDriverDTO = Omit<Driver, 'license_expiry_date'>;

export type UpdateDriverDTO = Partial<CreateDriverDTO>;

export interface RenewLicenseResult {
  success: boolean;
  message: string;          // the p_message OUT param from the stored procedure
  new_expiry_date?: string; // present on success
}

export function getFullName(driver: Pick<Driver, 'first_name' | 'middle_name' | 'last_name'>): string {
  const parts = [driver.first_name, driver.middle_name, driver.last_name].filter(Boolean);
  return parts.join(' ');
}