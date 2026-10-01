import { db } from '../config/db';

export const settingsRepository = {
  async getByCoachingId(coachingId: number) {
    const res = await db.query(
      `SELECT 
        c.id AS coaching_id,
        c.name,
        c.email,
        c.contact_number,
        c.address_line1,
        c.city,
        c.state,
        c.pincode,
        c.logo_url,
        c.website,
        c.status,
        cs.receipt_header_title,
        cs.receipt_footer_msg,
        cs.receipt_notes_line1,
        cs.receipt_notes_line2,
        cs.receipt_notes_line3,
        cs.whatsapp_number,
        cs.support_email
       FROM coachings c
       LEFT JOIN coaching_settings cs ON cs.coaching_id = c.id
       WHERE c.id = $1`,
      [coachingId]
    );

    return res.rows[0] || null;
  },

  async updateSettings(
    coachingId: number,
    data: {
      name?: string;
      contact_number?: string;
      address_line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
      logo_url?: string | null;
      website?: string | null;
      receipt_header_title?: string | null;
      receipt_footer_msg?: string | null;
      receipt_notes_line1?: string | null;
      receipt_notes_line2?: string | null;
      receipt_notes_line3?: string | null;
      whatsapp_number?: string | null;
      support_email?: string | null;
    }
  ) {
    // 1. Update coaching base info if provided
    const coachingFields: string[] = [];
    const coachingValues: any[] = [];
    let cIdx = 1;

    const cKeys: ('name' | 'contact_number' | 'address_line1' | 'city' | 'state' | 'pincode' | 'logo_url' | 'website')[] = [
      'name', 'contact_number', 'address_line1', 'city', 'state', 'pincode', 'logo_url', 'website'
    ];

    for (const key of cKeys) {
      if (data[key] !== undefined) {
        coachingFields.push(`${key} = $${cIdx++}`);
        coachingValues.push(data[key]);
      }
    }

    if (coachingFields.length > 0) {
      coachingFields.push(`updated_at = CURRENT_TIMESTAMP`);
      coachingValues.push(coachingId);
      await db.query(
        `UPDATE coachings SET ${coachingFields.join(', ')} WHERE id = $${cIdx}`,
        coachingValues
      );
    }

    // 2. Upsert coaching settings
    await db.query(
      `INSERT INTO coaching_settings (
        coaching_id, receipt_header_title, receipt_footer_msg,
        receipt_notes_line1, receipt_notes_line2, receipt_notes_line3,
        whatsapp_number, support_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (coaching_id) DO UPDATE SET
        receipt_header_title = COALESCE(EXCLUDED.receipt_header_title, coaching_settings.receipt_header_title),
        receipt_footer_msg = COALESCE(EXCLUDED.receipt_footer_msg, coaching_settings.receipt_footer_msg),
        receipt_notes_line1 = COALESCE(EXCLUDED.receipt_notes_line1, coaching_settings.receipt_notes_line1),
        receipt_notes_line2 = COALESCE(EXCLUDED.receipt_notes_line2, coaching_settings.receipt_notes_line2),
        receipt_notes_line3 = COALESCE(EXCLUDED.receipt_notes_line3, coaching_settings.receipt_notes_line3),
        whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, coaching_settings.whatsapp_number),
        support_email = COALESCE(EXCLUDED.support_email, coaching_settings.support_email),
        updated_at = CURRENT_TIMESTAMP`,
      [
        coachingId,
        data.receipt_header_title ?? null,
        data.receipt_footer_msg ?? null,
        data.receipt_notes_line1 ?? null,
        data.receipt_notes_line2 ?? null,
        data.receipt_notes_line3 ?? null,
        data.whatsapp_number ?? null,
        data.support_email ?? null,
      ]
    );

    return await this.getByCoachingId(coachingId);
  },
};
