import { courseBatchRepository } from '../repositories/courseBatchRepository';

export const courseBatchService = {
  async listCourses(coachingId?: number | null) {
    return await courseBatchRepository.getCourses(coachingId);
  },

  async createCourse(data: {
    coaching_id: number;
    course_name: string;
    duration?: string;
    default_fee?: number;
    is_active?: boolean;
  }) {
    return await courseBatchRepository.createCourse({
      coaching_id: data.coaching_id,
      course_name: data.course_name.trim(),
      duration: data.duration?.trim(),
      default_fee: data.default_fee,
      is_active: data.is_active,
    });
  },

  async updateCourse(id: number, data: any) {
    const updated = await courseBatchRepository.updateCourse(id, data);
    if (!updated) throw new Error('Course not found');
    return updated;
  },

  async deleteCourse(id: number) {
    const deleted = await courseBatchRepository.deleteCourse(id);
    if (!deleted) throw new Error('Course not found or could not be deleted');
    return true;
  },

  async listBatches(coachingId?: number | null, courseId?: number) {
    return await courseBatchRepository.getBatches(coachingId, courseId);
  },

  async createBatch(coachingId: number, data: {
    course_id?: number | null;
    batch_id_code: string;
    batch_name: string;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
  }) {
    return await courseBatchRepository.createBatch({
      coaching_id: coachingId,
      course_id: data.course_id,
      batch_id_code: data.batch_id_code.trim(),
      batch_name: data.batch_name.trim(),
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_active: data.is_active,
    });
  },

  async updateBatch(id: number, coachingId: number, data: any) {
    const updated = await courseBatchRepository.updateBatch(id, coachingId, data);
    if (!updated) throw new Error('Batch not found');
    return updated;
  },
};
