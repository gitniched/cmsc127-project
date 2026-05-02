import { Router } from 'express';
import { getReport1, getReport2, getReport3, getReport4, getReport5, getReport6, getReport7 } from './report.controller';

const reportRouter = Router();

reportRouter.get('/1', getReport1);
reportRouter.get('/2', getReport2);
reportRouter.get('/3', getReport3);
reportRouter.get('/4', getReport4);
reportRouter.get('/5', getReport5);
reportRouter.get('/6', getReport6);
reportRouter.get('/7', getReport7);

export default reportRouter;