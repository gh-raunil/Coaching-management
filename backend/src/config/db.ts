import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coaching',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
});

/**
 * Unified database interface used throughout the backend.
 * It mimics the previous PostgreSQL API (`db.query`, `db.getClient`, `db.transaction`).
 */
export const db = {
  /**
   * Execute a SQL query.
   * @param text SQL statement with `?` or `$n` placeholders for parameters.
   * @param params Optional array of parameters.
   * @returns An object containing `rows` (array of result rows) and `fields`.
   */
  query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; fields?: any }> => {
    const start = Date.now();
    try {
      const converted = params && params.length ? text.replace(/\$\d+/g, '?') : text;
      const result = params && params.length ? await pool.query(converted, params) : await pool.query(converted);
      const rows = (Array.isArray(result[0]) ? result[0] : [result[0]]) as T[];
      const fields = result[1];
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log(`[SQL Query (${duration}ms)]:`, text.substring(0, 80));
      }
      return { rows, fields };
    } catch (error) {
      console.error('[SQL Error]:', error, '\nQuery:', text, '\nParams:', params);
      throw error;
    }
  },

  /**
   * Get a client connection for manual queries.
   * Returns an object with a `query` method that mimics the main `db.query` but works on the same connection.
   */
  getClient: async () => {
    const connection = await pool.getConnection();
    const client = {
      query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; fields?: any }> => {
        const converted = params && params.length ? text.replace(/\$\d+/g, '?') : text;
        const result = params && params.length ? await connection.query(converted, params) : await connection.query(converted);
        const rows = (Array.isArray(result[0]) ? result[0] : [result[0]]) as T[];
        const fields = result[1];
        return { rows, fields };
      },
      release: () => connection.release(),
    };
    return client;
  },

  /**
   * Execute a series of queries within a transaction.
   * The callback receives a client with the same `query` interface.
   */
  transaction: async <T = any>(callback: (client: any) => Promise<T>): Promise<T> => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const client = {
        query: async <R = any>(text: string, params?: any[]): Promise<{ rows: R[]; fields?: any }> => {
          const converted = params && params.length ? text.replace(/\$\d+/g, '?') : text;
          const result = params && params.length ? await connection.query(converted, params) : await connection.query(converted);
          const rows = (Array.isArray(result[0]) ? result[0] : [result[0]]) as R[];
          const fields = result[1];
          return { rows, fields };
        },
      };
      const result = await callback(client);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // Export the pool for any direct usage if needed.
  pool,
};

export default db;
