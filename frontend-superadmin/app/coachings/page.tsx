'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TwoPanel from '@/components/TwoPanel';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Building2,
  Search,
  Plus,
  Users,
  IndianRupee,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  KeyRound,
  Trash2,
  CheckCircle2,
  Ban,
  Shield,
  Edit2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import api from '@/lib/api';
import { Coaching, CoachingAdmin, Course } from '@/types';
import { formatINR, formatDateStr } from '@/lib/utils';
import { toast } from 'sonner';

export default function CoachingManagementPage() {
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [selectedCoaching, setSelectedCoaching] = useState<Coaching | null>(null);
  const [masterCourses, setMasterCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false);
  const [isRemoveAdminOpen, setIsRemoveAdminOpen] = useState(false);

  // Forms state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    logo_url: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    course_ids: [] as number[],
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    logo_url: '',
    course_ids: [] as number[],
  });

  const [addAdminForm, setAddAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    is_primary: false,
  });

  const [targetAdmin, setTargetAdmin] = useState<CoachingAdmin | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMasterCourses = async () => {
    try {
      const res = await api.get('/courses');
      setMasterCourses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load master courses', err);
    }
  };

  // Fetch all coachings
  const fetchCoachings = async (selectId?: number) => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/coachings', {
        params: { search, status: statusFilter },
      });
      const list = res.data.data;
      setCoachings(list);

      if (list.length > 0) {
        const idToSelect = selectId || selectedCoaching?.id || list[0].id;
        fetchCoachingDetails(idToSelect);
      } else {
        setSelectedCoaching(null);
      }
    } catch (err: any) {
      toast.error('Failed to load coachings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single coaching with details and admins
  const fetchCoachingDetails = async (id: number) => {
    try {
      const res = await api.get(`/superadmin/coachings/${id}`);
      const data = res.data.data;
      setSelectedCoaching(data);
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        contact_number: data.contact_number || '',
        address_line1: data.address_line1 || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        website: data.website || '',
        logo_url: data.logo_url || '',
        course_ids: data.assigned_course_ids || [],
      });
    } catch (err: any) {
      toast.error('Failed to load coaching details');
    }
  };

  useEffect(() => {
    fetchMasterCourses();
  }, []);

  useEffect(() => {
    fetchCoachings();
  }, [search, statusFilter]);

  // Handle register coaching
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post('/superadmin/coachings', registerForm);
      toast.success('Coaching and Administrator created successfully!');
      setIsRegisterOpen(false);
      setRegisterForm({
        name: '',
        email: '',
        contact_number: '',
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
        website: '',
        logo_url: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        course_ids: [],
      });
      fetchCoachings(res.data.data.coaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register coaching');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update coaching
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoaching) return;
    try {
      setActionLoading(true);
      await api.put(`/superadmin/coachings/${selectedCoaching.id}`, editForm);
      toast.success('Coaching information updated successfully!');
      setIsEditOpen(false);
      fetchCoachingDetails(selectedCoaching.id);
      fetchCoachings(selectedCoaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update coaching');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status toggle (Activate / Suspend)
  const handleToggleStatus = async () => {
    if (!selectedCoaching) return;
    const newStatus = selectedCoaching.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setActionLoading(true);
      await api.patch(`/superadmin/coachings/${selectedCoaching.id}/status`, {
        status: newStatus,
      });
      toast.success(`Coaching institute ${newStatus.toLowerCase()} successfully`);
      setIsSuspendConfirmOpen(false);
      fetchCoachingDetails(selectedCoaching.id);
      fetchCoachings(selectedCoaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoaching) return;
    try {
      setActionLoading(true);
      await api.post(`/superadmin/coachings/${selectedCoaching.id}/admins`, addAdminForm);
      toast.success('New administrator assigned successfully');
      setIsAddAdminOpen(false);
      setAddAdminForm({ name: '', email: '', password: '', is_primary: false });
      fetchCoachingDetails(selectedCoaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add admin');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle toggle admin active
  const handleToggleAdminStatus = async (admin: CoachingAdmin) => {
    try {
      await api.patch(`/superadmin/admins/${admin.id}/status`, {
        is_active: !admin.is_active,
      });
      toast.success(`Admin ${!admin.is_active ? 'activated' : 'deactivated'}`);
      if (selectedCoaching) fetchCoachingDetails(selectedCoaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update admin status');
    }
  };

  // Handle reset admin password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdmin) return;
    try {
      setActionLoading(true);
      await api.post(`/superadmin/admins/${targetAdmin.id}/reset-password`, {
        password: newAdminPassword,
      });
      toast.success(`Password reset successfully for ${targetAdmin.name}`);
      setIsResetPasswordOpen(false);
      setNewAdminPassword('');
      setTargetAdmin(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove admin
  const handleRemoveAdmin = async () => {
    if (!selectedCoaching || !targetAdmin) return;
    try {
      setActionLoading(true);
      await api.delete(`/superadmin/coachings/${selectedCoaching.id}/admins/${targetAdmin.id}`);
      toast.success('Admin access removed');
      setIsRemoveAdminOpen(false);
      setTargetAdmin(null);
      fetchCoachingDetails(selectedCoaching.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove admin');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Coaching Institutes"
          subtitle="Manage independent branches, administrators, and tenant configurations"
          actionButton={
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New Coaching
            </button>
          }
        />

        <main className="p-8 flex-1 overflow-hidden">
          <TwoPanel
            leftWidthClass="w-full lg:w-[360px]"
            leftPanel={
              <div className="flex flex-col h-full">
                {/* Panel Header & Filters */}
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Branches ({coachings.length})
                    </span>
                    <button
                      onClick={() => fetchCoachings()}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, city, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="flex gap-1.5 text-[11px]">
                    {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`flex-1 py-1 rounded-md font-medium text-center transition-colors ${
                          statusFilter === st
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Container with Independent Scroll */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading && coachings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading branches...</div>
                  ) : coachings.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No matching coaching institutes found.
                    </div>
                  ) : (
                    coachings.map((c) => {
                      const isSelected = selectedCoaching?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => fetchCoachingDetails(c.id)}
                          className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold text-sm">
                            {c.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{c.name}</h4>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  c.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.city}, {c.state}
                            </p>
                            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100/80">
                              <span className="text-slate-500 font-medium">
                                <b>{c.student_count || 0}</b> Students
                              </span>
                              <span className="font-bold text-emerald-700">
                                {formatINR(c.total_revenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            }
            rightPanel={
              selectedCoaching ? (
                <div className="flex flex-col h-full overflow-y-auto">
                  {/* Top Bar of Right Panel */}
                  <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {selectedCoaching.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">{selectedCoaching.name}</h2>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              selectedCoaching.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {selectedCoaching.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedCoaching.city}, {selectedCoaching.state}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Registered {formatDateStr(selectedCoaching.created_at)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Details
                      </button>
                      <button
                        onClick={() => setIsSuspendConfirmOpen(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          selectedCoaching.status === 'ACTIVE'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {selectedCoaching.status === 'ACTIVE' ? (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            Suspend Branch
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activate Branch
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Panel Content Body */}
                  <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Enrolled Students
                        </span>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {selectedCoaching.stats?.student_count || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Collected Revenue
                        </span>
                        <div className="text-xl font-bold text-emerald-700 mt-1">
                          {formatINR(selectedCoaching.stats?.total_revenue)}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Paid Invoices
                        </span>
                        <div className="text-xl font-bold text-indigo-700 mt-1">
                          {selectedCoaching.stats?.paid_invoices || 0} / {selectedCoaching.stats?.total_invoices || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Pending Receivables
                        </span>
                        <div className="text-xl font-bold text-amber-700 mt-1">
                          {formatINR(selectedCoaching.stats?.pending_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Info Card */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                        Institute Profile
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>Email:</span>
                          <span className="font-semibold text-slate-900">{selectedCoaching.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>Contact:</span>
                          <span className="font-semibold text-slate-900">{selectedCoaching.contact_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>Address:</span>
                          <span className="font-semibold text-slate-900">
                            {selectedCoaching.address_line1}, {selectedCoaching.city}, {selectedCoaching.state} - {selectedCoaching.pincode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span>Website:</span>
                          <span className="font-semibold text-slate-900">{selectedCoaching.website || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Allotted Courses Section */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            Allotted Master Courses ({selectedCoaching.assigned_courses?.length || 0})
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Courses this coaching center is permitted to offer students
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditOpen(true)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                        >
                          Modify Courses
                        </button>
                      </div>

                      {(!selectedCoaching.assigned_courses || selectedCoaching.assigned_courses.length === 0) ? (
                        <div className="p-4 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                          <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-500 font-medium">
                            No courses allotted yet
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Click "Modify Courses" to allot master courses to this branch.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedCoaching.assigned_courses.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs"
                            >
                              <div className="min-w-0 mr-2">
                                <div className="text-xs font-bold text-slate-800 truncate">
                                  {c.course_name}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {c.duration || 'Standard Duration'}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded shrink-0">
                                {formatINR(c.default_fee)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Admin Management Section */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Branch Administrators ({selectedCoaching.admins?.length || 0})
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Authorized personnel permitted to access this institute's portal
                          </p>
                        </div>
                        <button
                          onClick={() => setIsAddAdminOpen(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Admin
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {selectedCoaching.admins?.map((adm) => (
                          <div
                            key={adm.id}
                            className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                                {adm.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">{adm.name}</span>
                                  {adm.is_primary && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                      Primary
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                      adm.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    {adm.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{adm.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAdminStatus(adm)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                  adm.is_active
                                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {adm.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  setTargetAdmin(adm);
                                  setIsResetPasswordOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setTargetAdmin(adm);
                                  setIsRemoveAdminOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
                  Select a coaching institute from the left to inspect details.
                </div>
              )
            }
          />
        </main>
      </div>

      {/* Modal: Register New Coaching */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Coaching Branch"
        subtitle="Creates institute, default receipt config, and root administrator atomically"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Coaching Name *</label>
              <input
                type="text"
                required
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                placeholder="e.g. Apex Science & IIT Academy"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Coaching Email *</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder="contact@apexacademy.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Number *</label>
              <input
                type="text"
                required
                value={registerForm.contact_number}
                onChange={(e) => setRegisterForm({ ...registerForm, contact_number: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Website URL</label>
              <input
                type="text"
                value={registerForm.website}
                onChange={(e) => setRegisterForm({ ...registerForm, website: e.target.value })}
                placeholder="https://apexacademy.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Address Line 1 *</label>
            <input
              type="text"
              required
              value={registerForm.address_line1}
              onChange={(e) => setRegisterForm({ ...registerForm, address_line1: e.target.value })}
              placeholder="Plot 42, Knowledge Park III"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City *</label>
              <input
                type="text"
                required
                value={registerForm.city}
                onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                placeholder="Greater Noida"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State *</label>
              <input
                type="text"
                required
                value={registerForm.state}
                onChange={(e) => setRegisterForm({ ...registerForm, state: e.target.value })}
                placeholder="Uttar Pradesh"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={registerForm.pincode}
                onChange={(e) => setRegisterForm({ ...registerForm, pincode: e.target.value })}
                placeholder="201306"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section: Assign Master Courses */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Assign Courses to Coaching Center ({registerForm.course_ids.length} selected)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select the master courses this coaching branch is permitted to offer students
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setRegisterForm({
                      ...registerForm,
                      course_ids: masterCourses.map((c) => c.id),
                    })
                  }
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, course_ids: [] })}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {masterCourses.length === 0 ? (
              <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                No master courses available yet. Create master courses first in the Courses section.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
                {masterCourses.map((c) => {
                  const isChecked = registerForm.course_ids.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRegisterForm({
                              ...registerForm,
                              course_ids: [...registerForm.course_ids, c.id],
                            });
                          } else {
                            setRegisterForm({
                              ...registerForm,
                              course_ids: registerForm.course_ids.filter((id) => id !== c.id),
                            });
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-slate-800">{c.course_name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {c.duration && <span>{c.duration}</span>}
                          <span className="font-medium text-slate-700">₹{Number(c.default_fee).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
              Primary Administrator Credentials
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  value={registerForm.admin_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, admin_name: e.target.value })}
                  placeholder="Vikram Malhotra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Admin Login Email *</label>
                <input
                  type="email"
                  required
                  value={registerForm.admin_email}
                  onChange={(e) => setRegisterForm({ ...registerForm, admin_email: e.target.value })}
                  placeholder="admin@apexacademy.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Admin Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={registerForm.admin_password}
                  onChange={(e) => setRegisterForm({ ...registerForm, admin_password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-60"
            >
              {actionLoading ? 'Creating Institute...' : 'Register & Create Branch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Coaching */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Coaching & Course Allotments"
        subtitle="Update institute profile details and manage assigned master courses"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEdit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Coaching Name</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Number</label>
              <input
                type="text"
                required
                value={editForm.contact_number}
                onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Address</label>
            <input
              type="text"
              required
              value={editForm.address_line1}
              onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                required
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State</label>
              <input
                type="text"
                required
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pincode</label>
              <input
                type="text"
                required
                value={editForm.pincode}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Section: Assigned Master Courses */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Assigned Master Courses ({editForm.course_ids.length} selected)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Check or uncheck courses to update permissions for this coaching center
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      course_ids: masterCourses.map((c) => c.id),
                    })
                  }
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, course_ids: [] })}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {masterCourses.length === 0 ? (
              <div className="p-3 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                No master courses found in catalog. Create courses first in the Courses section.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
                {masterCourses.map((c) => {
                  const isChecked = editForm.course_ids.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({
                              ...editForm,
                              course_ids: [...editForm.course_ids, c.id],
                            });
                          } else {
                            setEditForm({
                              ...editForm,
                              course_ids: editForm.course_ids.filter((id) => id !== c.id),
                            });
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-slate-800">{c.course_name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {c.duration && <span>{c.duration}</span>}
                          <span className="font-medium text-slate-700">₹{Number(c.default_fee).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Coaching Admin */}
      <Modal
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        title="Add Administrator"
        subtitle={`Assign additional admin to ${selectedCoaching?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Admin Full Name *</label>
            <input
              type="text"
              required
              value={addAdminForm.name}
              onChange={(e) => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
              placeholder="e.g. Sunita Sharma"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Login Email *</label>
            <input
              type="email"
              required
              value={addAdminForm.email}
              onChange={(e) => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
              placeholder="admin@coaching.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={addAdminForm.password}
              onChange={(e) => setAddAdminForm({ ...addAdminForm, password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddAdminOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
            >
              {actionLoading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        title="Reset Admin Password"
        subtitle={`Set a new secure password for ${targetAdmin?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsResetPasswordOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
            >
              {actionLoading ? 'Updating...' : 'Set New Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm: Suspend / Activate Coaching */}
      <ConfirmDialog
        isOpen={isSuspendConfirmOpen}
        onClose={() => setIsSuspendConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={selectedCoaching?.status === 'ACTIVE' ? 'Suspend Coaching Branch' : 'Activate Coaching Branch'}
        message={
          selectedCoaching?.status === 'ACTIVE'
            ? `Are you sure you want to suspend "${selectedCoaching?.name}"? All administrators associated with this coaching will immediately lose access to their portal.`
            : `Are you sure you want to activate "${selectedCoaching?.name}"? Administrators will be permitted to log in and manage students again.`
        }
        confirmText={selectedCoaching?.status === 'ACTIVE' ? 'Yes, Suspend Branch' : 'Yes, Activate Branch'}
        confirmVariant={selectedCoaching?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={actionLoading}
      />

      {/* Confirm: Remove Admin */}
      <ConfirmDialog
        isOpen={isRemoveAdminOpen}
        onClose={() => setIsRemoveAdminOpen(false)}
        onConfirm={handleRemoveAdmin}
        title="Remove Administrator"
        message={`Are you sure you want to remove administrator "${targetAdmin?.name}"? They will no longer be able to log in to manage this institute.`}
        confirmText="Remove Admin"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
