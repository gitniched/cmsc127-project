import { Request, Response } from 'express';
import pool from '../../config/mariadb';
import { VDriver, Driver } from '@shared/types/type';

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
        const result = await conn.query(query, values);

    } catch (error) {
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

    let conn;

    try {
        conn = await pool.getConnection();
        const fields = Object.keys(data).filter(key => key !== 'license_number').map(key => `${key} = ?`).join(', ');
        const values = Object.keys(data).filter(key => key !== 'license_number').map(key => (data as any)[key]); // Exclude undefined values

        values.push(license_number); // For the WHERE clause

        const query = `UPDATE driver SET ${fields} WHERE license_number = ?`;

        const result = await conn.query(query, values);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({ message: 'Driver updated successfully' });
    } catch (error) {
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

        if(result.affectedRows === 0) {
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

export const getDriver = async (req: Request, res: Response) => {    
    let conn;

    try {
        conn = await pool.getConnection();

        let query = 'SELECT * FROM v_driver';
        const queryParams = req.query;
        const filteredWith: String[] = [];
        const values: any[] = [];

        const filters = ['license_type','license_status','age','sex'];

        Object.keys(queryParams).forEach((key: string) => {
            if (filters.includes(key) && queryParams[key]) {
                filteredWith.push(`${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        if (filteredWith.length > 0) {
            query += ' WHERE ' + filteredWith.join(' AND ');
        }

        const validSortColumns = ['license_number',  'age', ' license_issue_date', 'birth_date'];
        const sortBy = queryParams.sortBy as string;
        const order = (queryParams.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (sortBy && validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${order}`;
        }

        const rows: VDriver[] = await conn.query(query, values);
        res.status(200).json(rows);
    }catch (error) {
        console.error('Error retrieving driver:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};


export default {
    addDriver,
    updateDriver,
    deleteDriver,
    getDriver
};