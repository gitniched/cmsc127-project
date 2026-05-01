import { Request, Response} from "express";
import pool from "../../config/mariadb";
import { Vehicle } from "@shared/types/type";

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
        const result = await conn.query(query, values);

        res.status(201).json({ message: 'Vehicle added successfully', id: Number(result.insertId) });
    } catch (error) {
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

    let conn;

    try {
        conn = await pool.getConnection();
        const fields = Object.keys(data).filter(key => key !== 'plate_number').map(key => `${key} = ?`).join(', ');
        const values = Object.keys(data).filter(key => key !== 'plate_number').map(key => (data as any)[key]);

        values.push(plate_number); // For the WHERE clause

        const query = `UPDATE vehicle SET ${fields} WHERE plate_number = ?`;
        const result = await conn.query(query, values);

        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle updated successfully' });
    } catch (error) {
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
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getVehicleByOwnerDriverLicense = async (req: Request, res: Response) => {
    let conn;
    const  owner_license_number  = req.params.license_number;

    try {
        conn = await pool.getConnection();

        let query = 'SELECT * FROM vehicle WHERE owner_license_number = ?';
        const results: Vehicle[] = await conn.query(query, [owner_license_number]);

        if(results.length === 0) {
            return res.status(404).json({ message: 'No vehicles found for the given owner license number' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
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
            WHERE vr.expiration_date <= ? 
            AND vr.registration_status = 'Expired'
        `;
        
        const results = await conn.query(query, [as_of_date]);
        res.status(200).json(results);

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
    getVehicleByOwnerDriverLicense,
    getExpiredVehicles
};
