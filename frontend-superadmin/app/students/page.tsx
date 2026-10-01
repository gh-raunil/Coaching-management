'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TwoPanel from '@/components/TwoPanel';
import {
  GraduationCap,
  Search,
  Building2,
  Calendar,
  Phone,
  MapPin,
  FileText,
  IndianRupee,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';
import api from '@/lib/api';
import { Student, Coaching } from '@/types';
import { formatINR, formatDateStr } from '@/lib/utils';
import { toast } from 'sonner';

export default function SuperadminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [selectedCoachingId, setSelectedCoachingId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchCoachings = async () => {
    try {
      const res = await api.get('/superadmin/coachings');
      setCoachings(res.data.data);
    } catch (e) {
      // ignore
    }
  };

  const fetchStudents = async (targetId?: number) => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/students', {
        params: {
          search,
          coachingId: selectedCoachingId !== 'ALL' ? selectedCoachingId : undefined,
          paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
        },
      });
      const list = res.data.data;
      setStudents(list);

      if (list.length > 0) {
        const idToSelect = targetId || selectedStudent?.id || list[0].id;
        fetchStudentDetails(idToSelect);
      } else {
        setSelectedStudent(null);
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (id: number) => {
    try {
      const res = await api.get(`/students/${id}`);
      setSelectedStudent(res.data.data);
    } catch (err) {
      toast.error('Failed to load student details');
    }
  };

  useEffect(() => {
    fetchCoachings();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedCoachingId, paymentStatusFilter]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Global Student Directory"
          subtitle="Cross-coaching student profiles, enrollments, and payment records"
        />

        <main className="p-8 flex-1 overflow-hidden">
          <TwoPanel
            leftWidthClass="w-full lg:w-[380px]"
            leftPanel={
              <div className="flex flex-col h-full">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      All Students ({students.length})
                    </span>
                    <button
                      onClick={() => fetchStudents()}
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
                      placeholder="Search name, reg no, contact..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Coaching Filter Dropdown */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Filter by Coaching
                    </label>
                    <select
                      value={selectedCoachingId}
                      onChange={(e) => setSelectedCoachingId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">All Coaching Institutes</option>
                      {coachings.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment status filter */}
                  <div className="flex gap-1 text-[10px]">
                    {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setPaymentStatusFilter(st)}
                        className={`flex-1 py-1 rounded font-medium text-center transition-colors ${
                          paymentStatusFilter === st
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'PARTIALLY_PAID' ? 'PARTIAL' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Container with Independent Scroll */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading && students.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading student directory...</div>
                  ) : students.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No matching student records found.
                    </div>
                  ) : (
                    students.map((s) => {
                      const isSelected = selectedStudent?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => fetchStudentDetails(s.id)}
                          className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700 font-bold text-xs">
                            {s.student_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {s.student_name}
                              </h4>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
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
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Reg: <span className="font-mono font-medium text-slate-700">{s.registration_no}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-700 mt-1 truncate">
                              <Building2 className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                              <span className="truncate">{s.coaching_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                              <span className="text-slate-500 truncate">{s.batch_id || 'No Batch'}</span>
                              <span className="font-semibold text-slate-700">{formatINR(s.total_paid)} paid</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            }
            rightPanel={
              selectedStudent ? (
                <div className="flex flex-col h-full overflow-y-auto">
                  {/* Top Bar of Student Right Panel */}
                  <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/20">
                        {selectedStudent.student_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">{selectedStudent.student_name}</h2>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                            {selectedStudent.registration_no}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-semibold text-indigo-700 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {selectedStudent.coaching_name}
                          </span>
                          <span>•</span>
                          <span>Enrolled {formatDateStr(selectedStudent.created_at)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Enrollment Profile Grid */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                        Student Details &amp; Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block mb-0.5">Father's Name</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.father_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Contact Number</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.contact_no || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Enrolled Course</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.course_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5">Assigned Batch</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.batch_id || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block mb-0.5">Address</span>
                          <span className="font-semibold text-slate-800">
                            {selectedStudent.address_line1}, {selectedStudent.city_state_pin}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invoices History Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          Generated Invoices ({selectedStudent.invoices?.length || 0})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                              <th className="py-2.5 px-4">Invoice No</th>
                              <th className="py-2.5 px-4">Date</th>
                              <th className="py-2.5 px-4 text-right">Total</th>
                              <th className="py-2.5 px-4 text-right">Paid</th>
                              <th className="py-2.5 px-4 text-right">Balance</th>
                              <th className="py-2.5 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedStudent.invoices?.map((inv) => (
                              <tr key={inv.id}>
                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_no}</td>
                                <td className="py-3 px-4 text-slate-500">{formatDateStr(inv.invoice_date)}</td>
                                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.total_amount)}</td>
                                <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(inv.paid_amount)}</td>
                                <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatINR(inv.balance_amount)}</td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      inv.payment_status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : inv.payment_status === 'PARTIALLY_PAID'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    {inv.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!selectedStudent.invoices || selectedStudent.invoices.length === 0) && (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                  No invoice records found for this student.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payments History Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                          Collected Payments History ({selectedStudent.payments?.length || 0})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                              <th className="py-2.5 px-4">Date</th>
                              <th className="py-2.5 px-4">Invoice</th>
                              <th className="py-2.5 px-4">Method</th>
                              <th className="py-2.5 px-4">Reference</th>
                              <th className="py-2.5 px-4 text-right">Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedStudent.payments?.map((p) => (
                              <tr key={p.id}>
                                <td className="py-3 px-4 text-slate-600">{formatDateStr(p.payment_date)}</td>
                                <td className="py-3 px-4 font-mono text-slate-800">{p.invoice_no}</td>
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
                            {(!selectedStudent.payments || selectedStudent.payments.length === 0) && (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-400">
                                  No payments collected yet for this student.
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
                  Select a student from the left panel to inspect cross-coaching details.
                </div>
              )
            }
          />
        </main>
      </div>
    </div>
  );
}
