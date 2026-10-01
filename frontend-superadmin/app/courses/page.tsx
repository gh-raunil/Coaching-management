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
} from 'lucide-react';
import api from '@/lib/api';
import { Course, Coaching } from '@/types';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

export default function SuperadminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoachingId, setSelectedCoachingId] = useState<string>('ALL');

  // Add / Allot Course Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);

  // Delete Course Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [form, setForm] = useState({
    coaching_id: '',
    course_name: '',
    duration: '',
    default_fee: 0,
    is_active: true,
  });

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

  const handleAllotCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.coaching_id) {
      toast.error('Please select a coaching institute to allot this course to');
      return;
    }
    if (!form.course_name.trim()) {
      toast.error('Course name is required');
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/courses', {
        coaching_id: Number(form.coaching_id),
        course_name: form.course_name.trim(),
        duration: form.duration.trim() || undefined,
        default_fee: Number(form.default_fee) || 0,
        is_active: form.is_active,
      });

      toast.success('Course successfully created and allotted to institute!');
      setIsAddOpen(false);
      setForm({
        coaching_id: '',
        course_name: '',
        duration: '',
        default_fee: 0,
        is_active: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to allot course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourse) return;

    try {
      setActionLoading(true);
      await api.put(`/courses/${targetCourse.id}`, {
        coaching_id: form.coaching_id ? Number(form.coaching_id) : targetCourse.coaching_id,
        course_name: form.course_name.trim(),
        duration: form.duration.trim() || undefined,
        default_fee: Number(form.default_fee) || 0,
        is_active: form.is_active,
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
    setForm({
      coaching_id: String(c.coaching_id),
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
    const matchesSearch =
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.coaching_name && c.coaching_name.toLowerCase().includes(search.toLowerCase()));
    const matchesCoaching =
      selectedCoachingId === 'ALL' ? true : String(c.coaching_id) === selectedCoachingId;
    return matchesSearch && matchesCoaching;
  });

  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.is_active).length;
  const uniqueInstitutes = new Set(courses.map((c) => c.coaching_id)).size;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Courses Allotment & Management"
          subtitle="Superadmin exclusive control: Create, allot, and manage academic courses across coaching branches"
        />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Allotted Courses</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCourses}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Across all institutes</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Offerings</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCourses}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Available for student enrollment</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Institutes Configured</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{uniqueInstitutes}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Institutes with active courses</p>
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search course name or institute..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedCoachingId}
                onChange={(e) => setSelectedCoachingId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none min-w-[200px]"
              >
                <option value="ALL">All Coaching Institutes</option>
                {coachings.map((co) => (
                  <option key={co.id} value={String(co.id)}>
                    {co.name} {co.city ? `(${co.city})` : ''}
                  </option>
                ))}
              </select>
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
                  setForm({
                    coaching_id: coachings.length > 0 ? String(coachings[0].id) : '',
                    course_name: '',
                    duration: '',
                    default_fee: 0,
                    is_active: true,
                  });
                  setIsAddOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Allot Course to Institute
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
                    <th className="py-3 px-4">Allotted Institute</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Default Fee</th>
                    <th className="py-3 px-4 text-center">Batches</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                        Loading courses...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No courses found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{c.course_name}</div>
                          <div className="text-xs text-slate-400">ID #{c.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{c.coaching_name || `Institute #${c.coaching_id}`}</span>
                          </div>
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

      {/* Allot Course Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Allot New Course to Institute"
        subtitle="Configure and allow this course for the selected coaching institute"
        size="md"
      >
        <form onSubmit={handleAllotCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Coaching Institute *
            </label>
            <select
              required
              value={form.coaching_id}
              onChange={(e) => setForm({ ...form, coaching_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- Choose Institute --</option>
              {coachings.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name} {co.city ? `(${co.city})` : ''} - [{co.status}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 12 Physics & Math Advanced"
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1 Year / 6 Months"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Standard Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.default_fee}
                onChange={(e) => setForm({ ...form, default_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_allot"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active_allot" className="text-xs text-slate-700">
              Immediately active and enrollable in coaching portal
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? 'Allotting...' : 'Allot Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Course Configuration"
        size="md"
      >
        <form onSubmit={handleUpdateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Allotted Institute *
            </label>
            <select
              required
              value={form.coaching_id}
              onChange={(e) => setForm({ ...form, coaching_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {coachings.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name} {co.city ? `(${co.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.default_fee}
                onChange={(e) => setForm({ ...form, default_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active_edit" className="text-xs text-slate-700">
              Active status
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Update Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Course Allotment"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete course <b>"{courseToDelete?.course_name}"</b> allotted to{' '}
              <b>{courseToDelete?.coaching_name}</b>?
            </p>
          </div>
          <p className="text-xs text-slate-500">
            This action will permanently remove this course offering. If student batches or invoices are linked, the deletion may be blocked.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteCourse}
              className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
