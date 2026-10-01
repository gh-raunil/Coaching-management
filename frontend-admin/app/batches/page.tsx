'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { Users, Plus, Search, Edit2, Calendar, BookOpen, Ban, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Batch, Course } from '@/types';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetBatch, setTargetBatch] = useState<Batch | null>(null);

  const [form, setForm] = useState({
    course_id: '' as string | number,
    batch_id_code: '',
    batch_name: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchRes, courseRes] = await Promise.all([
        api.get('/batches'),
        api.get('/courses'),
      ]);
      setBatches(batchRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id_code.trim() || !form.batch_name.trim()) {
      toast.error('Batch Code and Name are required');
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/batches', {
        ...form,
        course_id: form.course_id ? Number(form.course_id) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      toast.success('Batch created successfully!');
      setIsAddOpen(false);
      setForm({
        course_id: '',
        batch_id_code: '',
        batch_name: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatch) return;

    try {
      setActionLoading(true);
      await api.put(`/batches/${targetBatch.id}`, {
        ...form,
        course_id: form.course_id ? Number(form.course_id) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      toast.success('Batch updated successfully!');
      setIsEditOpen(false);
      setTargetBatch(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update batch');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBatchStatus = async (b: Batch) => {
    try {
      await api.put(`/batches/${b.id}`, { is_active: !b.is_active });
      toast.success(`Batch ${!b.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const openEdit = (b: Batch) => {
    setTargetBatch(b);
    setForm({
      course_id: b.course_id || '',
      batch_id_code: b.batch_id_code,
      batch_name: b.batch_name,
      start_date: b.start_date ? b.start_date.substring(0, 10) : '',
      end_date: b.end_date ? b.end_date.substring(0, 10) : '',
      is_active: b.is_active,
    });
    setIsEditOpen(true);
  };

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.batch_name.toLowerCase().includes(search.toLowerCase()) ||
      b.batch_id_code.toLowerCase().includes(search.toLowerCase()) ||
      (b.course_name && b.course_name.toLowerCase().includes(search.toLowerCase()));
    const matchesCourse = courseFilter ? b.course_id?.toString() === courseFilter : true;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Batches Management" subtitle="Create and organize academic cohorts and study batches" />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by code or batch name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name}
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
                    course_id: '',
                    batch_id_code: '',
                    batch_name: '',
                    start_date: '',
                    end_date: '',
                    is_active: true,
                  });
                  setIsAddOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Batch
              </button>
            </div>
          </div>

          {/* Batches Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-white rounded-xl border border-slate-200 animate-pulse p-5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No batches found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {search || courseFilter ? 'Try changing your search filters.' : 'Get started by creating your first student batch.'}
              </p>
              {!search && !courseFilter && (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Add Batch
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-100">
                          {b.batch_id_code}
                        </span>
                        <h3 className="font-semibold text-slate-800 truncate" title={b.batch_name}>
                          {b.batch_name}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          b.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.course_name || 'No Course Assigned'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {b.start_date ? new Date(b.start_date).toLocaleDateString('en-IN') : 'Ongoing'}
                        {b.end_date ? ` to ${new Date(b.end_date).toLocaleDateString('en-IN')}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => toggleBatchStatus(b)}
                      className={`text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded border transition ${
                        b.is_active
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {b.is_active ? (
                        <>
                          <Ban className="w-3 h-3" /> Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Activate
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEdit(b)}
                      className="text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 text-slate-700 rounded hover:bg-slate-50"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Batch Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Batch" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code / ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. BATCH-2025-A"
                value={form.batch_id_code}
                onChange={(e) => setForm({ ...form, batch_id_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Course</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Morning JEE Advanced Fast-Track"
              value={form.batch_name}
              onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Batch" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code / ID *</label>
              <input
                type="text"
                required
                value={form.batch_id_code}
                onChange={(e) => setForm({ ...form, batch_id_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Course</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Name *</label>
            <input
              type="text"
              required
              value={form.batch_name}
              onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Update Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
