export interface Driver {
    license_number: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    birth_date: Date;
    sex: 'M' | 'F';
    address: string;
    license_type: 'Student Permit' | 'Non-Professional' | 'Professional';
    license_status: 'Active' | 'Expired' | 'Suspended' | 'Revoked';
    license_issue_date: Date;
    license_expiry_date: Date;
}

export interface VDriver extends Driver {
    age: number;
}

export interface Vehicle {
    plate_number: string;
    make: string;
    model: string;
    engine_number: string;
    chassis_number: string;
    vehicle_type: 'Sedan' | 'Hatchback' | 'Coupe' | 'SUV' | 'Van' | 'Pickup Truck' | 'Motorcycle' | 'Tricycle' | 'Jeepney' | 'Bus' | 'Truck' | 'Trailer';
    year: number;
    color: string;
    owner_license_number: string;
}

export interface VehicleRegistration {
    registration_number: string;
    plate_number: string;
    registration_date: Date;
    expiration_date: Date;
    registration_status: 'Active' | 'Expired' | 'Suspended';
}

export interface VActiveRegistrations extends VehicleRegistration {
    owner_license_number: string;
}

export interface TrafficViolation {
    uovr_number: string;
    officer: string | null;
    violation_status: 'Pending' | 'Resolved' | 'Contested' | 'Dismissed';
    violation_location_city: string;
    violation_location_region: string;
    violation_date: Date;
    payment_status: 'Paid' | 'Unpaid' | 'Waived';
    license_number: string;
    plate_number: string;
    registration_number: string | null;
}

export interface ViolationType {
    uovr_number: string;
    violation_type: string;
}