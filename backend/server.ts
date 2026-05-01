import express from 'express';
import dotenv from 'dotenv';
import driverRouter from './features/drivers/driver.route';
import vehicleRouter from './features/vehicles/vehicle.route';
import registrationRouter from './features/registrations/registration.route'

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/drivers', driverRouter);
app.use('/vehicles', vehicleRouter);
app.use('/registration', registrationRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
