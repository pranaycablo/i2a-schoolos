import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SchoolExpense } from '../../types';
import {
  BadgePercent,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Users,
  CreditCard,
  X
} from 'lucide-react';

export const PayrollExpenseModule: React.FC = () => {
  const { staffList, payrollRecords, disbursePayroll, expenses, addExpense, feeReceipts } = useSchool();

  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'EXPENSES'>('PAYROLL');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'MAINTENANCE' as SchoolExpense['category'],
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    approvedBy: 'Dr. Ramesh Chandra Sharma'
  });

  const totalIncome = feeReceipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netPosition = totalIncome - totalExpenses;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense(newExpense);
    setShowExpenseModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BadgePercent className="w-4 h-4" /> Financial Operations & HR
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Staff Payroll Processor & School Expense Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated Net Salary Calculations (Prorated Days + Bonus - Deductions) & Real-time Income vs Expense Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PAYROLL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Payroll Management ({payrollRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EXPENSES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Expense Ledger ({expenses.length})
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fee Income</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalIncome.toLocaleString()}</h3>
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total School Expenses</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400">₹{totalExpenses.toLocaleString()}</h3>
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white p-5 rounded-3xl border border-indigo-800 shadow-lg space-y-2">
          <span className="text-[10px] font-bold text-indigo-300 uppercase">Net Financial Surplus</span>
          <h3 className="text-2xl font-black text-white">₹{netPosition.toLocaleString()}</h3>
        </div>
      </div>

      {activeTab === 'PAYROLL' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Staff Monthly Payroll Records</h3>
          <div className="space-y-3 text-xs">
            {payrollRecords.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{pay.staffName}</h4>
                  <p className="text-[10px] text-slate-500">
                    Cycle: <b>{pay.month}</b> • Working Days: {pay.presentDays}/{pay.workingDays}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">₹{pay.netSalary.toLocaleString()}</span>
                    <p className="text-[10px] text-slate-400">Base: ₹{pay.baseSalary} + Bonus: ₹{pay.bonus}</p>
                  </div>

                  {pay.status === 'DISBURSED' ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                      Disbursed
                    </span>
                  ) : (
                    <button
                      onClick={() => disbursePayroll(pay.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow"
                    >
                      Disburse Net Salary
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'EXPENSES' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recorded Expense Vouchers</h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
            >
              <Plus className="w-4 h-4" /> Record New Expense
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{exp.title}</h4>
                  <p className="text-[10px] text-slate-500">Paid to: {exp.paidTo} • Date: {exp.date}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-red-600 dark:text-red-400">₹{exp.amount.toLocaleString()}</span>
                  <p className="text-[10px] text-slate-400">Approved by {exp.approvedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-xs">
          <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Record School Expense Voucher</h3>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Expense Title</label>
              <input
                type="text"
                required
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Paid To</label>
                <input
                  type="text"
                  required
                  value={newExpense.paidTo}
                  onChange={(e) => setNewExpense({ ...newExpense, paidTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow">
                Save Expense Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
