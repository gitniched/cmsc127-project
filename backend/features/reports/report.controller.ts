import { Request, Response } from 'express';
import pool from '../../config/mariadb';

export const getReport1 = async (req: Request, res: Response) => {
    const { license_type, license_status, sex, age_min, age_max } = req.query;
    let conn;

    try {
        conn = await pool.getConnection();

        let query = 'SELECT * FROM v_driver WHERE 1=1';
        const values: any[] = [];

        if (license_type) {
            query += ' AND license_type = ?';
            values.push(license_type);
        }
        if (license_status) {
            query += ' AND license_status = ?';
            values.push(license_status);
        }
        if (sex) {
            query += ' AND sex = ?';
            values.push(sex);
        }
        if (age_min !== undefined && age_max !== undefined) {
            query += ' AND age BETWEEN ? AND ?';
            values.push(Number(age_min), Number(age_max));
        } else if (age_min !== undefined) {
            query += ' AND age >= ?';
            values.push(Number(age_min));
        } else if (age_max !== undefined) {
            query += ' AND age <= ?';
            values.push(Number(age_max));
        }

        const rows = await conn.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 1:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport2 = async (req: Request, res: Response) => {
    const { license_number } = req.query;
    let conn;

    if (!license_number) {
        return res.status(400).json({ message: 'license_number is required' });
    }

    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * FROM vehicle WHERE owner_license_number = ?',
            [license_number]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 2:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport3 = async (req: Request, res: Response) => {
    const { as_of_date } = req.query;
    let conn;

    if (!as_of_date) {
        return res.status(400).json({ message: 'as_of_date is required' });
    }

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
        console.error('Error running report 3:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport4 = async (req: Request, res: Response) => {
    let conn;

    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM v_driver WHERE license_status IN ('Expired', 'Suspended')"
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 4:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport5 = async (req: Request, res: Response) => {
    const { license_number, start_date, end_date } = req.query;
    let conn;

    if (!license_number) {
        return res.status(400).json({ message: 'license_number is required' });
    }

    try {
        conn = await pool.getConnection();

        let query = `
            SELECT
                tv.uovr_number, tv.officer, tv.violation_status,
                tv.violation_location_city, tv.violation_location_region,
                tv.violation_date, tv.payment_status,
                tv.plate_number, tv.registration_number,
                GROUP_CONCAT(vt.violation_type SEPARATOR ', ') AS violation_types
            FROM traffic_violation tv
            JOIN violation_type vt ON tv.uovr_number = vt.uovr_number
            WHERE tv.license_number = ?
        `;
        const values: any[] = [license_number];

        if (start_date && end_date) {
            query += ' AND tv.violation_date BETWEEN ? AND ?';
            values.push(start_date, end_date);
        } else if (start_date) {
            query += ' AND tv.violation_date >= ?';
            values.push(start_date);
        } else if (end_date) {
            query += ' AND tv.violation_date <= ?';
            values.push(end_date);
        }

        query += ' GROUP BY tv.uovr_number ORDER BY tv.violation_date DESC';

        const rows = await conn.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 5:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport6 = async (req: Request, res: Response) => {
    const { year } = req.query;
    let conn;

    if (!year) {
        return res.status(400).json({ message: 'year is required' });
    }

    try {
        conn = await pool.getConnection();
        const query = `
            SELECT vt.violation_type, COUNT(*) AS total_violations
            FROM violation_type vt
            JOIN traffic_violation tv ON vt.uovr_number = tv.uovr_number
            WHERE YEAR(tv.violation_date) = ?
            GROUP BY vt.violation_type
            ORDER BY total_violations DESC
        `;
        const rows = await conn.query(query, [Number(year)]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 6:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getReport7 = async (req: Request, res: Response) => {
    const { city, region } = req.query;
    let conn;

    if (!city && !region) {
        return res.status(400).json({ message: 'At least one of city or region is required' });
    }

    try {
        conn = await pool.getConnection();

        let query = `
            SELECT DISTINCT v.*
            FROM vehicle v
            JOIN traffic_violation tv ON v.plate_number = tv.plate_number
            WHERE
        `;
        const values: any[] = [];
        const conditions: string[] = [];

        if (city) {
            conditions.push('tv.violation_location_city = ?');
            values.push(city);
        }
        if (region) {
            conditions.push('tv.violation_location_region = ?');
            values.push(region);
        }

        query += conditions.join(' OR ');

        const rows = await conn.query(query, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error running report 7:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getReport1,
    getReport2,
    getReport3,
    getReport4,
    getReport5,
    getReport6,
    getReport7
};