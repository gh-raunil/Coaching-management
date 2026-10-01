import { db } from '../config/db';
import { coachingRepository } from '../repositories/coachingRepository';
import { userRepository } from '../repositories/userRepository';
import { studentRepository } from '../repositories/studentRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { hashPassword } from '../utils/hash';

export const superadminService = {
  async getDashboardStats() {
    return await coachingRepository.getGlobalStats();
  },

  async listCoachings(search?: string, status?: string) {
    return await coachingRepository.findAll(search, status);
  },

  async getCoachingDetails(id: number) {
    const coaching = await coachingRepository.findById(id);
    if (!coaching) throw new Error('Coaching not found');

    const admins = await userRepository.getAdminsByCoaching(id);
    return {
      ...coaching,
      admins,
    };
  },

  async registerCoaching(data: {
    name: string;
    email: string;
    contact_number: string;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    website?: string | null;
    logo_url?: string | null;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }) {
    // Check if admin email already exists
    const existingUser = await userRepository.findByEmail(data.admin_email);
    if (existingUser) {
      throw new Error(`An account with email ${data.admin_email} already exists.`);
    }

    const adminHash = await hashPassword(data.admin_password);

    return await db.transaction(async (client) => {
      // 1. Create Coaching
      const coachingRes = await client.query(
        `INSERT INTO coachings (name, email, contact_number, address_line1, city, state, pincode, website, logo_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
         RETURNING *`,
        [
          data.name,
          data.email,
          data.contact_number,
          data.address_line1,
          data.city,
          data.state,
          data.pincode,
          data.website || null,
          data.logo_url || null,
        ]
      );
      const coaching = coachingRes.rows[0];

      // 2. Create Default Coaching Settings
      await client.query(
        `INSERT INTO coaching_settings (
          coaching_id, receipt_header_title, receipt_footer_msg,
          receipt_notes_line1, receipt_notes_line2, receipt_notes_line3,
          whatsapp_number, support_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          coaching.id,
          `${data.name} - Tuition & Coaching`,
          'We appreciate your trust in us.',
          'Fee paid are non-refundable nor transferable at any case. This is a system generated bill.',
          `Please share the payment screenshot on our WhatsApp number: ${data.contact_number} or email.`,
          `For any queries or assistance, contact us: ${data.email}`,
          data.contact_number,
          data.email,
        ]
      );

      // 3. Create Primary Admin User
      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, LOWER($2), $3, 'COACHING_ADMIN', true)
         RETURNING id, name, email, role, is_active`,
        [data.admin_name, data.admin_email, adminHash]
      );
      const adminUser = userRes.rows[0];

      // 4. Map Admin to Coaching
      await client.query(
        `INSERT INTO coaching_admins (coaching_id, user_id, is_primary)
         VALUES ($1, $2, true)`,
        [coaching.id, adminUser.id]
      );

      return {
        coaching,
        admin: adminUser,
      };
    });
  },

  async updateCoaching(id: number, data: any) {
    const updated = await coachingRepository.update(id, data);
    if (!updated) throw new Error('Coaching not found');
    return updated;
  },

  async setCoachingStatus(id: number, status: 'ACTIVE' | 'SUSPENDED') {
    const updated = await coachingRepository.updateStatus(id, status);
    if (!updated) throw new Error('Coaching not found');
    return updated;
  },

  async addCoachingAdmin(coachingId: number, data: {
    name: string;
    email: string;
    password: string;
    is_primary?: boolean;
  }) {
    const coaching = await coachingRepository.findById(coachingId);
    if (!coaching) throw new Error('Coaching institute not found');

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    const passwordHash = await hashPassword(data.password);

    return await db.transaction(async (client) => {
      const user = await userRepository.createUser(
        data.name,
        data.email,
        passwordHash,
        'COACHING_ADMIN',
        client
      );

      await userRepository.assignAdminToCoaching(
        coachingId,
        user.id,
        data.is_primary || false,
        client
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        is_primary: data.is_primary || false,
      };
    });
  },

  async toggleAdminActive(userId: number, isActive: boolean) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'SUPERADMIN') throw new Error('Cannot toggle superadmin status here');

    await userRepository.updateActiveStatus(userId, isActive);
    return { id: userId, is_active: isActive };
  },

  async resetAdminPassword(userId: number, newPasswordPlain: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const newHash = await hashPassword(newPasswordPlain);
    await userRepository.updatePassword(userId, newHash);
    return { success: true };
  },

  async removeAdmin(coachingId: number, userId: number) {
    // Check if primary
    const admins = await userRepository.getAdminsByCoaching(coachingId);
    if (admins.length <= 1) {
      throw new Error('Cannot remove the only administrator of a coaching.');
    }

    await userRepository.removeAdminFromCoaching(coachingId, userId);
    return { success: true };
  },

  async getGlobalStudents(params: { search?: string; course?: string; batch?: string; paymentStatus?: string; coachingId?: number }) {
    return await studentRepository.findAll(params);
  },

  async getGlobalRevenue(range: string = 'THIS_MONTH', customStart?: string, customEnd?: string) {
    return await paymentRepository.getRevenueStats(null, range, customStart, customEnd);
  },
};
