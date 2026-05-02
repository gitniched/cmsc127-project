import { Router } from 'express';
import { addDriver, updateDriver, deleteDriver, getDrivers, getDriverByLicense, renewLicense } from './driver.controllers';

const driverRouter = Router();

driverRouter.get('/', getDrivers);
driverRouter.get('/:license_number', getDriverByLicense);
driverRouter.post('/', addDriver);
driverRouter.put('/:license_number', updateDriver);
driverRouter.delete('/:license_number', deleteDriver);
driverRouter.post('/:license_number/renew', renewLicense);

export default driverRouter;