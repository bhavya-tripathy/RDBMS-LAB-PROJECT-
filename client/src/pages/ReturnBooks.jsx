import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, Search, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, IndianRupee, Calendar, X, Check, ShieldCheck, History
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReturnBooks() {
  const toast = useToast();
  const [activeLoans, setActiveLoans] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState('active'); // 'active' or 'history'

  // Return Processing Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load loans and history
  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.getActiveIssues(search),
        api.getReturns(search)
      ]);
      setActiveLoans(activeRes.data || []);
      setReturnHistory(historyRes.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // When librarian clicks "Process Return", open modal and calculate preview
  const handleOpenReturnModal = async (loan) => {
    setSelectedLoan(loan);
    const today = new Date().toISOString().split('T')[0];
    setReturnDate(today);
    setReturnModalOpen(true);
    fetchCalculation(loan.issue_id, today);
  };

  const fetchCalculation = async (issueId, date) => {
    setCalculating(true);
    try {
      const res = await api.calculateReturn({ issue_id: issueId, return_date: date });
      setCalculation(res.data);
    } catch (err) {
      toast.error(err.message, 'Calculation Failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleReturnDateChange = (newDate) => {
    setReturnDate(newDate);
    if (selectedLoan) {
      fetchCalculation(selectedLoan.issue_id, newDate);
    }
  };

  // Confirm Return Transaction
  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      const res = await api.processReturn({
        issue_id: selectedLoan.issue_id,
        return_date: returnDate
      });

      toast.success(
        res.message || `Book returned successfully. Inventory restored. Fine: ₹${res.data?.fine_amount}`,
        'Return Processed (Transaction Committed)'
      );
      setReturnModalOpen(false);
      setSelectedLoan(null);
      loadData();
    } catch (err) {
      toast.error(err.message, 'Return Transaction Failed (Rolled Back)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Return Books & Fine Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomically creates <code className="text-teal-700 font-mono">BookReturn</code> record, updates issue status to RETURNED, and increments available copies
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewTab === 'active'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Loans Pending Return ({activeLoans.length})
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewTab === 'history'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Processed Return Records ({returnHistory.length})
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, book, or ID..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ACTIVE LOANS */}
      {viewTab === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading && activeLoans.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
              <span>Querying active loans from Issue table...</span>
            </div>
          ) : activeLoans.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No active loans found matching search criteria. All books have been returned!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Loan ID</th>
                    <th className="py-3 px-4">Borrower Student</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLoans.map((loan) => (
                    <tr key={loan.issue_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                        #{loan.issue_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{loan.student_name}</div>
                        <div className="text-[10px] text-slate-400">{loan.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 max-w-[200px] truncate" title={loan.book_title}>
                          {loan.book_title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">ISBN: {loan.isbn}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {loan.issue_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={loan.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {loan.due_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {loan.is_overdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{loan.overdue_days} Days Overdue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>On Schedule</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenReturnModal(loan)}
                          className="bg-navy-900 hover:bg-navy-800 text-teal-300 border border-teal-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 text-teal-400" />
                          <span>Process Return</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROCESSED RETURNS HISTORY */}
      {viewTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {returnHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No completed return transactions recorded in the database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Return ID</th>
                    <th className="py-3 px-4">Issue #</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4 text-center">Overdue Days</th>
                    <th className="py-3 px-4 text-right">Fine Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnHistory.map((rec) => (
                    <tr key={rec.return_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        #{rec.return_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        #{rec.issue_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {rec.student_name}
                      </td>
                      <td className="py-3 px-4 text-slate-800 max-w-[200px] truncate" title={rec.book_title}>
                        {rec.book_title}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {rec.return_date}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.overdue_days > 0 ? (
                          <span className="text-rose-600 font-bold">{rec.overdue_days}d</span>
                        ) : (
                          <span className="text-slate-400">0d</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {rec.fine_amount > 0 ? (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            ₹{parseFloat(rec.fine_amount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            ₹0.00
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Process Book Return & Fine Computation Preview */}
      {returnModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-teal-400" />
                  <span>Process Book Return — Issue #{selectedLoan.issue_id}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Database transaction with 1:0..1 Return constraint enforcement
                </p>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Loan Details summary */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Borrower:</span>
                  <span className="font-semibold text-slate-900">{selectedLoan.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Book Title:</span>
                  <span className="font-semibold text-slate-900 max-w-[240px] truncate text-right">
                    {selectedLoan.book_title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Issue Date:</span>
                  <span className="font-mono text-slate-700">{selectedLoan.issue_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Scheduled Due Date:</span>
                  <span className="font-mono text-slate-700 font-bold">{selectedLoan.due_date}</span>
                </div>
              </div>

              {/* Return Date Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => handleReturnDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Defaults to current date. Change this date to test fine computation for academic viva.
                </span>
              </div>

              {/* Real-time Fine Calculation Preview */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-4 text-amber-950 space-y-2">
                <div className="font-bold text-xs flex items-center justify-between text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-amber-700" />
                    <span>Fine Calculation Breakdown</span>
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">
                    Rate: ₹5/day (Demo)
                  </span>
                </div>

                {calculating ? (
                  <div className="py-2 text-center text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Computing penalty formula...</span>
                  </div>
                ) : calculation ? (
                  <div className="text-xs space-y-1 pt-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Days Overdue:</span>
                      <span className="font-mono font-bold">
                        {calculation.overdue_days} day(s)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Formula:</span>
                      <span className="font-mono text-[11px]">
                        max(0, {calculation.return_date} - {calculation.due_date}) × ₹5
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-amber-200">
                      <span>Calculated Fine:</span>
                      <span className="text-amber-800 text-base font-mono">
                        ₹{calculation.fine_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ACID Transaction notice */}
              <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[11px] font-mono space-y-1">
                <div className="text-teal-400 font-bold">Atomic Transaction Details:</div>
                <div>1. INSERT INTO BookReturn (issue_id, return_date, fine_amount);</div>
                <div>2. UPDATE Issue SET status = 'RETURNED' WHERE issue_id = ?;</div>
                <div>3. UPDATE Book SET available_copies = available_copies + 1;</div>
                <div>4. COMMIT;</div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  disabled={submitting || calculating}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Return...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Return & Restore Copy</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
