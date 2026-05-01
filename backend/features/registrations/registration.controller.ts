import { Request, Response} from "express";
import { VehicleRegistration } from '@shared/types/type';
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

        const result = await conn.query(query, values);

        res.status(201).json({ message: 'Registration added successfully'});
    } catch (error) {
        console.error('Error adding registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateRegistration = async (req: Request, res: Response) => {
    const plate_number = req.params.plate_number;
    const { registration_date } = req.body;
    let conn;

    try{
        conn = await pool.getConnection();

        const query = "UPDATE vehicle_registration SET registration_date = ?, registration_status = 'Active' WHERE plate_number = ?";

        const result = await conn.query(query, [registration_date, plate_number]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registration record not found for this plate' });
        }

        res.status(200).json({ message: 'Registration renewed successfully', });
    } catch (error) {
        console.error('Error updating registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getRegistration = async (req: Request, res: Response) => {    
    let conn;

    try {
        conn = await pool.getConnection();

        let query = 'SELECT * FROM vehicle_registration';
        const queryParams = req.query;
        const filteredWith: string[] = []; // Use lowercase string
        const values: any[] = [];

        const filters = ['registration_status', 'registration_date'];
        Object.keys(queryParams).forEach((key: string) => {
            if (filters.includes(key) && queryParams[key]) {
                filteredWith.push(`${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        if (filteredWith.length > 0) {
            query += ' WHERE ' + filteredWith.join(' AND ');
        }

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