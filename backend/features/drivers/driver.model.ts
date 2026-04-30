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
