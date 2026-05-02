import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import driverRouter from './features/drivers/driver.route';
import vehicleRouter from './features/vehicles/vehicle.route';
import registrationRouter from './features/registrations/registration.route';
import violationRouter from './features/violations/violation.route';
import reportRouter from './features/reports/report.route';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/drivers', driverRouter);
app.use('/vehicles', vehicleRouter);
app.use('/registrations', registrationRouter);
app.use('/violations', violationRouter);
app.use('/reports', reportRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});