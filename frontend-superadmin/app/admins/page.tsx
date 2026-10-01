'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import {
  Users,
  Search,
  Building2,
  KeyRound,
  Shield,
  RefreshCw,
  Mail,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { Coaching } from '@/types';
import { formatDateStr } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminItem {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  coaching_id: number;
  coaching_name: string;
  coaching_status: string;
}

export default function SuperadminAdminsPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetAdmin, setTargetAdmin] = useState<AdminItem | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/coachings');
      const coachings: Coaching[] = res.data.data;

      // Fetch details for all coachings to extract all admins
      const adminPromises = coachings.map((c) => api.get(`/superadmin/coachings/${c.id}`));
      const responses = await Promise.all(adminPromises);

      const allAdmins: AdminItem[] = [];
      responses.forEach((r, idx) => {
        const c = coachings[idx];
        const coachingAdmins = r.data.data.admins || [];
        coachingAdmins.forEach((adm: any) => {
          allAdmins.push({
            ...adm,
            coaching_id: c.id,
            coaching_name: c.name,
            coaching_status: c.status,
          });
        });
      });

      setAdmins(allAdmins);
    } catch (err) {
      toast.error('Failed to load administrators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleStatus = async (admin: AdminItem) => {
    try {
      await api.patch(`/superadmin/admins/${admin.id}/status`, {
        is_active: !admin.is_active,
      });
      toast.success(`Admin ${!admin.is_active ? 'activated' : 'deactivated'}`);
      fetchAdmins();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdmin) return;
    try {
      setActionLoading(true);
      await api.post(`/superadmin/admins/${targetAdmin.id}/reset-password`, {
        password: newPassword,
      });
      toast.success(`Password updated for ${targetAdmin.name}`);
      setIsResetPasswordOpen(false);
      setNewPassword('');
      setTargetAdmin(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.coaching_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Branch Administrators Directory"
          subtitle="View and manage administrators across all coaching institutes"
        />

        <main className="p-8 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search admin name, email, or coaching..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => fetchAdmins()}
              className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Admin Name &amp; Email</th>
                    <th className="py-3 px-6">Coaching Institute</th>
                    <th className="py-3 px-6">Privileges</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6">Created On</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmins.map((a) => (
                    <tr key={`${a.coaching_id}-${a.id}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                            {a.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{a.name}</div>
                            <div className="text-[11px] text-slate-500">{a.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{a.coaching_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Branch Status: {a.coaching_status}</span>
                      </td>
                      <td className="py-4 px-6">
                        {a.is_primary ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            Primary Director
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            Coaching Admin
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            a.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-[11px]">
                        {formatDateStr(a.created_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(a)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                              a.is_active
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {a.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setTargetAdmin(a);
                              setIsResetPasswordOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No coaching administrators found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        title="Reset Administrator Password"
        subtitle={`Set new password for ${targetAdmin?.name} (${targetAdmin?.email})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
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
              {actionLoading ? 'Updating...' : 'Set Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
