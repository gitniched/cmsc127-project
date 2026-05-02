import { Request, Response } from 'express';
import pool from '../../config/mariadb';
import { VDriver, Driver } from '@shared/types/type';

const ALLOWED_DRIVER_FIELDS = [
    'first_name',
    'last_name',
    'middle_name',
    'birth_date',
    'sex',
    'address',
    'license_type',
    'license_status',
    'license_issue_date'
];

export const addDriver = async (req: Request, res: Response) => {
    const data: Driver = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        const query = 'INSERT INTO driver (license_number, first_name, last_name, middle_name, birth_date, sex, address, license_type, license_status, license_issue_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        const values= [
            data.license_number,
            data.first_name,
            data.last_name,
            data.middle_name || null,
            data.birth_date,
            data.sex,
            data.address,
            data.license_type,
            data.license_status,
            data.license_issue_date
        ];

        await conn.query(query, values);
        res.status(201).json({ message: 'Driver added successfully' });
    } catch (error: any) {
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error adding driver:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateDriver = async (req: Request, res: Response) => {
    const license_number = req.params.license_number;
    const data: Partial<Driver> = req.body;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    const safeFields = Object.keys(data).filter(key => ALLOWED_DRIVER_FIELDS.includes(key));

    if (safeFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    let conn;

    try {
        conn = await pool.getConnection();
        const fields = safeFields.map(key => `${key} = ?`).join(', ');
        const values = safeFields.map(key => (data as any)[key]);
        values.push(license_number);

        const query = `UPDATE driver SET ${fields} WHERE license_number = ?`;
        const result = await conn.query(query, values);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({ message: 'Driver updated successfully' });
    } catch (error: any) {
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const deleteDriver = async (req: Request, res: Response) => {
    const license_number = req.params.license_number;
    let conn;

    try {
        conn = await pool.getConnection();
        const query = 'DELETE FROM driver WHERE license_number = ?';
        const result = await conn.query(query, [license_number]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getDrivers = async (req: Request, res: Response) => {
    let conn;

    try {
        console.log('Attempting to get drivers...');
        conn = await pool.getConnection();
        console.log('Database connection established');

        let query = 'SELECT * FROM v_driver';
        const queryParams = req.query;
        const conditions: string[] = [];
        const values: any[] = [];

        const enumFilters = ['license_type', 'license_status', 'sex'];
        enumFilters.forEach((key) => {
            if (queryParams[key]) {
                conditions.push(`${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        const age_min = queryParams.age_min ? Number(queryParams.age_min) : null;
        const age_max = queryParams.age_max ? Number(queryParams.age_max) : null;

        if (age_min !== null && age_max !== null) {
            conditions.push('age BETWEEN ? AND ?');
            values.push(age_min, age_max);
        } else if (age_min !== null) {
            conditions.push('age >= ?');
            values.push(age_min);
        } else if (age_max !== null) {
            conditions.push('age <= ?');
            values.push(age_max);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const validSortColumns = ['license_number', 'age', 'license_issue_date', 'birth_date'];
        const sortBy = queryParams.sortBy as string;
        const order = (queryParams.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (sortBy && validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${order}`;
        }

        console.log('Executing query:', query);
        const rows: VDriver[] = await conn.query(query, values);
        console.log('Query successful, returning', rows.length, 'rows');
        res.status(200).json(rows);
    } catch (error: any) {
        console.error('Error retrieving drivers:', error);
        console.error('Error details:', error.message, error.code, error.sqlState);
        return res.status(500).json({ message: 'Internal server error', details: error.message });
    } finally {
        if (conn) conn.release();
    }
};

export const getDriverByLicense = async (req: Request, res: Response) => {
    const license_number = req.params.license_number;
    let conn;

    try {
        conn = await pool.getConnection();
        const rows: VDriver[] = await conn.query('SELECT * FROM v_driver WHERE license_number = ?', [license_number]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error retrieving driver:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const renewLicense = async (req: Request, res: Response) => {
    const license_number = req.params.license_number;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.query('CALL sp_renew_license(?, @message)', [license_number]);
        const rows: any[] = await conn.query('SELECT @message AS message');
        const message: string = rows[0]['@message'];

        if (message.startsWith('error:')) {
            return res.status(400).json({ success: false, message });
        }

        const driverRows: VDriver[] = await conn.query(
            'SELECT license_expiry_date FROM driver WHERE license_number = ?',
            [license_number]
        );

        res.status(200).json({
            success: true,
            message,
            new_expiry_date: driverRows[0].license_expiry_date,
        });
    } catch (error) {
        console.error('Error renewing license:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export default {
    addDriver,
    updateDriver,
    deleteDriver,
    getDrivers,
    getDriverByLicense,
    renewLicense
};