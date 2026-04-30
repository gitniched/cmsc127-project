import { Router } from 'express';
import { addDriver, updateDriver, deleteDriver, getDriver } from './driver.controllers';

const router = Router();

router.post('/add-driver', addDriver);
router.put('/:license_number', updateDriver);
router.delete('/:license_number', deleteDriver);
router.get('/get-drivers', getDriver);

export default router;