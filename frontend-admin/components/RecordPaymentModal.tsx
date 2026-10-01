'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { IndianRupee, Calendar, CreditCard, FileText } from 'lucide-react';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number;
    invoice_no: string;
    student_name?: string;
    total_amount: number;
    paid_amount: number;
    balance_amount?: number;
  } | null;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: RecordPaymentModalProps) {
  const balance = invoice ? Math.max(invoice.total_amount - invoice.paid_amount, 0) : 0;

  const [amount, setAmount] = useState<number | string>(balance || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync balance when modal opens
  React.useEffect(() => {
    if (invoice) {
      const b = Math.max(invoice.total_amount - invoice.paid_amount, 0);
      setAmount(b);
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    if (numAmount > balance + 0.01) {
      toast.error(`Payment cannot exceed remaining balance of ${formatINR(balance)}`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/payments', {
        invoice_id: invoice.id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        notes,
      });

      toast.success('Payment recorded successfully!');
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle={`Invoice #${invoice.invoice_no} (${invoice.student_name || 'Student'})`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Balance Status Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Total Bill</span>
            <span className="font-bold text-slate-900">{formatINR(invoice.total_amount)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Paid So Far</span>
            <span className="font-bold text-emerald-700">{formatINR(invoice.paid_amount)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-amber-800 font-semibold block">Remaining Balance</span>
            <span className="font-bold text-amber-700">{formatINR(balance)}</span>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Payment Amount (₹) *</label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Max collectible: {formatINR(balance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="CASH">Cash Deposit</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Transaction / UTR Reference
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. UPI/26090123/OKAXIS or Receipt No."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 1st installment paid via phonepe"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 resize-none"
          />
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-colors"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
