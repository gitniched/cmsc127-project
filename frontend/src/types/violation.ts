import { ViolationStatus, PaymentStatus, ViolationTypeEnum } from '../constants/enums';
import { FINE_SCHEDULE } from '../constants/fineSchedule';

export interface TrafficViolation {
  uovr_number:               string;
  officer:                   string | null;
  violation_status:          ViolationStatus;
  violation_location_city:   string;
  violation_location_region: string;
  violation_date:            string;
  payment_status:            PaymentStatus;
  license_number:            string;
  plate_number:              string;
  registration_number:       string | null;
}

export interface ViolationType {
  uovr_number:    string;
  violation_type: ViolationTypeEnum;
}

export interface ViolationTypeLineItem {
  violation_type: ViolationTypeEnum;
  base_fine:      number;
}

export interface TrafficViolationFull extends TrafficViolation {
  driver_name:     string;
  violation_types: ViolationTypeLineItem[];
  total_fine:      number;
}

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
  violation_types:           ViolationTypeEnum[];
}

export interface UpdateViolationDTO {
  violation_status?: ViolationStatus;
  payment_status?:   PaymentStatus;
}

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