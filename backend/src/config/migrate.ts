import fs from 'fs';
import path from 'path';
import { db } from './db';

export async function runMigrations() {
  console.log('🔄 Starting database migration and seeding...');
  const sqlDir = path.resolve(__dirname, '../../database/sql/mysql');
  const files = [
    '001_create_tables_mysql.sql',
    '002_create_indexes_mysql.sql',
    '003_seed_data_mysql.sql',
  ];

  const client = await db.getClient();
  try {
    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`⏳ Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf-8');
        const statements = sql
          .split(';')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          try {
            await client.query(statement);
          } catch (stmtErr) {
            console.error(`Error in statement in ${file}:\n${statement.substring(0, 150)}...`);
            throw stmtErr;
          }
        }
        console.log(`✅ Completed ${file}`);
      } else {
        console.warn(`⚠️ Warning: SQL file not found: ${filePath}`);
      }
    }
    console.log('🎉 Database initialized and seeded successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    // Do not end pool if called during server start
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
