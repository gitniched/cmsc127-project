import { Router } from 'express';
import { addVehicle, updateVehicle, getVehicleByOwnerDriverLicense, deleteVehicle, getExpiredVehicles } from './vehicle.controller';

const vehicleRouter = Router();

vehicleRouter.post('/add-vehicle', addVehicle);
vehicleRouter.put('/update-vehicle/:plate_number', updateVehicle);
vehicleRouter.get('/get-vehicle-by-owner/:license_number', getVehicleByOwnerDriverLicense);
vehicleRouter.get('/get-expired-vehicles', getExpiredVehicles);
vehicleRouter.delete('/delete-vehicle/:plate_number', deleteVehicle);

export default vehicleRouter;
