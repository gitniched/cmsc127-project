import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
    host: process.env.MARIADB_HOST || 'localhost',
    user: process.env.MARIADB_USER || 'root',
    password: process.env.MARIADB_PASSWORD,
    database: process.env.MARIADB_DATABASE,
    insertIdAsNumber: true,
    bigIntAsNumber: true,
    connectionLimit: 5
});

export default pool;

