import { Router } from 'express';
import { addRegistration, getRegistrations, getRegistrationByNumber } from './registration.controller';

const registrationRouter = Router();

registrationRouter.get('/', getRegistrations);
registrationRouter.get('/:registration_number', getRegistrationByNumber);
registrationRouter.post('/', addRegistration);

export default registrationRouter;