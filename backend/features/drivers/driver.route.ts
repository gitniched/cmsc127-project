import { Router } from 'express';
import { addDriver, updateDriver, deleteDriver, getDriver } from './driver.controllers';

const driverRouter = Router();

driverRouter.post('/add-driver', addDriver);
driverRouter.put('/update-driver/:license_number', updateDriver);
driverRouter.delete('/delete-driver/:license_number', deleteDriver);
driverRouter.get('/get-drivers', getDriver);

export default driverRouter;