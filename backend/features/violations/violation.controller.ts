import { Request, Response} from 'express';
import pool from '../../config/mariadb';
import { TrafficViolation, ViolationType } from '@shared/types/violation.types';

const ALLOWED_VIOLATION_FIELDS = [
    'violation_status',
    'payment_status'
];

export const addViolation = async(req: Request, res: Response) => {
    const { violation_types, ...violationData }: { violation_types: string[] } & TrafficViolation = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const query = `
            INSERT INTO traffic_violation (
                uovr_number, officer, violation_status, violation_location_city,
                violation_location_region, violation_date, payment_status,
                license_number, plate_number, registration_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            violationData.uovr_number,
            violationData.officer || null,
            violationData.violation_status,
            violationData.violation_location_city,
            violationData.violation_location_region,
            violationData.violation_date,
            violationData.payment_status,
            violationData.license_number,
            violationData.plate_number,
            violationData.registration_number || null
        ];

        await conn.query(query, values);

        if (!violation_types || violation_types.length === 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'At least one violation type is required' });
        }

        const typeQuery = 'INSERT INTO violation_type (uovr_number, violation_type) VALUES (?, ?)';
        for (const type of violation_types) {
            await conn.query(typeQuery, [violationData.uovr_number, type]);
        }

        await conn.commit();
        res.status(201).json({ message: 'Violation added successfully' });
    } catch (error: any) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error adding violation:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateViolation = async(req: Request, res: Response) => {
    const uovr_number = req.params.uovr_number;
    const data: Partial<TrafficViolation> = req.body;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    const safeFields = Object.keys(data).filter(key => ALLOWED_VIOLATION_FIELDS.includes(key));

    if (safeFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    let conn;

    try {
        conn = await pool.getConnection();
        const fields = safeFields.map(key => `${key} = ?`).join(', ');
        const values = safeFields.map(key => (data as any)[key]);
        values.push(uovr_number);

        const query = `UPDATE traffic_violation SET ${fields} WHERE uovr_number = ?`;
        const result = await conn.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Violation not found' });
        }

        res.status(200).json({ message: 'Violation updated successfully' });
    } catch (error: any) {
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Error updating violation:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const deleteViolation = async(req: Request, res: Response) => {
    const uovr_number = req.params.uovr_number;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query('DELETE FROM violation_type WHERE uovr_number = ?', [uovr_number]);

        const result = await conn.query('DELETE FROM traffic_violation WHERE uovr_number = ?', [uovr_number]);

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Violation not found' });
        }

        await conn.commit();
        res.status(200).json({ message: 'Violation deleted successfully' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error deleting violation:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getViolations = async(req: Request, res: Response) => {
    let conn;

    try {
        conn = await pool.getConnection();

        let query = `
            SELECT
                tv.uovr_number, tv.officer, tv.violation_status,
                tv.violation_location_city, tv.violation_location_region,
                tv.violation_date, tv.payment_status,
                tv.license_number, tv.plate_number, tv.registration_number,
                GROUP_CONCAT(vt.violation_type SEPARATOR ', ') AS violation_types
            FROM traffic_violation tv
            LEFT JOIN violation_type vt ON tv.uovr_number = vt.uovr_number
        `;

        const queryParams = req.query;
        const conditions: string[] = [];
        const values: any[] = [];

        const filters = ['violation_status', 'payment_status', 'violation_location_city', 'violation_location_region', 'license_number', 'plate_number'];
        filters.forEach((key) => {
            if (queryParams[key]) {
                conditions.push(`tv.${key} = ?`);
                values.push(queryParams[key]);
            }
        });

        if (queryParams.year) {
            conditions.push('YEAR(tv.violation_date) = ?');
            values.push(queryParams.year);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY tv.uovr_number';

        const validSortColumns = ['violation_date', 'violation_status', 'payment_status', 'uovr_number'];
        const sortBy = queryParams.sortBy as string;
        const order = (queryParams.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (sortBy && validSortColumns.includes(sortBy)) {
            query += ` ORDER BY tv.${sortBy} ${order}`;
        }

        const rows = await conn.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error retrieving violations:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getViolationByUOVR = async(req: Request, res: Response) => {
    const uovr_number = req.params.uovr_number;
    let conn;

    try {
        conn = await pool.getConnection();

        const violationRows: TrafficViolation[] = await conn.query(
            'SELECT * FROM traffic_violation WHERE uovr_number = ?',
            [uovr_number]
        );

        if (violationRows.length === 0) {
            return res.status(404).json({ message: 'Violation not found' });
        }

        const typeRows: ViolationType[] = await conn.query(
            'SELECT violation_type FROM violation_type WHERE uovr_number = ?',
            [uovr_number]
        );

        res.status(200).json({
            ...violationRows[0],
            violation_types: typeRows.map(row => row.violation_type)
        });
    } catch (error) {
        console.error('Error retrieving violation:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export default {
    addViolation,
    updateViolation,
    deleteViolation,
    getViolations,
    getViolationByUOVR
};