'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TwoPanel from '@/components/TwoPanel';
import Modal from '@/components/Modal';
import BillReceipt, { BillData } from '@/components/BillReceipt';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import {
  Users,
  Search,
  Plus,
  Printer,
  CreditCard,
  FileText,
  Calendar,
  Phone,
  MapPin,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  BookOpen,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { Student, Course, Batch, CoachingSettings, Invoice } from '@/types';
import { formatINR, formatDateStr } from '@/lib/utils';
import { toast } from 'sonner';

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<CoachingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments'>('overview');

  // Mode: 'view' or 'add_student' (Live Receipt Generator)
  const [isAddMode, setIsAddMode] = useState(false);

  // Live Bill Form State
  const [billForm, setBillForm] = useState<BillData>({
    invoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    studentName: '',
    fatherName: '',
    regNo: '',
    batchId: '',
    courseName: '',
    addr1: '',
    cityStatePin: '',
    contactNo: '',
    description: 'Course fee — Tuition & Study Materials',
    qty: 1,
    rate: 0,
    discount: 0,
  });

  const [savingStudent, setSavingStudent] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<Invoice | null>(null);

  // Receipt Preview / Print Modal for existing student invoice
  const [isViewReceiptModalOpen, setIsViewReceiptModalOpen] = useState(false);
  const [viewingReceiptData, setViewingReceiptData] = useState<BillData | null>(null);

  // Fetch initial courses, batches, and institute settings
  const fetchAuxiliaryData = async () => {
    try {
      const [cRes, bRes, sRes] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        api.get('/settings'),
      ]);
      setCourses(cRes.data.data || []);
      setBatches(bRes.data.data || []);
      setSettings(sRes.data.data || null);
    } catch (e) {
      // ignore
    }
  };

  const fetchStudents = async (targetId?: number) => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          search,
          course: courseFilter !== 'ALL' ? courseFilter : undefined,
          batch: batchFilter !== 'ALL' ? batchFilter : undefined,
          paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        },
      });
      const list = res.data.data || [];
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
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, courseFilter, batchFilter, paymentFilter]);

  // Generate sensible next default invoice and reg no
  const initNewStudentForm = () => {
    const today = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 14);

    const year = today.getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = settings?.name ? settings.name.slice(0, 3).toUpperCase() : 'COA';

    setBillForm({
      invoiceNo: `INV-${prefix}-${year}-${randomSuffix}`,
      invoiceDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      studentName: '',
      fatherName: '',
      regNo: `${prefix}/${year}/${randomSuffix}`,
      batchId: batches.length > 0 ? batches[0].batch_id_code : '',
      courseName: courses.length > 0 ? courses[0].course_name : '',
      addr1: '',
      cityStatePin: '',
      contactNo: '',
      description: 'Course fee — Admission & Complete Study Module',
      qty: 1,
      rate: courses.length > 0 && courses[0].default_fee ? courses[0].default_fee : 15000,
      discount: 0,
    });
    setIsAddMode(true);
  };

  // When course changes in the form, update default fee if available
  const handleCourseChange = (selectedCourseName: string) => {
    const courseObj = courses.find((c) => c.course_name === selectedCourseName);
    setBillForm((prev) => ({
      ...prev,
      courseName: selectedCourseName,
      rate: courseObj?.default_fee ? courseObj.default_fee : prev.rate,
    }));
  };

  // Submit Save Student & Invoice (Transactional Backend)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.studentName.trim()) {
      toast.error('Student Name is required');
      return;
    }
    if (!billForm.invoiceNo.trim() || !billForm.regNo.trim()) {
      toast.error('Invoice Number and Registration Number are required');
      return;
    }

    try {
      setSavingStudent(true);
      const res = await api.post('/students', {
        invoice_no: billForm.invoiceNo,
        invoice_date: billForm.invoiceDate,
        due_date: billForm.dueDate,
        student_name: billForm.studentName,
        father_name: billForm.fatherName,
        registration_no: billForm.regNo,
        batch_id: billForm.batchId,
        course_name: billForm.courseName,
        address_line1: billForm.addr1,
        city_state_pin: billForm.cityStatePin,
        contact_no: billForm.contactNo,
        description: billForm.description,
        quantity: billForm.qty,
        rate: billForm.rate,
        discount: billForm.discount,
      });

      toast.success('Student registered and invoice generated successfully!');
      setIsAddMode(false);
      const newStudentId = res.data.data.student.id;
      fetchStudents(newStudentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSavingStudent(false);
    }
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Open existing invoice in printable receipt modal
  const openInvoiceReceipt = (inv: Invoice) => {
    if (!selectedStudent) return;
    const item = inv.items && inv.items.length > 0 ? inv.items[0] : null;
    setViewingReceiptData({
      invoiceNo: inv.invoice_no,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      studentName: selectedStudent.student_name,
      fatherName: selectedStudent.father_name || '',
      regNo: selectedStudent.registration_no,
      batchId: selectedStudent.batch_id || '',
      courseName: selectedStudent.course_name || '',
      addr1: selectedStudent.address_line1 || '',
      cityStatePin: selectedStudent.city_state_pin || '',
      contactNo: selectedStudent.contact_no || '',
      description: item?.description || 'Course Tuition Fee',
      qty: item?.quantity || 1,
      rate: item?.rate || inv.subtotal,
      discount: inv.discount,
    });
    setIsViewReceiptModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Admissions &amp; Billing"
          subtitle="Complete student enrollment, live receipt generator, and payment ledger"
          actionButton={
            !isAddMode && (
              <button
                onClick={initNewStudentForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            )
          }
        />

        {/* ========================================================================= */}
        {/* ADD STUDENT MODE: LIVE BILL GENERATOR INTERFACE (Section 10 Reference) */}
        {/* ========================================================================= */}
        {isAddMode ? (
          <main className="p-8 flex-1 overflow-y-auto">
            {/* Action Bar on Top of Generator */}
            <div className="no-print mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setIsAddMode(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Student Management
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print / Download Bill
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudent}
                  disabled={savingStudent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {savingStudent ? 'Saving Student...' : 'Save Student'}
                </button>
              </div>
            </div>

            {/* Split Screen: Left = Input Form, Right = Live Receipt Preview */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* LEFT SECTION: Form Panel (Reference bill_generator.html .panel) */}
              <div className="no-print w-full lg:w-[360px] flex-shrink-0 bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h2 className="text-sm font-bold text-[#16305e] mb-3">Bill Details</h2>

                {/* Invoice Section */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2.5">
                    Invoice
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Invoice No.</label>
                      <input
                        type="text"
                        value={billForm.invoiceNo}
                        onChange={(e) => setBillForm({ ...billForm, invoiceNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={billForm.invoiceDate}
                          onChange={(e) => setBillForm({ ...billForm, invoiceDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={billForm.dueDate}
                          onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Section */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2.5">
                    Student
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Student Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={billForm.studentName}
                        onChange={(e) => setBillForm({ ...billForm, studentName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Father's Name</label>
                      <input
                        type="text"
                        value={billForm.fatherName}
                        onChange={(e) => setBillForm({ ...billForm, fatherName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Registration No. *</label>
                      <input
                        type="text"
                        required
                        value={billForm.regNo}
                        onChange={(e) => setBillForm({ ...billForm, regNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1 font-semibold">Batch Id</label>
                      <select
                        value={billForm.batchId}
                        onChange={(e) => setBillForm({ ...billForm, batchId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e] bg-white"
                      >
                        <option value="">-- Select Batch (Optional) --</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.batch_id_code}>
                            {b.batch_id_code} — {b.batch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1 font-semibold text-[#16305e]">
                        Course Name *
                      </label>
                      <select
                        required
                        value={billForm.courseName}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e] bg-white font-medium text-slate-800"
                      >
                        <option value="">-- Select Allotted Course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.course_name}>
                            {c.course_name} {c.duration ? `(${c.duration})` : ''} - ₹{Number(c.default_fee).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                      {courses.length === 0 && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          No courses allotted to this institute yet. Please contact Superadmin.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={billForm.addr1}
                        onChange={(e) => setBillForm({ ...billForm, addr1: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">City, State - PIN</label>
                      <input
                        type="text"
                        value={billForm.cityStatePin}
                        onChange={(e) => setBillForm({ ...billForm, cityStatePin: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Contact No.</label>
                      <input
                        type="text"
                        value={billForm.contactNo}
                        onChange={(e) => setBillForm({ ...billForm, contactNo: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2.5">
                    Payment
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={billForm.description}
                        onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e] resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={billForm.qty}
                          onChange={(e) =>
                            setBillForm({ ...billForm, qty: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={billForm.rate}
                          onChange={(e) =>
                            setBillForm({ ...billForm, rate: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 block mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={billForm.discount}
                        onChange={(e) =>
                          setBillForm({ ...billForm, discount: Math.max(0, parseFloat(e.target.value) || 0) })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#16305e]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 bg-[#16305e] hover:bg-[#1e3d78] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Download Bill
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center leading-relaxed">
                  In print dialog, select <b>Save as PDF</b> to download A4 bill.
                </p>
              </div>

              {/* RIGHT SECTION: Live Receipt Preview (Faithful Reproduction of Bill) */}
              <div className="flex-1 w-full overflow-x-auto flex justify-center">
                <BillReceipt billData={billForm} settings={settings} />
              </div>
            </div>
          </main>
        ) : (
          /* ========================================================================= */
          /* REGULAR VIEW MODE: TWO-PANEL STUDENT MANAGEMENT (Sections 9 & 11) */
          /* ========================================================================= */
          <main className="p-8 flex-1 overflow-hidden">
            <TwoPanel
              leftWidthClass="w-full lg:w-[380px]"
              leftPanel={
                <div className="flex flex-col h-full">
                  {/* Left Filters */}
                  <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Students ({students.length})
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
                        placeholder="Search student, reg no, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <select
                          value={courseFilter}
                          onChange={(e) => setCourseFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none"
                        >
                          <option value="ALL">All Courses</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.course_name}>
                              {c.course_name.length > 20 ? c.course_name.slice(0, 20) + '...' : c.course_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={batchFilter}
                          onChange={(e) => setBatchFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none"
                        >
                          <option value="ALL">All Batches</option>
                          {batches.map((b) => (
                            <option key={b.id} value={b.batch_id_code}>
                              {b.batch_id_code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-1 text-[10px]">
                      {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setPaymentFilter(st)}
                          className={`flex-1 py-1 rounded font-medium text-center transition-colors ${
                            paymentFilter === st
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'PARTIALLY_PAID' ? 'PARTIAL' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student List Container with Independent Scroll */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {loading && students.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading student directory...</div>
                    ) : students.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        <p className="mb-2">No students registered yet.</p>
                        <button
                          onClick={initNewStudentForm}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Student
                        </button>
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
                                ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
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
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                {s.registration_no}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 truncate">
                                {s.course_name || 'No course assigned'}
                              </p>
                              <div className="flex items-center justify-between text-[10px] mt-2 pt-1 border-t border-slate-100 text-slate-400">
                                <span>Batch: {s.batch_id || '—'}</span>
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
                    {/* Selected Student Top Bar */}
                    <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
                          {selectedStudent.student_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">{selectedStudent.student_name}</h2>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {selectedStudent.registration_no}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span>Batch: <b>{selectedStudent.batch_id || '—'}</b></span>
                            <span>•</span>
                            <span>Course: <b>{selectedStudent.course_name || '—'}</b></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedStudent.invoices && selectedStudent.invoices.length > 0 && (
                          <button
                            onClick={() => openInvoiceReceipt(selectedStudent.invoices![0])}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Bill
                          </button>
                        )}
                        {selectedStudent.invoices &&
                          selectedStudent.invoices.some((i) => i.payment_status !== 'PAID') && (
                            <button
                              onClick={() => {
                                const unpaidInv = selectedStudent.invoices!.find(
                                  (i) => i.payment_status !== 'PAID'
                                );
                                setTargetInvoiceForPayment(unpaidInv || null);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Record Payment
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Tabs Navigation (Section 11) */}
                    <div className="px-6 border-b border-slate-200 bg-white flex gap-6">
                      {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'invoices', label: `Invoices (${selectedStudent.invoices?.length || 0})` },
                        { id: 'payments', label: `Payments (${selectedStudent.payments?.length || 0})` },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id as any)}
                          className={`py-3 text-xs font-bold border-b-2 transition-colors ${
                            activeTab === t.id
                              ? 'border-emerald-600 text-emerald-700'
                              : 'border-transparent text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: Overview */}
                    {activeTab === 'overview' && (
                      <div className="p-6 space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                            Student Profile &amp; Contact
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block mb-0.5">Father's Name</span>
                              <span className="font-semibold text-slate-800">
                                {selectedStudent.father_name || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Contact Phone</span>
                              <span className="font-semibold text-slate-800">
                                {selectedStudent.contact_no || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Course</span>
                              <span className="font-semibold text-slate-800">
                                {selectedStudent.course_name || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Batch Identifier</span>
                              <span className="font-semibold text-slate-800">
                                {selectedStudent.batch_id || '—'}
                              </span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-500 block mb-0.5">Address</span>
                              <span className="font-semibold text-slate-800">
                                {selectedStudent.address_line1}, {selectedStudent.city_state_pin}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Admission Date</span>
                              <span className="font-semibold text-slate-800">
                                {formatDateStr(selectedStudent.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl border border-slate-200 bg-white">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Total Invoiced
                            </span>
                            <div className="text-lg font-bold text-slate-900 mt-1">
                              {formatINR(selectedStudent.total_billed)}
                            </div>
                          </div>
                          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                              Total Paid
                            </span>
                            <div className="text-lg font-bold text-emerald-900 mt-1">
                              {formatINR(selectedStudent.total_paid)}
                            </div>
                          </div>
                          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                              Remaining Balance
                            </span>
                            <div className="text-lg font-bold text-amber-900 mt-1">
                              {formatINR(
                                Math.max((selectedStudent.total_billed || 0) - (selectedStudent.total_paid || 0), 0)
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Invoices */}
                    {activeTab === 'invoices' && (
                      <div className="p-6">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                                <th className="py-3 px-4">Invoice No</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Due Date</th>
                                <th className="py-3 px-4 text-right">Total</th>
                                <th className="py-3 px-4 text-right">Paid</th>
                                <th className="py-3 px-4 text-right">Balance</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedStudent.invoices?.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_no}</td>
                                  <td className="py-3 px-4 text-slate-600">{formatDateStr(inv.invoice_date)}</td>
                                  <td className="py-3 px-4 text-slate-600">{formatDateStr(inv.due_date)}</td>
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
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => openInvoiceReceipt(inv)}
                                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="Print / View Receipt"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>
                                      {inv.payment_status !== 'PAID' && (
                                        <button
                                          onClick={() => {
                                            setTargetInvoiceForPayment(inv);
                                            setIsPaymentModalOpen(true);
                                          }}
                                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                          title="Record Payment"
                                        >
                                          <CreditCard className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {(!selectedStudent.invoices || selectedStudent.invoices.length === 0) && (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-slate-400">
                                    No invoices generated.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Payments */}
                    {activeTab === 'payments' && (
                      <div className="p-6">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                                <th className="py-3 px-4">Payment Date</th>
                                <th className="py-3 px-4">Invoice #</th>
                                <th className="py-3 px-4">Method</th>
                                <th className="py-3 px-4">Reference ID</th>
                                <th className="py-3 px-4">Notes</th>
                                <th className="py-3 px-4 text-right">Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedStudent.payments?.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 text-slate-600">{formatDateStr(p.payment_date)}</td>
                                  <td className="py-3 px-4 font-mono font-medium text-slate-800">{p.invoice_no}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                                      {p.payment_method}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                    {p.transaction_reference || '—'}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">{p.notes || '—'}</td>
                                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                    {formatINR(p.amount)}
                                  </td>
                                </tr>
                              ))}
                              {(!selectedStudent.payments || selectedStudent.payments.length === 0) && (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-slate-400">
                                    No payment installments recorded for this student.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
                    Select a student from the left panel to inspect details.
                  </div>
                )
              }
            />
          </main>
        )}
      </div>

      {/* Payment Recording Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={targetInvoiceForPayment}
        onSuccess={() => {
          if (selectedStudent) fetchStudentDetails(selectedStudent.id);
          fetchStudents(selectedStudent?.id);
        }}
      />

      {/* Invoice Receipt Modal (For View & Print) */}
      <Modal
        isOpen={isViewReceiptModalOpen}
        onClose={() => setIsViewReceiptModalOpen(false)}
        title="Student Fee Invoice Receipt"
        subtitle={`Invoice No: ${viewingReceiptData?.invoiceNo}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt (A4)
            </button>
          </div>

          <div className="overflow-x-auto flex justify-center bg-slate-100 p-4 rounded-xl border border-slate-200">
            {viewingReceiptData && (
              <BillReceipt billData={viewingReceiptData} settings={settings} />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
