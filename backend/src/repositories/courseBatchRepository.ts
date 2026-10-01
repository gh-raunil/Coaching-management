import { db } from '../config/db';

export interface CourseRow {
  id: number;
  coaching_id: number;
  course_name: string;
  duration: string | null;
  default_fee: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BatchRow {
  id: number;
  coaching_id: number;
  course_id: number | null;
  batch_id_code: string;
  batch_name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const courseBatchRepository = {
  async getCourses(coachingId?: number | null) {
    let query: string;
    let params: any[] = [];

    if (coachingId) {
      query = `
        SELECT c.*, 
          co.name AS coaching_name,
          COUNT(DISTINCT b.id) AS batch_count,
          COUNT(DISTINCT s.id) AS student_count
        FROM courses c
        JOIN coaching_courses cc ON cc.course_id = c.id
        LEFT JOIN coachings co ON co.id = cc.coaching_id
        LEFT JOIN batches b ON b.course_id = c.id AND b.coaching_id = $1
        LEFT JOIN students s ON s.course_name = c.course_name AND s.coaching_id = $1
        WHERE cc.coaching_id = $1
        GROUP BY c.id, co.name
        ORDER BY c.created_at DESC
      `;
      params = [coachingId];
    } else {
      query = `
        SELECT c.*,
          COUNT(DISTINCT cc.coaching_id) AS coaching_count,
          COUNT(DISTINCT b.id) AS batch_count,
          COUNT(DISTINCT s.id) AS student_count
        FROM courses c
        LEFT JOIN coaching_courses cc ON cc.course_id = c.id
        LEFT JOIN batches b ON b.course_id = c.id
        LEFT JOIN students s ON s.course_name = c.course_name
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
    }

    const res = await db.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      default_fee: parseFloat(r.default_fee),
      coaching_count: r.coaching_count ? parseInt(r.coaching_count, 10) : (coachingId ? 1 : 0),
      batch_count: parseInt(r.batch_count || '0', 10),
      student_count: parseInt(r.student_count || '0', 10),
    }));
  },

  async createCourse(data: {
    course_name: string;
    duration?: string | null;
    default_fee?: number;
    is_active?: boolean;
    coaching_id?: number | null;
  }): Promise<CourseRow> {
    const res = await db.query<CourseRow>(
      `INSERT INTO courses (coaching_id, course_name, duration, default_fee, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.coaching_id || null,
        data.course_name,
        data.duration || '',
        data.default_fee || 0,
        data.is_active ?? true,
      ]
    );
    const course = res.rows[0];
    if (data.coaching_id) {
      await db.query(
        `INSERT INTO coaching_courses (coaching_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [data.coaching_id, course.id]
      );
    }
    return course;
  },

  async bulkCreateCourses(courses: Array<{
    course_name: string;
    duration?: string | null;
    default_fee?: number;
    is_active?: boolean;
  }>): Promise<CourseRow[]> {
    const createdCourses: CourseRow[] = [];
    for (const c of courses) {
      if (!c.course_name || !c.course_name.trim()) continue;
      const res = await db.query<CourseRow>(
        `INSERT INTO courses (course_name, duration, default_fee, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          c.course_name.trim(),
          c.duration?.trim() || '',
          c.default_fee || 0,
          c.is_active ?? true,
        ]
      );
      createdCourses.push(res.rows[0]);
    }
    return createdCourses;
  },

  async updateCourse(
    id: number,
    data: Partial<CourseRow>
  ): Promise<CourseRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.coaching_id !== undefined) {
      fields.push(`coaching_id = $${idx++}`);
      values.push(data.coaching_id);
    }
    if (data.course_name !== undefined) {
      fields.push(`course_name = $${idx++}`);
      values.push(data.course_name);
    }
    if (data.duration !== undefined) {
      fields.push(`duration = $${idx++}`);
      values.push(data.duration);
    }
    if (data.default_fee !== undefined) {
      fields.push(`default_fee = $${idx++}`);
      values.push(data.default_fee);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await db.query<CourseRow>(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async deleteCourse(id: number): Promise<boolean> {
    const res = await db.query(`DELETE FROM courses WHERE id = $1 RETURNING id`, [id]);
    return res.rows.length > 0;
  },

  async getBatches(coachingId?: number | null, courseId?: number) {
    let query = `
      SELECT 
        b.*,
        c.course_name,
        co.name AS coaching_name,
        COUNT(DISTINCT s.id) AS student_count
      FROM batches b
      JOIN coachings co ON co.id = b.coaching_id
      LEFT JOIN courses c ON b.course_id = c.id
      LEFT JOIN students s ON s.batch_id = b.batch_id_code AND s.coaching_id = b.coaching_id
    `;
    const params: any[] = [];
    if (coachingId) {
      params.push(coachingId);
      query += ` WHERE b.coaching_id = $1`;
    }

    if (courseId) {
      params.push(courseId);
      query += params.length === 1 ? ` WHERE b.course_id = $1` : ` AND b.course_id = $2`;
    }

    query += ` GROUP BY b.id, c.course_name, co.name ORDER BY b.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      student_count: parseInt(r.student_count || '0', 10),
    }));
  },

  async createBatch(data: {
    coaching_id: number;
    course_id?: number | null;
    batch_id_code: string;
    batch_name: string;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
  }): Promise<BatchRow> {
    const res = await db.query<BatchRow>(
      `INSERT INTO batches (coaching_id, course_id, batch_id_code, batch_name, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.coaching_id,
        data.course_id || null,
        data.batch_id_code,
        data.batch_name,
        data.start_date || null,
        data.end_date || null,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  },

  async updateBatch(
    id: number,
    coachingId: number,
    data: Partial<BatchRow>
  ): Promise<BatchRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.course_id !== undefined) {
      fields.push(`course_id = $${idx++}`);
      values.push(data.course_id);
    }
    if (data.batch_id_code !== undefined) {
      fields.push(`batch_id_code = $${idx++}`);
      values.push(data.batch_id_code);
    }
    if (data.batch_name !== undefined) {
      fields.push(`batch_name = $${idx++}`);
      values.push(data.batch_name);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(data.end_date);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, coachingId);

    const res = await db.query<BatchRow>(
      `UPDATE batches SET ${fields.join(', ')} WHERE id = $${idx++} AND coaching_id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },
};
