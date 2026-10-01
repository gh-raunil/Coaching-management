'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  RefreshCw,
  Wallet,
  Smartphone,
  Building2,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

export default function RevenuePage() {
  const [range, setRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const params: any = { range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await api.get('/revenue', { params });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [range]);

  const handleCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchRevenue();
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Revenue & Financials" subtitle="Audit actual collected fee payments, invoice balances, and collection trends" />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start">
              {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    range === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>

            {range === 'CUSTOM' && (
              <form onSubmit={handleCustomFilter} className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  Apply
                </button>
              </form>
            )}

            <button
              onClick={fetchRevenue}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition self-end lg:self-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Revenue Collected ({range.replace('_', ' ')})
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {formatINR(data?.revenue || 0)}
                </h3>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  {data?.paymentCount || 0} recorded payments
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced (All-time)</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {formatINR(data?.invoices?.totalInvoiced || 0)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Across {data?.invoices?.total || 0} invoices
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Balance</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                  {formatINR(data?.invoices?.totalPending || 0)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data?.invoices?.unpaid || 0} unpaid & {data?.invoices?.partiallyPaid || 0} partial
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paid Invoices</p>
                <h3 className="text-2xl font-bold text-violet-700 mt-0.5">
                  {data?.invoices?.paid || 0}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fully settled fee bills
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Collections Timeline</h3>
                  <p className="text-xs text-slate-400">Actual daily payment collections over the selected timeframe</p>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : !data?.trend || data.trend.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm">No payment collections in this timeframe</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatINR(val), 'Collected']}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#revenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Collections by Method</h3>
                <p className="text-xs text-slate-400 mb-4">Realized revenue breakdown</p>

                {loading ? (
                  <div className="h-44 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : !data?.byMethod || data.byMethod.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                    <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs">No payment records</p>
                  </div>
                ) : (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byMethod} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="method" type="category" stroke="#64748b" fontSize={10} width={90} />
                        <Tooltip
                          formatter={(v: any) => [formatINR(v), 'Revenue']}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                          {data.byMethod.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Method summary list */}
              <div className="space-y-2 pt-3 border-t border-slate-100 mt-2">
                {data?.byMethod?.map((m: any, idx: number) => (
                  <div key={m.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-slate-600 font-medium">{m.method.replace('_', ' ')}</span>
                      <span className="text-slate-400">({m.count} txns)</span>
                    </div>
                    <span className="font-semibold text-slate-800">{formatINR(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
