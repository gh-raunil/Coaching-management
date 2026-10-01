'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Building2,
  Users,
  IndianRupee,
  GraduationCap,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatINR } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Link from 'next/link';

export default function SuperadminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('THIS_MONTH');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/dashboard-stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Global Overview"
          subtitle="Real-time multi-tenant coaching performance & collected revenues"
          actionButton={
            <Link
              href="/coachings"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Manage Coachings
            </Link>
          }
        />

        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Coaching Branches"
              value={loading ? '...' : stats?.totalCoachings || 0}
              subtitle={`${stats?.activeCoachings || 0} active institutes`}
              icon={Building2}
              color="indigo"
            />
            <StatCard
              title="Total Students"
              value={loading ? '...' : stats?.totalStudents || 0}
              subtitle="Enrolled across all branches"
              icon={GraduationCap}
              color="blue"
            />
            <StatCard
              title="Total Revenue Collected"
              value={loading ? '...' : formatINR(stats?.totalRevenue)}
              subtitle={`₹ ${stats?.monthlyRevenue?.toLocaleString('en-IN') || 0} this month`}
              icon={IndianRupee}
              color="emerald"
            />
            <StatCard
              title="Coaching Administrators"
              value={loading ? '...' : stats?.totalAdmins || 0}
              subtitle="Branch directors & managers"
              icon={Users}
              color="purple"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue By Coaching Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue by Coaching Institute</h3>
                  <p className="text-xs text-slate-500">Actual collected payments per branch</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                {stats?.coachingBreakdown && stats.coachingBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.coachingBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '...' : v}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatINR(val), 'Collected Revenue']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="total_revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No coaching data available yet.
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Trend Area Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue Collection Trend</h3>
                  <p className="text-xs text-slate-500">Monthly progression of collected tuition fees</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + 'k' : v}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatINR(val), 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#revenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No revenue records in this timeframe.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coaching-wise Statistics Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Coaching Branches Breakdown</h3>
                <p className="text-xs text-slate-500">Summary of all registered institutes and active operations</p>
              </div>
              <Link
                href="/coachings"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View Full Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Coaching Name</th>
                    <th className="py-3 px-6">Location</th>
                    <th className="py-3 px-6 text-center">Active Students</th>
                    <th className="py-3 px-6 text-center">Admins</th>
                    <th className="py-3 px-6 text-right">Collected Revenue</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stats?.coachingBreakdown?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-4 px-6 text-slate-500">{c.city}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                          {c.student_count}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                          {c.admin_count}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-700">
                        {formatINR(c.total_revenue)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/coachings?id=${c.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium inline-block transition-colors"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.coachingBreakdown || stats.coachingBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No coaching branches registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
