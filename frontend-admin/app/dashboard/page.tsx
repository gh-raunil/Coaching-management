'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Users,
  IndianRupee,
  FileText,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  GraduationCap,
} from 'lucide-react';
import api from '@/lib/api';
import { formatINR, formatDateStr } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

export default function CoachingDashboardPage() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, stuRes, invRes, payRes] = await Promise.all([
        api.get('/revenue?range=THIS_MONTH'),
        api.get('/students'),
        api.get('/invoices'),
        api.get('/payments'),
      ]);

      setRevenueData(revRes.data.data);
      setStudents(stuRes.data.data || []);
      setRecentInvoices((invRes.data.data || []).slice(0, 5));
      setRecentPayments((payRes.data.data || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Institute Dashboard"
          subtitle="Real-time admissions, active invoices, and fee collection overview"
          actionButton={
            <Link
              href="/students?action=new"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Student &amp; Bill
            </Link>
          }
        />

        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* 4 Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Enrolled Students"
              value={loading ? '...' : students.length}
              subtitle="Active in batches"
              icon={GraduationCap}
              color="blue"
            />
            <StatCard
              title="Collected Revenue"
              value={loading ? '...' : formatINR(revenueData?.revenue)}
              subtitle="Collected this month"
              icon={IndianRupee}
              color="emerald"
            />
            <StatCard
              title="Paid Invoices"
              value={loading ? '...' : revenueData?.invoices?.paid || 0}
              subtitle={`Out of ${revenueData?.invoices?.total || 0} issued`}
              icon={FileText}
              color="indigo"
            />
            <StatCard
              title="Pending Balance"
              value={loading ? '...' : formatINR(revenueData?.invoices?.totalPending)}
              subtitle={`${revenueData?.invoices?.unpaid || 0} unpaid bills`}
              icon={AlertCircle}
              color="amber"
            />
          </div>

          {/* Revenue Chart & Payment Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: 2 Columns */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Collections Timeline</h3>
                  <p className="text-xs text-slate-500">Collected tuition payments across recent dates</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="h-64 w-full">
                {revenueData?.trend && revenueData.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val: any) => [formatINR(val), 'Collected']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No transactions recorded this month yet.
                  </div>
                )}
              </div>
            </div>

            {/* Invoices Status Breakdown: 1 Column */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Billing Overview</h3>
                <p className="text-xs text-slate-500 mb-6">Payment settlement health</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Fully Paid Bills</span>
                      <span className="text-emerald-700 font-bold">{revenueData?.invoices?.paid || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${
                            revenueData?.invoices?.total
                              ? ((revenueData.invoices.paid / revenueData.invoices.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Partially Paid</span>
                      <span className="text-amber-700 font-bold">{revenueData?.invoices?.partiallyPaid || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: `${
                            revenueData?.invoices?.total
                              ? ((revenueData.invoices.partiallyPaid / revenueData.invoices.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Unpaid / Due</span>
                      <span className="text-red-700 font-bold">{revenueData?.invoices?.unpaid || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${
                            revenueData?.invoices?.total
                              ? ((revenueData.invoices.unpaid / revenueData.invoices.total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold text-slate-900">{formatINR(revenueData?.invoices?.totalInvoiced)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-500">Collected:</span>
                  <span className="font-bold text-emerald-700">{formatINR(revenueData?.invoices?.totalCollected)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Row: Recent Students & Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Students */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recently Enrolled Students
                </h3>
                <Link
                  href="/students"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {students.slice(0, 5).map((s) => (
                  <div key={s.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {s.student_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.student_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{s.registration_no} • {s.batch_id || 'No Batch'}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.latest_payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.latest_payment_status === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {s.latest_payment_status}
                    </span>
                  </div>
                ))}
                {students.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">No students enrolled yet.</div>
                )}
              </div>
            </div>

            {/* Recent Payments Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Payment Transactions
                </h3>
                <Link
                  href="/payments"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <div key={p.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.student_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateStr(p.payment_date)} • <span className="font-mono">{p.invoice_no}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700">{formatINR(p.amount)}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{p.payment_method}</span>
                    </div>
                  </div>
                ))}
                {recentPayments.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">No recent payments recorded.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
