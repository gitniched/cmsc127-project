
import { ViolationStatus, PaymentStatus, ViolationTypeEnum } from '../constants/enums';
import { FINE_SCHEDULE, computeTotalFine } from '../constants/fineSchedule';

export interface TrafficViolation {
  uovr_number:               string;               // VARCHAR(20) PK
  officer:                   string | null;         // VARCHAR(100) nullable
  violation_status:          ViolationStatus;
  violation_location_city:   string;               // VARCHAR(100)
  violation_location_region: string;               // VARCHAR(100)
  violation_date:            string;               // DATE as ISO string 'YYYY-MM-DD'
  payment_status:            PaymentStatus;
  license_number:            string;               // FK → driver.license_number
  plate_number:              string;               // FK → vehicle.plate_number
  registration_number:       string | null;        // FK → vehicle_registration.registration_number (optional)
}

// Mirrors the violation_type table
// Note: (uovr_number, violation_type) is a composite PK in the DB
export interface ViolationType {
  uovr_number:    string;
  violation_type: ViolationTypeEnum;
}
export interface ViolationTypeLineItem {
  violation_type: ViolationTypeEnum;
  base_fine:      number; // looked up from FINE_SCHEDULE
}

export interface TrafficViolationFull extends TrafficViolation {
  driver_name:     string;               // CONCAT(first_name, ' ', last_name)
  violation_types: ViolationTypeLineItem[];
  total_fine:      number;               // sum of all base_fines
}


// Used when creating a violation (POST /api/violations)
export interface CreateViolationDTO {
  uovr_number:               string;
  officer?:                  string;
  violation_status:          ViolationStatus;
  violation_location_city:   string;
  violation_location_region: string;
  violation_date:            string;
  payment_status:            PaymentStatus;
  license_number:            string;
  plate_number:              string;
  registration_number?:      string;
  violation_types:           ViolationTypeEnum[]; // sent as array; backend inserts rows into violation_type
}

export type UpdateViolationDTO = Partial<CreateViolationDTO>;


export function buildViolationLineItems(types: ViolationTypeEnum[]): ViolationTypeLineItem[] {
  return types.map((t) => ({
    violation_type: t,
    base_fine:      FINE_SCHEDULE[t] ?? 0,
  }));
}

export function getTotalFineFromLineItems(items: ViolationTypeLineItem[]): number {
  return items.reduce((sum, item) => sum + item.base_fine, 0);
}

export function isCountedAsUnpaid(violation: TrafficViolation): boolean {
  return (
    violation.payment_status === PaymentStatus.Unpaid &&
    violation.violation_status !== ViolationStatus.Dismissed &&
    violation.violation_status !== ViolationStatus.Contested
  );
}