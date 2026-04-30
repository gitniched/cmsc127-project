
import { VehicleType } from '../constants/enums';

export interface Vehicle {
  plate_number:         string;      // VARCHAR(10) PK
  make:                 string;      // VARCHAR(50)
  model:                string;      // VARCHAR(50)
  engine_number:        string;      // VARCHAR(20)
  chassis_number:       string;      // VARCHAR(20)
  vehicle_type:         VehicleType;
  year:                 number;      // YEAR — stored as number on frontend
  color:                string;      // VARCHAR(20)
  owner_license_number: string;      // FK → driver.license_number
}

export interface VehicleWithOwner extends Vehicle {
  owner_name: string; // CONCAT(first_name, ' ', last_name) from the JOIN
}

export type CreateVehicleDTO = Vehicle;
export type UpdateVehicleDTO = Partial<Vehicle>;