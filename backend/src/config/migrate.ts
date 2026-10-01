import fs from 'fs';
import path from 'path';
import { db } from './db';

export async function runMigrations() {
  console.log('🔄 Starting database migration and seeding...');
  const sqlDir = path.resolve(__dirname, '../../database/sql');
  const files = [
    '001_create_tables.sql',
    '002_create_indexes.sql',
    '003_seed_data.sql',
  ];

  const client = await db.getClient();
  try {
    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`⏳ Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await client.query(sql);
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
