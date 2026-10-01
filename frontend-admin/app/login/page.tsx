'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Building2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      if (user.role !== 'COACHING_ADMIN') {
        setErrorMessage('Access denied. This login portal is strictly for Coaching Administrators.');
        toast.error('Superadmin accounts must use the Superadmin Portal (Port 3002).');
        return;
      }

      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      toast.success(`Welcome to ${user.coachingName || 'Coaching Dashboard'}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-600/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Coaching Admin Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Institute Management &amp; Billing System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin1@apexacademy.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Institute</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill seed accounts for development testing */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">Quick Development Logins:</p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin1@apexacademy.com');
                setPassword('Admin@123');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-emerald-400 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
            >
              <span>Apex Academy: <b>admin1@apexacademy.com</b></span>
              <span className="text-[10px] text-slate-400">Fill</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@quantumclasses.in');
                setPassword('Admin@123');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-emerald-400 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
            >
              <span>Quantum Classes: <b>admin@quantumclasses.in</b></span>
              <span className="text-[10px] text-slate-400">Fill</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@horizonolympiad.org');
                setPassword('Admin@123');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-red-400 hover:bg-slate-800/40 transition-colors flex items-center justify-between"
            >
              <span>Suspended: <b>admin@horizonolympiad.org</b></span>
              <span className="text-[10px] text-red-400">Test Suspension</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
