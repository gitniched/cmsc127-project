import { Router } from 'express';
import { addVehicle, updateVehicle, deleteVehicle, getVehicles, getVehicleByPlate, getExpiredVehicles } from './vehicle.controller';

const vehicleRouter = Router();

vehicleRouter.get('/', getVehicles);
vehicleRouter.get('/expired', getExpiredVehicles);
vehicleRouter.get('/:plate_number', getVehicleByPlate);
vehicleRouter.post('/', addVehicle);
vehicleRouter.put('/:plate_number', updateVehicle);
vehicleRouter.delete('/:plate_number', deleteVehicle);

export default vehicleRouter;