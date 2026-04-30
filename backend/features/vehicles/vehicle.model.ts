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