'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import BillReceipt from '@/components/BillReceipt';
import {
  FileText,
  Search,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import { Invoice, CoachingSettings } from '@/types';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [settings, setSettings] = useState<CoachingSettings | null>(null);

  // Record Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, []);

  const openReceiptModal = async (inv: Invoice) => {
    try {
      setReceiptLoading(true);
      setIsReceiptOpen(true);
      const res = await api.get(`/invoices/${inv.id}`);
      setSelectedInvoice(res.data.data);
    } catch (err) {
      toast.error('Failed to load invoice receipt');
      setIsReceiptOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  // Calculations
  const totalInvoiced = invoices.reduce((acc, i) => acc + Number(i.total_amount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + Number(i.paid_amount || 0), 0);
  const totalPending = invoices.reduce(
    (acc, i) => acc + Math.max(0, Number(i.total_amount || 0) - Number(i.paid_amount || 0)),
    0
  );
  const overdueCount = invoices.filter(
    (i) => i.payment_status === 'OVERDUE' || (new Date(i.due_date) < new Date() && i.payment_status !== 'PAID')
  ).length;

  const filtered = invoices.filter((i) => {
    const matchesSearch =
      i.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      (i.student_name && i.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (i.registration_no && i.registration_no.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'OVERDUE'
        ? i.payment_status === 'OVERDUE' || (new Date(i.due_date) < new Date() && i.payment_status !== 'PAID')
        : i.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Invoices & Billing" subtitle="Generate, track, and manage student fee invoices and billing receipts" />

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Invoiced</p>
                <h3 className="text-xl font-bold text-slate-900">{formatINR(totalInvoiced)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invoices.length} invoices generated</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Collected Revenue</p>
                <h3 className="text-xl font-bold text-emerald-600">{formatINR(totalCollected)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Recorded in payments</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Outstanding Balance</p>
                <h3 className="text-xl font-bold text-amber-600">{formatINR(totalPending)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Awaiting collection</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Overdue Invoices</p>
                <h3 className="text-xl font-bold text-rose-600">{overdueCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Past due date</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-1 gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search invoice number, student name, reg #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchInvoices}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition self-end sm:self-auto"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course / Batch</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading invoices...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => {
                      const balance = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));
                      const isOverdue =
                        inv.payment_status === 'OVERDUE' ||
                        (new Date(inv.due_date) < new Date() && inv.payment_status !== 'PAID');

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                            {inv.invoice_no}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{inv.student_name}</div>
                            <div className="text-xs font-mono text-slate-400">{inv.registration_no}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div>{inv.course_name || 'N/A'}</div>
                            <span className="text-slate-400">{inv.batch_id || 'N/A'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            <div>Issued: {new Date(inv.invoice_date).toLocaleDateString('en-IN')}</div>
                            <div className={isOverdue ? 'text-rose-600 font-medium' : 'text-slate-400'}>
                              Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                            {formatINR(inv.total_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                            {formatINR(inv.paid_amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium">
                            <span className={balance > 0 ? 'text-amber-600' : 'text-slate-400'}>
                              {formatINR(balance)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                inv.payment_status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : inv.payment_status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {inv.payment_status === 'PAID'
                                ? 'PAID'
                                : inv.payment_status === 'PARTIALLY_PAID'
                                ? 'PARTIALLY PAID'
                                : isOverdue
                                ? 'OVERDUE'
                                : 'UNPAID'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openReceiptModal(inv)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View / Print Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {balance > 0 && (
                                <button
                                  onClick={() => setPaymentInvoice(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            fetchInvoices();
          }}
          invoice={paymentInvoice}
        />
      )}

      {/* Receipt Preview Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Official Billing Receipt"
        size="xl"
      >
        {receiptLoading || !selectedInvoice ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
            Loading receipt...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end gap-3 pb-2 border-b border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>

            <div className="overflow-auto max-h-[75vh] flex justify-center bg-slate-100/50 p-4 rounded-xl">
              <BillReceipt
                billData={{
                  invoiceNo: selectedInvoice.invoice_no,
                  invoiceDate: selectedInvoice.invoice_date,
                  dueDate: selectedInvoice.due_date,
                  studentName: selectedInvoice.student_name,
                  fatherName: selectedInvoice.father_name || '',
                  regNo: selectedInvoice.registration_no,
                  batchId: selectedInvoice.batch_id || '',
                  courseName: selectedInvoice.course_name || '',
                  addr1: selectedInvoice.address_line1 || '',
                  cityStatePin: selectedInvoice.city_state_pin || '',
                  contactNo: selectedInvoice.contact_no || '',
                  description: selectedInvoice.items?.[0]?.description || 'Tuition & Coaching Fee',
                  qty: selectedInvoice.items?.[0]?.quantity || 1,
                  rate: selectedInvoice.items?.[0]?.rate || selectedInvoice.subtotal,
                  discount: selectedInvoice.discount || 0,
                }}
                settings={settings || undefined}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
