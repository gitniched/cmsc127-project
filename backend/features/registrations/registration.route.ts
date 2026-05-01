import { Router } from 'express';
import { getRegistration, renewRegistration, addRegistration } from './registration.controller';

const registrationRouter = Router();

registrationRouter.get('/get-registration', getRegistration);
registrationRouter.put('/renew-registration', renewRegistration);
registrationRouter.post('/add-registration', addRegistration);

export default registrationRouter;
