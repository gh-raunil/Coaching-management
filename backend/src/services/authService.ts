import { userRepository } from '../repositories/userRepository';
import { coachingRepository } from '../repositories/coachingRepository';
import { comparePassword, hashPassword } from '../utils/hash';
import { generateToken, TokenPayload } from '../utils/jwt';
import { db } from '../config/db';

export const authService = {
  async login(email: string, passwordPlain: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new Error('Your account is deactivated. Please contact support.');
    }

    const isMatch = await comparePassword(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    let coachingId: number | null = null;
    let coachingName: string | null = null;
    let coachingStatus: 'ACTIVE' | 'SUSPENDED' | null = null;

    if (user.role === 'COACHING_ADMIN') {
      const caRes = await db.query(
        `SELECT ca.coaching_id, c.name, c.status
         FROM coaching_admins ca
         JOIN coachings c ON ca.coaching_id = c.id
         WHERE ca.user_id = $1`,
        [user.id]
      );

      if (caRes.rows.length === 0) {
        throw new Error('No coaching institute is mapped to this account.');
      }

      const c = caRes.rows[0];
      if (c.status === 'SUSPENDED') {
        throw new Error('Your coaching institute is suspended. Access denied.');
      }

      coachingId = c.coaching_id;
      coachingName = c.name;
      coachingStatus = c.status;
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      coachingId,
    };

    const token = generateToken(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        coachingId,
        coachingName,
        coachingStatus,
      },
    };
  },

  async getMe(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    let coachingInfo = null;
    if (user.role === 'COACHING_ADMIN') {
      const caRes = await db.query(
        `SELECT ca.coaching_id, c.name, c.status, c.logo_url
         FROM coaching_admins ca
         JOIN coachings c ON ca.coaching_id = c.id
         WHERE ca.user_id = $1`,
        [user.id]
      );
      if (caRes.rows.length > 0) {
        coachingInfo = caRes.rows[0];
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      coaching: coachingInfo,
    };
  },

  async changePassword(userId: number, currentPass: string, newPass: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found.');

    const isMatch = await comparePassword(currentPass, user.password_hash);
    if (!isMatch) {
      throw new Error('Incorrect current password.');
    }

    const newHash = await hashPassword(newPass);
    await userRepository.updatePassword(userId, newHash);
  },
};
