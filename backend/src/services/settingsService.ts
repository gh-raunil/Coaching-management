import { settingsRepository } from '../repositories/settingsRepository';

export const settingsService = {
  async getSettings(coachingId: number) {
    const settings = await settingsRepository.getByCoachingId(coachingId);
    if (!settings) throw new Error('Settings not found for this coaching');
    return settings;
  },

  async updateSettings(coachingId: number, data: any) {
    return await settingsRepository.updateSettings(coachingId, data);
  },
};
