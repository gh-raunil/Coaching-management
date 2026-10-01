'use client';

import React from 'react';
import { formatINR, formatDateStr } from '@/lib/utils';
import { CoachingSettings } from '@/types';

export interface BillData {
  // Invoice
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  // Student
  studentName: string;
  fatherName?: string;
  regNo: string;
  batchId?: string;
  courseName?: string;
  addr1?: string;
  cityStatePin?: string;
  contactNo?: string;
  // Payment
  description: string;
  qty: number;
  rate: number;
  discount: number;
}

interface BillReceiptProps {
  billData: BillData;
  settings?: CoachingSettings | null;
  coachingName?: string;
}

export default function BillReceipt({
  billData,
  settings,
  coachingName = 'ITBEES - IT & Education Solutions',
}: BillReceiptProps) {
  const qty = Number(billData.qty) || 0;
  const rate = Number(billData.rate) || 0;
  const discount = Number(billData.discount) || 0;
  const amount = qty * rate;
  const subtotal = amount;
  const total = Math.max(subtotal - discount, 0);

  const displayCoachingName = settings?.name || coachingName;
  const displayContact = settings?.contact_number || '+91 9876543210';
  const displayWebsite = settings?.website || 'www.coachingportal.com';
  const displayEmail = settings?.email || settings?.support_email || 'info@coachingportal.com';

  return (
    <div className="bill-printable-root w-full flex justify-center py-2">
      <div
        id="bill-receipt-content"
        className="w-[794px] max-w-full min-h-[1050px] bg-white text-[#1d2a44] shadow-xl flex flex-col font-sans select-none border border-slate-200"
        style={{
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif",
        }}
      >
        {/* Header with gradient + diagonal cut */}
        <div
          className="bill-header-gradient"
          style={{
            background: 'linear-gradient(105deg, #8dc63f 0%, #4db8a4 45%, #29a8dd 100%)',
            clipPath: 'polygon(0 0, 100% 0, 100% 68%, 0 100%)',
            padding: '34px 44px 110px',
          }}
        >
          <div className="flex justify-between items-start gap-5">
            {/* Brand Information */}
            <div className="flex gap-4 items-start">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="w-[100px] h-auto object-contain max-h-[80px]"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#16305e] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {displayCoachingName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-[22px] font-bold text-[#16305e] leading-snug mb-1">
                  {displayCoachingName}
                </div>
                <div className="text-[13px] text-[#12355b] leading-relaxed">
                  {displayContact}
                  <br />
                  {displayWebsite}
                  <br />
                  {displayEmail}
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="flex-shrink-0 pt-1 text-right text-xs">
              <div className="flex text-[13px] text-[#16305e] leading-7 justify-end font-semibold">
                <span className="w-28 text-left font-semibold">Invoice No.</span>
                <span className="w-4 text-center">:</span>
                <span className="w-32 text-left font-bold font-mono">{billData.invoiceNo || '—'}</span>
              </div>
              <div className="flex text-[13px] text-[#16305e] leading-7 justify-end font-semibold">
                <span className="w-28 text-left font-semibold">Invoice Date</span>
                <span className="w-4 text-center">:</span>
                <span className="w-32 text-left font-bold">{formatDateStr(billData.invoiceDate) || '—'}</span>
              </div>
              <div className="flex text-[13px] text-[#16305e] leading-7 justify-end font-semibold">
                <span className="w-28 text-left font-semibold">Due Date</span>
                <span className="w-4 text-center">:</span>
                <span className="w-32 text-left font-bold">{formatDateStr(billData.dueDate) || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Body */}
        <div className="px-11 pb-8 flex-1 flex flex-col justify-between">
          <div>
            {/* BILL TO Header */}
            <div>
              <div className="text-[18px] font-bold text-[#16305e] tracking-wide">BILL TO</div>
              <div className="w-[52px] h-[4px] bg-[#9aa3b2] rounded mt-1.5 mb-6" />
            </div>

            {/* Two-Column Student Fields */}
            <div className="flex mb-8 gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-3.5 pr-4">
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Student Name</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.studentName}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Father's Name</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.fatherName}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Registration No.</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] font-mono px-1 pb-0.5 min-h-[20px]">
                    {billData.regNo}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Batch Id</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.batchId}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Course Name</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.courseName}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-3.5 pl-6 border-l border-[#8a8f99]">
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Address Line 1</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.addr1}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">City, State - PIN</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.cityStatePin}
                  </span>
                </div>
                <div className="flex items-end text-xs text-[#1f2937]">
                  <span className="w-[125px] flex-shrink-0 font-medium">Contact No.</span>
                  <span className="w-[18px] flex-shrink-0 font-medium">:</span>
                  <span className="flex-1 border-b-[1.5px] border-[#333] font-bold text-[#16305e] px-1 pb-0.5 min-h-[20px]">
                    {billData.contactNo}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse text-xs mb-8">
              <thead>
                <tr>
                  <th className="bg-[#16305e] text-white border-[1.5px] border-[#333] p-3 text-left font-bold text-sm w-[40%]">
                    Description
                  </th>
                  <th className="border-[1.5px] border-[#333] p-3 text-center font-bold text-[#1d2a44] w-[18%]">
                    Quantity
                  </th>
                  <th className="border-[1.5px] border-[#333] p-3 text-center font-bold text-[#1d2a44] w-[21%]">
                    Rate (₹)
                  </th>
                  <th className="border-[1.5px] border-[#333] p-3 text-center font-bold text-[#1d2a44] w-[21%]">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={4} className="border-[1.5px] border-[#333] p-3 text-slate-800 align-top leading-relaxed text-xs">
                    {billData.description || '—'}
                  </td>
                  <td className="border-[1.5px] border-[#333] p-3 text-center text-slate-800 font-medium">
                    {qty || ''}
                  </td>
                  <td className="border-[1.5px] border-[#333] p-3 text-center text-slate-800 font-medium">
                    {formatINR(rate)}
                  </td>
                  <td className="border-[1.5px] border-[#333] p-3 text-center font-bold text-slate-900">
                    {formatINR(amount)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-[1.5px] border-[#333] p-2.5 px-4 font-normal text-slate-700">
                    Subtotal
                  </td>
                  <td className="border-[1.5px] border-[#333] p-2.5 text-center font-semibold text-slate-900">
                    {formatINR(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border-[1.5px] border-[#333] p-2.5 px-4 font-normal text-slate-700">
                    Discount
                  </td>
                  <td className="border-[1.5px] border-[#333] p-2.5 text-center font-semibold text-red-600">
                    {formatINR(discount)}
                  </td>
                </tr>
                <tr className="bg-[#dcdfe3]">
                  <td colSpan={2} className="border-[1.5px] border-[#333] p-3 px-4 font-bold text-sm text-[#1d2a44]">
                    TOTAL
                  </td>
                  <td className="border-[1.5px] border-[#333] p-3 text-center font-bold text-sm text-[#16305e]">
                    {formatINR(total)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Notes Section */}
            <div>
              <div className="text-[16px] font-bold text-[#16305e] mb-3">NOTES</div>

              <div className="space-y-2.5">
                {/* Note 1 */}
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#16305e] text-white flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <path d="M6 3h12M6 8h12M14.5 21 6 13h3c5 0 5-10 0-10" />
                    </svg>
                  </div>
                  <div className="text-xs text-[#1f2937] leading-relaxed">
                    {settings?.receipt_notes_line1 || (
                      <>
                        Fee paid are non-refundable nor transferable at any case.
                        <br />
                        This is a system generated bill.
                      </>
                    )}
                  </div>
                </div>

                {/* Note 2 */}
                <div className="flex gap-4 items-center pt-2 border-t border-[#9aa3b2] max-w-[420px]">
                  <div className="w-10 h-10 rounded-full bg-[#16305e] text-white flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <rect x="7" y="2.5" width="10" height="19" rx="2" />
                      <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
                    </svg>
                  </div>
                  <div className="text-xs text-[#1f2937] leading-relaxed">
                    {settings?.receipt_notes_line2 || (
                      <>
                        Please share the payment screenshot
                        <br />
                        on our WhatsApp number or email.
                      </>
                    )}
                  </div>
                </div>

                {/* Note 3 */}
                <div className="flex gap-4 items-center pt-2 border-t border-[#9aa3b2] max-w-[420px]">
                  <div className="w-10 h-10 rounded-full bg-[#16305e] text-white flex items-center justify-center flex-shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>
                  <div className="text-xs text-[#1f2937] leading-relaxed">
                    {settings?.receipt_notes_line3 || (
                      <>
                        For any queries or assistance,
                        <br />
                        contact us via WhatsApp or email.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Thanks */}
          <div className="text-center pt-6 pb-2">
            <div className="text-[16px] font-bold text-[#16305e] tracking-wider">THANK YOU</div>
            <div className="text-xs text-[#374151] mt-1">
              {settings?.receipt_footer_msg || `We appreciate your trust in ${displayCoachingName}.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
