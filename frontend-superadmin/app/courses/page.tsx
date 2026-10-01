'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import {
  BookOpen,
  Plus,
  Search,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
  Ban,
  RefreshCw,
  Clock,
  IndianRupee,
  Users,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { Course, Coaching } from '@/types';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

interface CourseDraft {
  id: string;
  course_name: string;
  duration: string;
  default_fee: number;
  is_active: boolean;
}

export default function SuperadminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoachingId, setSelectedCoachingId] = useState<string>('ALL');

  // Multi-add Course Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [courseDrafts, setCourseDrafts] = useState<CourseDraft[]>([
    { id: '1', course_name: '', duration: '', default_fee: 0, is_active: true },
  ]);

  // Edit Course Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({
    course_name: '',
    duration: '',
    default_fee: 0,
    is_active: true,
  });

  // Delete Course Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, coachingsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/superadmin/coachings'),
      ]);
      setCourses(coursesRes.data.data || []);
      setCoachings(coachingsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load courses or coaching institutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Multi-course form handlers
  const handleAddDraftRow = () => {
    setCourseDrafts((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        course_name: '',
        duration: '',
        default_fee: 0,
        is_active: true,
      },
    ]);
  };

  const handleRemoveDraftRow = (id: string) => {
    if (courseDrafts.length <= 1) {
      toast.error('At least one course is required');
      return;
    }
    setCourseDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDraftChange = (id: string, field: keyof CourseDraft, value: any) => {
    setCourseDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleCreateCourses = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const emptyNames = courseDrafts.filter((d) => !d.course_name.trim());
    if (emptyNames.length > 0) {
      toast.error('Please enter a course name for all added courses');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        courses: courseDrafts.map((d) => ({
          course_name: d.course_name.trim(),
          duration: d.duration.trim() || undefined,
          default_fee: Number(d.default_fee) || 0,
          is_active: d.is_active,
        })),
      };

      await api.post('/courses', payload);
      toast.success(
        courseDrafts.length > 1
          ? `${courseDrafts.length} courses created successfully!`
          : 'Course created successfully!'
      );
      setIsAddOpen(false);
      setCourseDrafts([
        { id: '1', course_name: '', duration: '', default_fee: 0, is_active: true },
      ]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create courses');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourse) return;
    if (!editForm.course_name.trim()) {
      toast.error('Course name is required');
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/courses/${targetCourse.id}`, {
        course_name: editForm.course_name.trim(),
        duration: editForm.duration.trim() || undefined,
        default_fee: Number(editForm.default_fee) || 0,
        is_active: editForm.is_active,
      });

      toast.success('Course updated successfully!');
      setIsEditOpen(false);
      setTargetCourse(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setActionLoading(true);
      await api.delete(`/courses/${courseToDelete.id}`);
      toast.success('Course deleted successfully');
      setIsDeleteOpen(false);
      setCourseToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (c: Course) => {
    setTargetCourse(c);
    setEditForm({
      course_name: c.course_name,
      duration: c.duration || '',
      default_fee: c.default_fee,
      is_active: c.is_active,
    });
    setIsEditOpen(true);
  };

  const toggleStatus = async (c: Course) => {
    try {
      await api.put(`/courses/${c.id}`, { is_active: !c.is_active });
      toast.success(`Course ${!c.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to change course status');
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch = c.course_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.is_active).length;
  const totalAllotments = courses.reduce((acc, c) => acc + (c.coaching_count || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Master Courses Catalog"
          subtitle="Superadmin exclusive control: Define platform master courses and assign them across coaching centers"
        />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Master Courses</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCourses}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Defined by Superadmin</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Offerings</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCourses}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready for institute allotment</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Allotments</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalAllotments}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Assigned to coaching institutes</p>
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search master course name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setCourseDrafts([
                    { id: '1', course_name: '', duration: '', default_fee: 0, is_active: true },
                  ]);
                  setIsAddOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </button>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Course Name</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Default Fee</th>
                    <th className="py-3 px-4 text-center">Allotted Institutes</th>
                    <th className="py-3 px-4 text-center">Total Batches</th>
                    <th className="py-3 px-4 text-center">Total Students</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                        Loading master courses...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No courses found. Click "+ Create Course" to add master courses.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{c.course_name}</div>
                          <div className="text-xs text-slate-400">ID #{c.id}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {c.duration ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {c.duration}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          {Number(c.default_fee) > 0 ? (
                            formatINR(c.default_fee)
                          ) : (
                            <span className="text-slate-400">₹ 0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Building2 className="w-3 h-3" />
                            {c.coaching_count || 0} Institute{(c.coaching_count || 0) === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {c.batch_count || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {c.student_count || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              c.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleStatus(c)}
                              className={`p-1.5 rounded-lg border transition ${
                                c.is_active
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={c.is_active ? 'Deactivate course' : 'Activate course'}
                            >
                              {c.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit Course"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setCourseToDelete(c);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Course (Superadmin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MASTER COURSE(S) MODAL WITH DYNAMIC MULTI-ADD */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Master Course(s)"
        subtitle="Add one or more platform master courses that can be assigned to coaching branches"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateCourses} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Course Entries ({courseDrafts.length})
            </span>
            <button
              type="button"
              onClick={handleAddDraftRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Course
            </button>
          </div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {courseDrafts.map((draft, index) => (
              <div
                key={draft.id}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl relative space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Course #{index + 1}
                    </span>
                  </div>
                  {courseDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftRow(draft.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                      title="Remove this course section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JEE Advanced Physics & Math"
                      value={draft.course_name}
                      onChange={(e) => handleDraftChange(draft.id, 'course_name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2-Year Program / 6 Months"
                      value={draft.duration}
                      onChange={(e) => handleDraftChange(draft.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Standard Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 25000"
                      value={draft.default_fee}
                      onChange={(e) =>
                        handleDraftChange(draft.id, 'default_fee', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAddDraftRow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add more courses
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {actionLoading
                  ? 'Creating...'
                  : courseDrafts.length > 1
                  ? `Create ${courseDrafts.length} Courses`
                  : 'Create Course'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* EDIT COURSE MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Master Course"
        subtitle="Modify details of this platform master course"
        size="md"
      >
        <form onSubmit={handleUpdateCourse} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              value={editForm.course_name}
              onChange={(e) => setEditForm({ ...editForm, course_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                placeholder="e.g. 1 Year / 6 Months"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={editForm.default_fee}
                onChange={(e) => setEditForm({ ...editForm, default_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active_edit" className="text-slate-700 font-medium">
              Course is active and available for institute allotment
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Saving...' : 'Update Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Master Course"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete course <b>"{courseToDelete?.course_name}"</b>?
            </p>
          </div>
          <p className="text-xs text-slate-500">
            This action will permanently remove this course from the master catalog. If student records or batches are already linked, deletion will be safely rejected.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteCourse}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
