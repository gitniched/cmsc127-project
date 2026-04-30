export interface Driver {
    license_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    birth_date: Date | string;
    sex: string; // CHAR(1)
    address: string;
    license_type: 'Student Permit' | 'Non-Professional' | 'Professional';
    license_status: 'Active' | 'Expired' | 'Suspended' | 'Revoked';
    license_issue_date: Date | string;
    license_expiry_date: Date | string;
}

export interface VDriver extends Driver {
    age: number;
}

export interface VehicleRegistration {
    registration_number: string;
    plate_number: string;
    registration_date: Date | string;
    expiration_date: Date | string;
    registration_status: 'Active' | 'Expired' | 'Suspended';
}

export interface VActiveRegistrations {
    registration_number: string;
    plate_number: string;
    registration_date: Date | string;
    expiration_date: Date | string;
    registration_status: 'Active' | 'Expired' | 'Suspended';
    owner_license_number: string;
}

export interface Vehicle {
    plate_number: string;
    make: string;
    model: string;
    engine_number: string;
    chassis_number: string;
    vehicle_type: 'Sedan' | 'Hatchback' | 'Coupe' | 'SUV' | 'Van' | 'Pickup Truck' | 'Motorcycle' | 'Tricycle' | 'Jeepney' | 'Bus' | 'Truck' | 'Trailer';
    year: number; // YEAR(4)
    color: string;
    owner_license_number: string;
    conduction_sticker?: string | null;
}

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

export interface ViolationType {
    uovr_number: string;
    violation_type: string;
}

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