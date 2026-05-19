import { Request, Response} from 'express';
import { VehicleRegistration } from '@shared/types/registration.types';
import pool from '../../config/mariadb';

// NOTE: To be tested
export const addRegistration = async(req:Request, res: Response) => {
    const data: VehicleRegistration = req.body;
    let conn;


    try {
        conn = await pool.getConnection();
        const query = 'INSERT INTO vehicle_registration (registration_number, plate_number, registration_date, registration_status) VALUES (?, ?, ?, ?)';
        const values = [
            data.registration_number,
            data.plate_number,
            data.registration_date,
            data.registration_status
        ];

        await conn.query(query, values);
        res.status(201).json({ message: 'Registration added successfully' });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A registration with that number already exists.' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: 'Plate number does not exist.' });
        }
        if (error.code === 'ER_SIGNAL_EXCEPTION' || error.sqlState === '45000') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error adding registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getRegistrations = async (req: Request, res: Response) => {
    let conn;

    try {
        conn = await pool.getConnection();

        const queryParams = req.query;
        const active_only = queryParams.active_only === 'true';

        let query = active_only
            ? 'SELECT * FROM v_active_registrations'
            : 'SELECT * FROM vehicle_registration';

        const conditions: string[] = [];
        const values: any[] = [];

        const filters = ['registration_status', 'registration_date', 'plate_number'];
        filters.forEach((key) => {
            if (queryParams[key] && !active_only) {
                conditions.push(`${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        if (queryParams.plate_number && active_only) {
            conditions.push('plate_number = ?');
            values.push(queryParams.plate_number);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // to be tested
        const validSortColumns = ['registration_date', 'registration_status', 'registration_number', 'plate_number'];
        const sortBy = queryParams.sortBy as string;
        const order = (queryParams.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (sortBy && validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${order}`;
        }

        const rows: VehicleRegistration[] = await conn.query(query, values);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error retrieving registrations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getRegistrationByNumber = async (req: Request, res: Response) => {
    const registration_number = req.params.registration_number;
    let conn;

    try {
        conn = await pool.getConnection();
        const rows: VehicleRegistration[] = await conn.query(
            'SELECT * FROM vehicle_registration WHERE registration_number = ?',
            [registration_number]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error retrieving registration:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export default { addRegistration, getRegistrations, getRegistrationByNumber };