'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  Building2,
  FileText,
  Lock,
  Save,
  CheckCircle2,
  Globe,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { CoachingSettings } from '@/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile & Receipt Settings form
  const [settings, setSettings] = useState<CoachingSettings>({
    coaching_id: 0,
    name: '',
    email: '',
    contact_number: '',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    logo_url: '',
    website: '',
    receipt_header_title: '',
    receipt_footer_msg: '',
    receipt_notes_line1: '',
    receipt_notes_line2: '',
    receipt_notes_line3: '',
    whatsapp_number: '',
    support_email: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.data) {
        setSettings({
          ...res.data.data,
          logo_url: res.data.data.logo_url || '',
          website: res.data.data.website || '',
          receipt_header_title: res.data.data.receipt_header_title || '',
          receipt_footer_msg: res.data.data.receipt_footer_msg || '',
          receipt_notes_line1: res.data.data.receipt_notes_line1 || '',
          receipt_notes_line2: res.data.data.receipt_notes_line2 || '',
          receipt_notes_line3: res.data.data.receipt_notes_line3 || '',
          whatsapp_number: res.data.data.whatsapp_number || '',
          support_email: res.data.data.support_email || '',
        });
      }
    } catch (err) {
      toast.error('Failed to load institute settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Institute Settings" subtitle="Configure branch profile, live receipt branding, and account security" />

        <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-xl gap-8 shadow-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institute Profile
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === 'receipt'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Receipt & Branding
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === 'security'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              Security & Password
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-b-xl border border-slate-200 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading settings...
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-b-xl border border-slate-200 shadow-sm">
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Institute Information</h3>
                    <p className="text-xs text-slate-500">Official registered branch identity used across all modules</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Coaching Name *</label>
                      <input
                        type="text"
                        required
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number *</label>
                      <input
                        type="text"
                        required
                        value={settings.contact_number}
                        onChange={(e) => setSettings({ ...settings, contact_number: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
                      <input
                        type="text"
                        placeholder="https://yourcoaching.edu"
                        value={settings.website || ''}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png"
                        value={settings.logo_url || ''}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      Physical Campus Address
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={settings.address_line1}
                          onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={settings.city}
                            onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            value={settings.state}
                            onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={settings.pincode}
                            onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: RECEIPT BRANDING */}
              {activeTab === 'receipt' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Live Bill Receipt Customization</h3>
                    <p className="text-xs text-slate-500">
                      These values dynamically populate the header, notes, and footer of all printed receipts
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Header Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Science Academy Pvt. Ltd."
                        value={settings.receipt_header_title || ''}
                        onChange={(e) => setSettings({ ...settings, receipt_header_title: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Empowering Next-Gen Achievers"
                        value={settings.receipt_footer_msg || ''}
                        onChange={(e) => setSettings({ ...settings, receipt_footer_msg: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Support Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={settings.whatsapp_number || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Support Email</label>
                      <input
                        type="email"
                        placeholder="e.g. accounts@coaching.edu"
                        value={settings.support_email || ''}
                        onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-800">Legal & Policy Terms (Notes Section)</h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Note 1 (Refund Policy)</label>
                      <input
                        type="text"
                        value={settings.receipt_notes_line1 || ''}
                        onChange={(e) => setSettings({ ...settings, receipt_notes_line1: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Note 2 (System Notice)</label>
                      <input
                        type="text"
                        value={settings.receipt_notes_line2 || ''}
                        onChange={(e) => setSettings({ ...settings, receipt_notes_line2: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Note 3 (Payment Confirmation Notice)</label>
                      <input
                        type="text"
                        value={settings.receipt_notes_line3 || ''}
                        onChange={(e) => setSettings({ ...settings, receipt_notes_line3: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Update Receipt Branding'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: SECURITY */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                    <p className="text-xs text-slate-500">Update your coaching administrator login credentials</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {passwordLoading ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
