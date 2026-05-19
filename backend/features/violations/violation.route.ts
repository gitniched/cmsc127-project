import { Router } from 'express';
import { addViolation, updateViolation, updateViolationTypes, deleteViolation, getViolations, getViolationByUOVR } from './violation.controller';

const violationRouter = Router();

violationRouter.get('/', getViolations);
violationRouter.get('/:uovr_number', getViolationByUOVR);
violationRouter.post('/', addViolation);
violationRouter.put('/:uovr_number', updateViolation);
violationRouter.put('/:uovr_number/types', updateViolationTypes);
violationRouter.delete('/:uovr_number', deleteViolation);

export default violationRouter;