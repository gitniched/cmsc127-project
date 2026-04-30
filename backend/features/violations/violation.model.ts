export interface ViolationFineSchedule {
    violation_type: string;
    base_fine_amount: number | string; 
    legal_basis: string;
}

// Maps to the 'traffic_violation' table
export interface TrafficViolation {
    uovr_number: string;
    officer?: string | null;
    violation_status: 'Pending' | 'Resolved' | 'Contested' | 'Dismissed';
    violation_location_city: string;
    violation_location_region: string;
    violation_date: Date | string;
    payment_status: 'Paid' | 'Unpaid' | 'Waived';
    license_number: string;
    plate_number: string;
    registration_number?: string | null;
}

// Maps to the 'violation_type' table
export interface ViolationType {
    uovr_number: string;
    violation_type: string;
}

// Maps to the 'v_violation_summary' view
export interface VViolationSummary {
    uovr_number: string;
    violation_date: Date | string;
    violation_location_city: string;
    violation_location_region: string;
    violation_status: 'Pending' | 'Resolved' | 'Contested' | 'Dismissed';
    payment_status: 'Paid' | 'Unpaid' | 'Waived';
    license_number: string;
    plate_number: string;
    officer?: string | null;
    total_fine_amount: number | string; 
}