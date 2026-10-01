'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TwoPanel from '@/components/TwoPanel';
import {
  IndianRupee,
  Search,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { Coaching, Payment } from '@/types';
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
import { toast } from 'sonner';

export default function SuperadminRevenuePage() {
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [selectedCoaching, setSelectedCoaching] = useState<Coaching | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('THIS_MONTH');
  const [loading, setLoading] = useState(true);

  const fetchCoachings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/coachings');
      const list = res.data.data;
      setCoachings(list);
      if (list.length > 0) {
        selectCoaching(list[0]);
      }
    } catch (err) {
      toast.error('Failed to load coaching list');
    } finally {
      setLoading(false);
    }
  };

  const selectCoaching = async (coaching: Coaching) => {
    setSelectedCoaching(coaching);
    fetchRevenueDetails(coaching.id, range);
  };

  const fetchRevenueDetails = async (coachingId: number, selectedRange: string) => {
    try {
      const [revRes, payRes] = await Promise.all([
        api.get(`/revenue`, {
          params: { coachingId, range: selectedRange },
        }),
        api.get(`/payments`, {
          params: { coachingId },
        }),
      ]);
      setRevenueData(revRes.data.data);
      setPaymentHistory(payRes.data.data);
    } catch (err) {
      toast.error('Failed to load revenue details');
    }
  };

  useEffect(() => {
    fetchCoachings();
  }, []);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    if (selectedCoaching) {
      fetchRevenueDetails(selectedCoaching.id, newRange);
    }
  };

  const filteredCoachings = coachings.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Revenue & Collections Audit"
          subtitle="Strict payment validation: Revenue derived solely from verified collected payments"
        />

        <main className="p-8 flex-1 overflow-hidden">
          <TwoPanel
            leftWidthClass="w-full lg:w-[360px]"
            leftPanel={
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Coaching Branches ({filteredCoachings.length})
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
                      placeholder="Search branch name, city..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading && filteredCoachings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading branches...</div>
                  ) : (
                    filteredCoachings.map((c) => {
                      const isSelected = selectedCoaching?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => selectCoaching(c)}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{c.name}</h4>
                            <span className="text-xs font-bold text-emerald-700">
                              {formatINR(c.total_revenue)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{c.city}, {c.state}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
                            <span>{c.student_count || 0} active students</span>
                            <span className="font-semibold text-slate-600">{c.status}</span>
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
                  {/* Top Header of Revenue Right Panel */}
                  <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{selectedCoaching.name}</h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Audit
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Financial collections, breakdown by payment method, and billing balance
                      </p>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
                      {['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR'].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRangeChange(r)}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            range === r
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Revenue Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                          Revenue ({range.replace('_', ' ')})
                        </span>
                        <div className="text-xl font-bold text-emerald-900">
                          {formatINR(revenueData?.revenue)}
                        </div>
                        <span className="text-[10px] text-emerald-700 mt-1 block">
                          {revenueData?.paymentCount || 0} transactions
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Total Invoiced Value
                        </span>
                        <div className="text-xl font-bold text-slate-900">
                          {formatINR(revenueData?.invoices?.totalInvoiced)}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {revenueData?.invoices?.total || 0} total invoices
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Settled / Paid
                        </span>
                        <div className="text-xl font-bold text-indigo-700">
                          {revenueData?.invoices?.paid || 0} Invoices
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {formatINR(revenueData?.invoices?.totalCollected)} collected
                        </span>
                      </div>

                      <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                          Pending Receivables
                        </span>
                        <div className="text-xl font-bold text-amber-900">
                          {formatINR(revenueData?.invoices?.totalPending)}
                        </div>
                        <span className="text-[10px] text-amber-700 mt-1 block">
                          {revenueData?.invoices?.unpaid || 0} unpaid / {revenueData?.invoices?.partiallyPaid || 0} partial
                        </span>
                      </div>
                    </div>

                    {/* Chart: Daily / Interval Collection Trend */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Collections Progression ({range.replace('_', ' ')})
                        </h3>
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="h-56 w-full">
                        {revenueData?.trend && revenueData.trend.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
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
                            No payment transactions recorded in this selected range.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Transactions Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Verified Payment Ledger ({paymentHistory.length})
                          </h3>
                          <p className="text-[11px] text-slate-500">Every single rupee accounted for against invoices</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                              <th className="py-2.5 px-4">Date</th>
                              <th className="py-2.5 px-4">Student</th>
                              <th className="py-2.5 px-4">Invoice No</th>
                              <th className="py-2.5 px-4">Method</th>
                              <th className="py-2.5 px-4">Reference</th>
                              <th className="py-2.5 px-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paymentHistory.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 text-slate-600">{formatDateStr(p.payment_date)}</td>
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {p.student_name}
                                  <span className="block text-[10px] text-slate-400 font-mono">{p.registration_no}</span>
                                </td>
                                <td className="py-3 px-4 font-mono font-medium text-slate-700">{p.invoice_no}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                    {p.payment_method}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                  {p.transaction_reference || '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                  {formatINR(p.amount)}
                                </td>
                              </tr>
                            ))}
                            {paymentHistory.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                  No payments recorded for this coaching institute.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
                  Select a coaching institute to view financial audit.
                </div>
              )
            }
          />
        </main>
      </div>
    </div>
  );
}
