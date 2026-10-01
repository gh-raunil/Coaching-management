'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  CreditCard,
  Search,
  RefreshCw,
  Wallet,
  Smartphone,
  Building2,
  Calendar,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import { Payment } from '@/types';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      setPayments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load payments ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Metrics
  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const upiCollected = payments
    .filter((p) => p.payment_method === 'UPI')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const cashCollected = payments
    .filter((p) => p.payment_method === 'CASH')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const bankCollected = payments
    .filter((p) => p.payment_method === 'BANK_TRANSFER')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.invoice_no && p.invoice_no.toLowerCase().includes(search.toLowerCase())) ||
      (p.student_name && p.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.registration_no && p.registration_no.toLowerCase().includes(search.toLowerCase())) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' ? true : p.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Payment Collections" subtitle="Audit trail and ledger of all verified tuition fee payments collected" />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Realized</p>
                <h3 className="text-xl font-bold text-slate-900">{formatINR(totalCollected)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{payments.length} transactions</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">UPI / QR</p>
                <h3 className="text-xl font-bold text-violet-600">{formatINR(upiCollected)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Google Pay / PhonePe / Paytm</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cash</p>
                <h3 className="text-xl font-bold text-amber-600">{formatINR(cashCollected)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Physical desk receipts</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Bank Transfer / IMPS</p>
                <h3 className="text-xl font-bold text-blue-600">{formatINR(bankCollected)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">NEFT / RTGS / Cheque</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search invoice #, student, reference ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchPayments}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition self-end sm:self-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference / Txn ID</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading payments...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {new Date(p.payment_date).toLocaleDateString('en-IN')}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(p.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-indigo-700">
                          {p.invoice_no || `INV-${p.invoice_id}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{p.student_name || 'N/A'}</div>
                          <div className="text-xs font-mono text-slate-400">{p.registration_no || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                              p.payment_method === 'UPI'
                                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                : p.payment_method === 'CASH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : p.payment_method === 'BANK_TRANSFER'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {p.payment_method === 'UPI' && <Smartphone className="w-3 h-3" />}
                            {p.payment_method === 'CASH' && <Wallet className="w-3 h-3" />}
                            {p.payment_method === 'BANK_TRANSFER' && <Building2 className="w-3 h-3" />}
                            {p.payment_method.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {p.transaction_reference ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {p.transaction_reference}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          +{formatINR(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {p.notes || <span className="text-slate-400 italic">—</span>}
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
    </div>
  );
}
