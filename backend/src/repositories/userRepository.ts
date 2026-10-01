import { db } from '../config/db';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'SUPERADMIN' | 'COACHING_ADMIN';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const userRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const res = await db.query<UserRow>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id: number): Promise<UserRow | null> {
    const res = await db.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
    return res.rows[0] || null;
  },

  async createUser(
    name: string,
    email: string,
    passwordHash: string,
    role: 'SUPERADMIN' | 'COACHING_ADMIN',
    client: any = db
  ): Promise<UserRow> {
    const res = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, LOWER($2), $3, $4, true)
       RETURNING *`,
      [name, email, passwordHash, role]
    );
    return res.rows[0];
  },

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, userId]
    );
  },

  async updateProfile(userId: number, name: string): Promise<UserRow | null> {
    const res = await db.query<UserRow>(
      `UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [name, userId]
    );
    return res.rows[0] || null;
  },

  async updateActiveStatus(userId: number, isActive: boolean): Promise<void> {
    await db.query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [isActive, userId]
    );
  },

  async getAdminsByCoaching(coachingId: number) {
    const res = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, ca.is_primary
       FROM users u
       JOIN coaching_admins ca ON u.id = ca.user_id
       WHERE ca.coaching_id = $1
       ORDER BY ca.is_primary DESC, u.created_at ASC`,
      [coachingId]
    );
    return res.rows;
  },

  async assignAdminToCoaching(
    coachingId: number,
    userId: number,
    isPrimary = false,
    client: any = db
  ): Promise<void> {
    await client.query(
      `INSERT INTO coaching_admins (coaching_id, user_id, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT (coaching_id, user_id) DO UPDATE SET is_primary = $3`,
      [coachingId, userId, isPrimary]
    );
  },

  async removeAdminFromCoaching(coachingId: number, userId: number): Promise<void> {
    await db.query(
      `DELETE FROM coaching_admins WHERE coaching_id = $1 AND user_id = $2`,
      [coachingId, userId]
    );
  },
};
