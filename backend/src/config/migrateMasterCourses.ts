import { db } from '../config/db';

export async function migrateMasterCourses() {
  const client = await db.getClient();
  try {
    console.log('🔄 Running Master Courses migration...');
    await client.query('BEGIN');

    // 1. Create coaching_courses junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coaching_courses (
        id SERIAL PRIMARY KEY,
        coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
        course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_coaching_course_link UNIQUE (coaching_id, course_id)
      );
    `);

    // 2. Make coaching_id in courses nullable
    await client.query(`
      ALTER TABLE courses ALTER COLUMN coaching_id DROP NOT NULL;
    `);

    // 3. Drop old uq_coaching_course constraint if exists
    await client.query(`
      ALTER TABLE courses DROP CONSTRAINT IF EXISTS uq_coaching_course;
    `);

    // 4. Populate coaching_courses from existing courses where coaching_id is not null
    await client.query(`
      INSERT INTO coaching_courses (coaching_id, course_id)
      SELECT coaching_id, id FROM courses
      WHERE coaching_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    `);

    // 5. Create index on coaching_courses
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_coaching_courses_coaching ON coaching_courses(coaching_id);
      CREATE INDEX IF NOT EXISTS idx_coaching_courses_course ON coaching_courses(course_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Master Courses migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateMasterCourses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
