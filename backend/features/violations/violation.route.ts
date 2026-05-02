import { Router } from 'express';
import { addViolation, updateViolation, deleteViolation, getViolations, getViolationByUOVR } from './violation.controller';

const violationRouter = Router();

violationRouter.get('/', getViolations);
violationRouter.get('/:uovr_number', getViolationByUOVR);
violationRouter.post('/', addViolation);
violationRouter.put('/:uovr_number', updateViolation);
violationRouter.delete('/:uovr_number', deleteViolation);

export default violationRouter;