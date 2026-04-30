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