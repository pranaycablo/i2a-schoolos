import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { FeeType, FeeReceipt } from '../../types';
import {
  CreditCard,
  Plus,
  Receipt,
  Mail,
  MessageSquare,
  CheckCircle2,
  Printer,
  Download,
  Share2,
  DollarSign,
  Sparkles,
  Search,
  ShieldCheck,
  Send,
  AlertCircle,
  X
} from 'lucide-react';

export const FeeManagementModule: React.FC = () => {
  const {
    branding,
    students,
    feeTypes,
    addFeeType,
    feeReceipts,
    processFeePayment
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'PAYMENT_COLLECTION' | 'FEE_STRUCTURES' | 'RECEIPT_HISTORY'>('PAYMENT_COLLECTION');

  // Collection state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>(['fee-1', 'fee-2']);
  const [paymentMode, setPaymentMode] = useState<FeeReceipt['paymentMode']>('UPI');
  const [activeReceiptModal, setActiveReceiptModal] = useState<FeeReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Custom fee modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    code: 'CUSTOM',
    amount: 1000,
    frequency: 'MONTHLY' as FeeType['frequency'],
    category: 'CUSTOM' as FeeType['category'],
    isOptional: false,
    description: ''
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handlePayNow = async () => {
    if (!selectedStudent || selectedFeeIds.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setCollectionError(null);

    const idempotencyKey = `idem-${selectedStudent.id}-${[...selectedFeeIds].sort().join('-')}-${Date.now()}`;
    const result = await processFeePayment(selectedStudent.id, selectedFeeIds, paymentMode, idempotencyKey);
    setIsProcessing(false);

    if (result.success && result.receipt) {
      setActiveReceiptModal(result.receipt);
    } else {
      setCollectionError(result.error || 'Server rejected payment transaction. No receipt was created.');
    }
  };

  const handleAddFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFeeType(newFee);
    setShowFeeModal(false);
  };

  const totalSelectedFeeAmount = feeTypes
    .filter((f) => selectedFeeIds.includes(f.id))
    .reduce((acc, f) => acc + f.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" /> Automatic Fee Collection & Accounting Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Complete Fee Management & Digital Receipts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero Accountant manual workload: Payment → Auto Receipts → WhatsApp & Email Dispatch → Ledger Reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('PAYMENT_COLLECTION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PAYMENT_COLLECTION' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Collect Fee Desk
          </button>
          <button
            onClick={() => setActiveTab('FEE_STRUCTURES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FEE_STRUCTURES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Fee Structures ({feeTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('RECEIPT_HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECEIPT_HISTORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Digital Receipts ({feeReceipts.length})
          </button>
        </div>
      </div>

      {activeTab === 'PAYMENT_COLLECTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collect Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Payment Gateway & Counter Collection
            </h3>

            {/* Student Select */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-600 dark:text-slate-400 font-medium">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — Adm #{s.admissionNo} ({s.className}-{s.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Items Selection Checkboxes */}
            <div className="space-y-3">
              <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium">Select Due Fees to Include:</label>
              <div className="space-y-2">
                {feeTypes.map((fee) => {
                  const isChecked = selectedFeeIds.includes(fee.id);
                  return (
                    <div
                      key={fee.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedFeeIds(selectedFeeIds.filter((id) => id !== fee.id));
                        } else {
                          setSelectedFeeIds([...selectedFeeIds, fee.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <input type="checkbox" checked={isChecked} readOnly className="rounded text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{fee.name}</p>
                          <p className="text-[10px] text-slate-500">{fee.frequency} • {fee.description}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                        ₹{fee.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-600 dark:text-slate-400 font-medium">Payment Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {['UPI', 'NET_BANKING', 'CREDIT_CARD', 'CASH'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode as any)}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      paymentMode === mode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Total and Pay Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Collection Amount</p>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  ₹{totalSelectedFeeAmount.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {collectionError && (
                  <div role="alert" className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 max-w-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{collectionError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={selectedFeeIds.length === 0 || isProcessing}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-1">⏳</span> Verifying Collection...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Process & Generate Branded Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Automation Features Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" /> Automatic Workflow Chain
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When fee payment is received, i2A SchoolOS automatically triggers 9 parallel operations:
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1. Verifies Gateway Transaction
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 2. Generates Branded PDF Fee Receipt
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3. Creates Double-Entry Accounting Log
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4. Sends Email PDF Receipt to Parent
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 5. Triggers Approved WhatsApp Business Template
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 6. Updates Student Ledger & Dues
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 7. Updates Principal Financial KPI Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FEE_STRUCTURES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active School Fee Masters</h3>
            <button
              onClick={() => setShowFeeModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
            >
              <Plus className="w-4 h-4" /> Create Custom Fee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeTypes.map((fee) => (
              <div key={fee.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{fee.name}</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                      {fee.frequency}
                    </span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    ₹{fee.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{fee.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'RECEIPT_HISTORY' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Generated Digital Fee Receipts History</h3>
          <div className="space-y-3">
            {feeReceipts.map((rcp) => (
              <div
                key={rcp.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-slate-900 dark:text-white font-mono">{rcp.receiptNo}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {rcp.paymentMode}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Student: <b>{rcp.studentName}</b> (Adm #{rcp.admissionNo}) • {rcp.paymentDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">₹{rcp.paidAmount}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-500"><Mail className="w-3 h-3" /> Email</span>
                      <span className="flex items-center gap-1 text-emerald-500"><MessageSquare className="w-3 h-3" /> WhatsApp</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReceiptModal(rcp)}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                    title="View Branded PDF Receipt"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branded PDF Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-4 h-4" /> Branded Digital Fee Receipt
              </span>
              <button onClick={() => setActiveReceiptModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-md font-sans text-xs space-y-4">
              <div className="text-center border-b pb-4 space-y-1">
                <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 mx-auto object-cover rounded-md mb-2" />
                <h3 className="font-extrabold text-base tracking-tight" style={{ color: branding.primaryColor }}>
                  {branding.name}
                </h3>
                <p className="text-[10px] text-slate-500">{branding.address}</p>
                <div className="mt-2 inline-block px-3 py-1 text-[10px] font-extrabold text-white rounded-full" style={{ backgroundColor: branding.primaryColor }}>
                  OFFICIAL FEE RECEIPT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl">
                <div>
                  <p className="text-slate-400">Receipt No:</p>
                  <p className="font-mono font-bold">{activeReceiptModal.receiptNo}</p>
                </div>
                <div>
                  <p className="text-slate-400">Payment Date:</p>
                  <p className="font-bold">{activeReceiptModal.paymentDate}</p>
                </div>
                <div>
                  <p className="text-slate-400">Student Name:</p>
                  <p className="font-bold">{activeReceiptModal.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Adm No / Class:</p>
                  <p className="font-bold">{activeReceiptModal.admissionNo} ({activeReceiptModal.className}-{activeReceiptModal.section})</p>
                </div>
              </div>

              <div className="border-t border-b py-3 space-y-2">
                {activeReceiptModal.feeBreakup.map((f, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-700">{f.feeName}</span>
                    <span className="font-bold">₹{f.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-extrabold text-sm pt-1">
                <span>TOTAL AMOUNT PAID ({activeReceiptModal.paymentMode})</span>
                <span style={{ color: branding.primaryColor }}>₹{activeReceiptModal.paidAmount.toLocaleString()}</span>
              </div>

              {/* Verified Stamp & Sign */}
              <div className="pt-6 flex justify-between items-end text-[10px] border-t border-dashed">
                <div>
                  <p className="text-slate-400">Authorized Signatory</p>
                  <p className="font-bold text-slate-800">{branding.principalName}</p>
                </div>
                <div className="text-right">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 inline-block mb-1" />
                  <p className="font-semibold text-emerald-700">Digital Copy Verified</p>
                </div>
              </div>
            </div>

            {/* Notification Automation Log Box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Automated Communication Delivered
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                ✅ <b>WhatsApp Business Template:</b> "Dear Parent, ₹{activeReceiptModal.paidAmount} fee payment for {activeReceiptModal.studentName} received. Receipt #{activeReceiptModal.receiptNo}."
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                ✅ <b>Email Attachment:</b> Branded PDF Receipt dispatched to parent email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleAddFeeSubmit} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Custom Fee Structure</h3>
              <button type="button" onClick={() => setShowFeeModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Fee Name</label>
                <input
                  type="text"
                  required
                  value={newFee.name}
                  onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                  placeholder="e.g. Educational Tour Fee"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Frequency</label>
                <select
                  value={newFee.frequency}
                  onChange={(e) => setNewFee({ ...newFee, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="ONE_TIME">One Time</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  placeholder="e.g. Nalanda Historical Tour"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow"
              >
                Save Fee Structure
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
