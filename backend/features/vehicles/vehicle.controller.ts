import { Request, Response } from 'express';
import pool from '../../config/mariadb';
import { Vehicle } from '@shared/types/vehicle.types';

const ALLOWED_VEHICLE_FIELDS = [
    'make',
    'model',
    'engine_number',
    'chassis_number',
    'vehicle_type',
    'year',
    'color',
    'owner_license_number'
];

export const addVehicle = async (req: Request, res: Response) => {
    const data: Vehicle = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        const query = 'INSERT INTO vehicle (plate_number, make, model, engine_number, chassis_number,vehicle_type, year, color, owner_license_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            data.plate_number,
            data.make,
            data.model,
            data.engine_number,
            data.chassis_number,
            data.vehicle_type,
            data.year,
            data.color,
            data.owner_license_number
        ];

        await conn.query(query, values);
        res.status(201).json({ message: 'Vehicle added successfully' });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A vehicle with that plate number already exists.' });
        }
        console.error('Error adding vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateVehicle = async (req: Request, res: Response) => {
    const plate_number = req.params.plate_number;
    const data: Partial<Vehicle> = req.body;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    const safeFields = Object.keys(data).filter(key => ALLOWED_VEHICLE_FIELDS.includes(key));

    if (safeFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    let conn;

    try {
        conn = await pool.getConnection();
        const fields = safeFields.map(key => `${key} = ?`).join(', ');
        const values = safeFields.map(key => (data as any)[key]);
        values.push(plate_number);

        const query = `UPDATE vehicle SET ${fields} WHERE plate_number = ?`;
        const result = await conn.query(query, values);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle updated successfully' });
    } catch (error: any) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: 'Owner license number does not exist.' });
        }
        if (error.code === 'ER_SIGNAL_EXCEPTION' || error.sqlState === '45000') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error updating vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    const plate_number = req.params.plate_number;
    let conn;

    try {
        conn = await pool.getConnection();
        const query = 'DELETE FROM vehicle WHERE plate_number = ?';
        const result = await conn.query(query, [plate_number]);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error: any) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Cannot delete vehicle: it has registrations or violations on record.' });
        }
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getVehicles = async (req: Request, res: Response) => {
    let conn;

    try {
        conn = await pool.getConnection();

        let query = 'SELECT * FROM vehicle';
        const queryParams = req.query;
        const conditions: string[] = [];
        const values: any[] = [];

        const filters = ['vehicle_type', 'make', 'year', 'owner_license_number'];
        filters.forEach((key) => {
            if (queryParams[key]) {
                conditions.push(`${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const validSortColumns = ['plate_number', 'make', 'model', 'year'];
        const sortBy = queryParams.sortBy as string;
        const order = (queryParams.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if(sortBy && validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${order}`;
        }

        const rows: Vehicle[] = await conn.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error retrieving vehicles:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getVehicleByPlate = async (req: Request, res: Response) => {
    const plate_number = req.params.plate_number;
    let conn;

    try {
        conn = await pool.getConnection();
        const rows: Vehicle[] = await conn.query('SELECT * FROM vehicle WHERE plate_number = ?', [plate_number]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error retrieving vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getExpiredVehicles = async (req: Request, res: Response) => {
    const { as_of_date } = req.query;
    let conn;

    try {
        conn = await pool.getConnection();
        const query = `
            SELECT v.*, vr.registration_number, vr.expiration_date, vr.registration_status
            FROM vehicle v
            JOIN vehicle_registration vr ON v.plate_number = vr.plate_number
            WHERE vr.expiration_date < ?
            AND vr.registration_status = 'Expired'
        `;

        const rows = await conn.query(query, [as_of_date]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching expired vehicles:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export default {
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicles,
    getVehicleByPlate,
    getExpiredVehicles
};