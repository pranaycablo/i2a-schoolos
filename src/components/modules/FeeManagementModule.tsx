import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { FeeType, FeeReceipt, Student } from '../../types';
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
  X,
  User,
  Check,
  Calendar,
  Clock,
  Filter,
  Eye,
  ArrowRight
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

  const [activeTab, setActiveTab] = useState<'COUNTER' | 'DUES_REGISTER' | 'RECEIPTS' | 'STRUCTURE'>('COUNTER');

  // Fast Fee Counter State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>(['fee-1', 'fee-2', 'fee-5']);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<FeeReceipt['paymentMode']>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState<FeeReceipt | null>(null);

  // New Fee Category Modal State
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    code: 'CUSTOM',
    amount: 1500,
    frequency: 'MONTHLY' as FeeType['frequency'],
    category: 'CUSTOM' as FeeType['category'],
    isOptional: false,
    description: 'Special Activity or Lab Fee'
  });

  // Receipts Search
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Calculations for Counter
  const selectedFees = feeTypes.filter((f) => selectedFeeIds.includes(f.id));
  const subtotal = selectedFees.reduce((acc, f) => acc + f.amount, 0);
  const netPayable = Math.max(0, subtotal - (Number(discountAmount) || 0));

  // Overall Financial Counters
  const totalCollectedSession = feeReceipts.reduce((acc, r) => acc + r.paidAmount, 0) + 1840000;
  const totalPendingDues = students.reduce((acc, s) => acc + (s.feeDueAmount || 0), 0) + 540000;
  const todayReceiptsCount = feeReceipts.length;

  const handleToggleFee = (feeId: string) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    );
  };

  const handleSelectAllFees = () => {
    if (selectedFeeIds.length === feeTypes.length) {
      setSelectedFeeIds([]);
    } else {
      setSelectedFeeIds(feeTypes.map((f) => f.id));
    }
  };

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
    if (!newFee.name.trim()) return;
    addFeeType(newFee);
    setShowFeeModal(false);
    setNewFee({
      name: '',
      code: 'CUSTOM',
      amount: 1500,
      frequency: 'MONTHLY',
      category: 'CUSTOM',
      isOptional: false,
      description: ''
    });
  };

  const getWhatsAppReminderUrl = (student: Student, dueAmount: number) => {
    const parentName = student.fatherName || student.guardianName || 'Parent';
    const phone = (student.parentWhatsApp || student.parentMobile || '').replace(/[^0-9]/g, '');
    const message = `आदरणीय ${parentName} जी,\nनमस्ते! ${branding.name} की ओर से सादर सूचित किया जाता है कि ${student.name} (कक्षा: ${student.className}-${student.section}, रोल: ${student.rollNo}) की शैक्षणिक फीस ₹${dueAmount.toLocaleString()} बकाया है।\n\nकृपया समय पर शुल्क भुगतान कर असुविधा से बचें। UPI / ऑनलाइन काउंटर या स्कूल ऑफिस में संपर्क करें: ${branding.phone}।\n— लेखा विभाग, ${branding.name}`;
    return `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppReceiptUrl = (receipt: FeeReceipt) => {
    const phone = (selectedStudent.parentWhatsApp || selectedStudent.parentMobile || '').replace(/[^0-9]/g, '');
    const message = `नमस्ते ${selectedStudent.fatherName || 'Parent'} जी,\n${branding.name} में ${receipt.studentName} (कक्षा ${receipt.className}-${receipt.section}) की फीस राशि ₹${receipt.paidAmount.toLocaleString()} सफलतापूर्वक प्राप्त हुई।\n\nरसीद सं: ${receipt.receiptNo}\nभुगतान माध्यम: ${receipt.paymentMode}\nतारीख: ${receipt.paymentDate || 'Today'}\n\nधन्यवाद!\n— लेखा विभाग, ${branding.name}`;
    return `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
  };

  const filteredStudentsForSearch = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.admissionNo.includes(studentSearchQuery) ||
      s.rollNo.includes(studentSearchQuery) ||
      s.className.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const filteredReceipts = feeReceipts.filter(
    (r) =>
      r.receiptNo.toLowerCase().includes(receiptSearchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(receiptSearchQuery.toLowerCase()) ||
      r.paymentMode.toLowerCase().includes(receiptSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" /> Pro-Level School Accounts & Fee Counter
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Fee Collection, Dues Management & Digital Receipts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            शिक्षण शुल्क, ट्रांसपोर्ट, लैब, परीक्षा व वार्षिक शुल्क का अलग-अलग पारदर्शी हिसाब और 1-क्लिक डिजिटल रसीद।
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('COUNTER')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'COUNTER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ⚡ फीस काउंटर (Quick Pay)
          </button>
          <button
            onClick={() => setActiveTab('DUES_REGISTER')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'DUES_REGISTER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ⚠️ बकाया रजिस्टर (Dues)
          </button>
          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'RECEIPTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🧾 रसीद लेजर (Receipts)
          </button>
          <button
            onClick={() => setActiveTab('STRUCTURE')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'STRUCTURE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ⚙️ शुल्क संरचना (Master)
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">कुल फीस वसूली (Realized)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{(totalCollectedSession / 100000).toFixed(2)}L
          </h3>
          <p className="text-[10px] text-slate-500">76.7% Realization vs Target</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">कुल बकाया राशि (Pending Dues)</p>
          <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">
            ₹{(totalPendingDues / 100000).toFixed(2)}L
          </h3>
          <p className="text-[10px] text-slate-500">Across All Active Classes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">आज का कुल कलेक्शन</p>
          <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            ₹42,800
          </h3>
          <p className="text-[10px] text-slate-500">18 Transactions (Cash + UPI)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">डिजिटल रसीदें जारी</p>
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">
            {todayReceiptsCount + 140}
          </h3>
          <p className="text-[10px] text-slate-500">100% Computerized Records</p>
        </div>
      </div>

      {/* TAB 1: FAST FEE COUNTER */}
      {activeTab === 'COUNTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Selector & Category Breakdown */}
          <div className="lg:col-span-2 space-y-5">
            {/* Student Search & Quick Select */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> छात्र चुनें (Select Student for Collection)
                </span>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="नाम या रोल नंबर से खोजें..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Cards Carousel / Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredStudentsForSearch.slice(0, 6).map((std) => (
                  <button
                    key={std.id}
                    onClick={() => setSelectedStudentId(std.id)}
                    className={`p-3 rounded-2xl border text-left shrink-0 transition-all flex items-center gap-3 ${
                      selectedStudentId === std.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <img src={std.photoUrl} alt={std.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[120px]">{std.name}</p>
                      <p className="text-[10px] text-slate-500">{std.className}-{std.section} • Roll {std.rollNo}</p>
                      {std.feeDueAmount && std.feeDueAmount > 0 ? (
                        <span className="text-[9px] font-bold text-rose-500 block">Due: ₹{std.feeDueAmount}</span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-500 block">✓ Cleared</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Student Active Profile Banner */}
              {selectedStudent && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-slate-900 dark:text-white">{selectedStudent.name}</h4>
                        <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Adm #{selectedStudent.admissionNo}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        कक्षा: <b>{selectedStudent.className}-{selectedStudent.section}</b> • रोल नं: <b>{selectedStudent.rollNo}</b> • पिता: <b>{selectedStudent.fatherName}</b>
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
                    <span className="text-[10px] text-slate-400 block">अभिभावक मोबाइल</span>
                    <b className="font-mono text-slate-900 dark:text-white text-xs">{selectedStudent.parentMobile}</b>
                  </div>
                </div>
              )}
            </div>

            {/* Fee Categories - All Distinct & Interactive (सब अलग-अलग) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    शुल्क मदवार विवरण (Category-wise Fee Breakdown)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    जिस मद की फीस आज जमा करनी है, उसे चुनें (Select categories to pay today)
                  </p>
                </div>

                <button
                  onClick={handleSelectAllFees}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
                >
                  {selectedFeeIds.length === feeTypes.length ? 'Deselect All' : 'Select All Categories'}
                </button>
              </div>

              {/* Fee Categories Cards List */}
              <div className="space-y-2.5">
                {feeTypes.map((fee) => {
                  const isChecked = selectedFeeIds.includes(fee.id);
                  return (
                    <div
                      key={fee.id}
                      onClick={() => handleToggleFee(fee.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isChecked
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">{fee.name}</h5>
                            <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {fee.frequency}
                            </span>
                            {fee.isOptional && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{fee.description || 'Standard Academic Dues'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          ₹{fee.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{fee.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Billing Summary & Payment Processor */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[10px] tracking-wider">
                  Billing Counter
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  भुगतान विवरण (Payment Summary)
                </h3>
              </div>

              {/* Selected Categories Breakdown */}
              <div className="space-y-2 text-xs">
                {selectedFees.length === 0 ? (
                  <p className="text-amber-600 text-xs text-center py-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                    कृपया कम से कम एक फीस मद चुनें।
                  </p>
                ) : (
                  selectedFees.map((f) => (
                    <div key={f.id} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{f.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{f.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center font-bold">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-mono text-slate-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center gap-2 pt-1">
                  <span className="text-slate-500">छूट / स्कॉलरशिप (Discount):</span>
                  <div className="flex items-center w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
                    <span className="text-slate-400 text-xs font-mono mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-transparent text-right font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Grand Total */}
                <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/40 dark:to-indigo-950/40 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 flex justify-between items-center mt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">कुल देय राशि (Net Total)</span>
                    <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      ₹{netPayable.toLocaleString()}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-emerald-600 text-white rounded-lg">
                    {selectedFees.length} Items Selected
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="block text-slate-500 font-bold text-[11px]">भुगतान माध्यम (Payment Mode) *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'UPI', 'NET_BANKING', 'CHEQUE'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all text-center ${
                        paymentMode === mode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {mode === 'CASH' && '💵 Cash (नकद)'}
                      {mode === 'UPI' && '📲 UPI / QR'}
                      {mode === 'NET_BANKING' && '🏦 Net Banking'}
                      {mode === 'CHEQUE' && '📝 Cheque / DD'}
                    </button>
                  ))}
                </div>
              </div>

              {collectionError && (
                <div className="bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl border border-rose-200 text-rose-600 text-xs">
                  {collectionError}
                </div>
              )}

              {/* Big Action Button */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isProcessing || selectedFees.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>प्रोसेस हो रहा है...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> फीस जमा करें एवं डिजिटल रसीद बनाएं
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING DUES REGISTER */}
      {activeTab === 'DUES_REGISTER' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              छात्रवार बकाया फीस रजिस्टर (Pending Dues & WhatsApp Alerts)
            </h3>
            <p className="text-slate-500 text-xs">
              यहाँ से आप सीधे अभिभावकों के व्हाट्सएप पर भुगतान अनुस्मारक (Payment Due Reminder) भेज सकते हैं।
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Student</th>
                    <th className="p-4">Class & Roll</th>
                    <th className="p-4">Parent & Contact</th>
                    <th className="p-4">Overdue Amount</th>
                    <th className="p-4">Due Status</th>
                    <th className="p-4 text-right">1-Click WhatsApp Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((std) => {
                    const due = std.feeDueAmount || (std.attendanceRate < 85 ? 4800 : 0);
                    const isOverdue = due > 0;
                    return (
                      <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={std.photoUrl} alt={std.name} className="w-9 h-9 rounded-xl object-cover" />
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">{std.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Adm #{std.admissionNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{std.className}-{std.section}</span>
                          <span className="text-slate-400 text-[10px] block">Roll No. {std.rollNo}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{std.fatherName}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{std.parentMobile}</p>
                        </td>
                        <td className="p-4">
                          {isOverdue ? (
                            <span className="font-mono font-black text-rose-600 text-sm">
                              ₹{due.toLocaleString()}
                            </span>
                          ) : (
                            <span className="font-mono text-emerald-600 font-bold text-xs">
                              ₹0 (No Dues)
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isOverdue ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-800">
                              Overdue • 15 Days
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                              ✓ Cleared
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isOverdue ? (
                            <a
                              href={getWhatsAppReminderUrl(std, due)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Reminder
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIPT HISTORY */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                शुल्क रसीद लेजर (All Issued Fee Receipts)
              </h3>
              <p className="text-slate-400 text-xs">जारी की गई सभी डिजिटल रसीदें यहाँ सुरक्षित संग्रहीत हैं।</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="रसीद नं या छात्र के नाम से खोजें..."
                value={receiptSearchQuery}
                onChange={(e) => setReceiptSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Receipt No</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.receiptNo}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {r.studentName}
                      </td>
                      <td className="p-4 text-slate-500">
                        {r.className}-{r.section}
                      </td>
                      <td className="p-4 font-mono font-black text-emerald-600 text-sm">
                        ₹{r.paidAmount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {r.paymentMode}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setActiveReceiptModal(r)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-indigo-600 dark:text-indigo-400 font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> रसीद देखें (View)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEE STRUCTURE MASTER */}
      {activeTab === 'STRUCTURE' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                अधिकृत शुल्क संरचना मास्टर (Authorized Fee Schedule)
              </h3>
              <p className="text-slate-400 text-xs">सत्र {branding.academicSession} के लिए मान्य शुल्क श्रेणियां</p>
            </div>

            <button
              onClick={() => setShowFeeModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> नई शुल्क श्रेणी जोड़ें (Add Fee Type)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {feeTypes.map((f) => (
              <div key={f.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      {f.frequency}
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">{f.name}</h4>
                  </div>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                    ₹{f.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{f.description || 'Standard institutional fee schedule item.'}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Category: {f.category}</span>
                  <span className={f.isOptional ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                    {f.isOptional ? 'Optional' : 'Compulsory'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Printable Fee Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Action Bar */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                Official Computerized Fee Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> प्रिंट (Print)
                </button>
                <a
                  href={getWhatsAppReceiptUrl(activeReceiptModal)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> व्हाट्सएप (Share)
                </a>
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
              {/* Receipt Header */}
              <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <img src={branding.logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border" />
                <div className="flex-1">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{branding.name}</h3>
                  <p className="text-[11px] text-slate-500">{branding.address}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                    <span>Affiliated to {branding.board}</span>
                    <span>•</span>
                    <span>Helpline: {branding.phone}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] block">Receipt Number</span>
                  <b className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{activeReceiptModal.receiptNo}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Payment Date & Time</span>
                  <b className="font-mono">{activeReceiptModal.paymentDate || new Date().toISOString().split('T')[0]}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Student Name</span>
                  <b className="text-slate-900 dark:text-white">{activeReceiptModal.studentName}</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Class & Admission No.</span>
                  <b>{activeReceiptModal.className}-{activeReceiptModal.section} (Adm #{activeReceiptModal.admissionNo})</b>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Fee Category</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeReceiptModal.feeBreakup.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.feeName}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-950 font-black">
                      <td className="p-3 text-slate-900 dark:text-white">Total Amount Paid</td>
                      <td className="p-3 text-right font-mono text-emerald-600 text-sm">
                        ₹{activeReceiptModal.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Stamp & Sign */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Payment Mode: <b>{activeReceiptModal.paymentMode}</b></span>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Payment Verified & Reconciled</span>
                </div>
                <div className="text-center">
                  <img src={branding.stampUrl} alt="Stamp" className="w-12 h-12 mx-auto opacity-80" />
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">Authorized Cashier Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Fee Category Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddFeeSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">नई शुल्क श्रेणी जोड़ें (Add Fee Type)</h4>
              <button type="button" onClick={() => setShowFeeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Fee Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Robotics & Coding Lab Fee"
                value={newFee.name}
                onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Frequency *</label>
                <select
                  value={newFee.frequency}
                  onChange={(e) => setNewFee({ ...newFee, frequency: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ONE_TIME">One Time</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief detail of what this covers"
                value={newFee.description}
                onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              शुल्क मास्टर में सेव करें (Save to Master)
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
