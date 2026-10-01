import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { db } from '../config/db';
import { sendError } from '../utils/response';

export interface AuthUser extends TokenPayload {
  coachingStatus?: 'ACTIVE' | 'SUSPENDED';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      sendError(res, 'Authentication required. No session found.', 401);
      return;
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      sendError(res, 'Invalid or expired session. Please log in again.', 401);
      return;
    }

    // Verify user in database
    const userRes = await db.query(
      `SELECT id, email, name, role, is_active FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      sendError(res, 'Account is inactive or has been deleted.', 403);
      return;
    }

    const user = userRes.rows[0];

    // If COACHING_ADMIN, fetch coaching association and check coaching status
    if (user.role === 'COACHING_ADMIN') {
      const caRes = await db.query(
        `SELECT ca.coaching_id, c.status AS coaching_status, c.name AS coaching_name
         FROM coaching_admins ca
         JOIN coachings c ON ca.coaching_id = c.id
         WHERE ca.user_id = $1`,
        [user.id]
      );

      if (caRes.rows.length === 0) {
        sendError(res, 'No coaching institute assigned to this account.', 403);
        return;
      }

      const coachingInfo = caRes.rows[0];

      if (coachingInfo.coaching_status === 'SUSPENDED') {
        sendError(res, 'Your coaching institute is currently suspended. Please contact superadmin.', 403);
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        coachingId: coachingInfo.coaching_id,
        coachingStatus: coachingInfo.coaching_status,
      };
    } else {
      // SUPERADMIN
      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        coachingId: null,
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    sendError(res, 'Authentication failed', 500);
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    sendError(res, 'Access denied. Superadmin privileges required.', 403);
    return;
  }
  next();
}

export function requireCoachingAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'COACHING_ADMIN') {
    sendError(res, 'Access denied. Coaching administrator privileges required.', 403);
    return;
  }
  if (!req.user.coachingId) {
    sendError(res, 'Access denied. No coaching institute associated.', 403);
    return;
  }
  next();
}
