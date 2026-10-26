import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, Users, BookOpen, Calendar, CheckCircle2, 
  AlertTriangle, RefreshCw, Search, ShieldCheck, Clock, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function IssueBooks() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeIssues, setActiveIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTable, setSearchTable] = useState('');

  // Default dates: today and +14 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    student_id: '',
    book_id: '',
    issue_date: todayStr,
    due_date: defaultDueStr
  });

  const [selectedBookMeta, setSelectedBookMeta] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, booksRes, activeRes] = await Promise.all([
        api.getStudents(),
        api.getBooks(),
        api.getActiveIssues(searchTable)
      ]);
      setStudents(studentsRes.data || []);
      setBooks(booksRes.data || []);
      setActiveIssues(activeRes.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Issuing Data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTable]);

  // When selected book changes, update metadata preview
  const handleBookChange = (bookId) => {
    setFormData({ ...formData, book_id: bookId });
    const book = books.find((b) => b.book_id === parseInt(bookId, 10));
    setSelectedBookMeta(book || null);
  };

  // Submit Issue Book Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      toast.error('Please select a student from the registered list.');
      return;
    }
    if (!formData.book_id) {
      toast.error('Please select a book to issue.');
      return;
    }

    if (new Date(formData.due_date) < new Date(formData.issue_date)) {
      toast.error('Due date cannot precede the issue date. Relational CHECK constraint enforced.');
      return;
    }

    if (selectedBookMeta && selectedBookMeta.available_copies <= 0) {
      toast.error(`"${selectedBookMeta.title}" has 0 available copies in stock.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.issueBook(formData);
      toast.success(
        res.message || `Book issued successfully (Issue #${res.data.issue_id}). Available copies decremented.`,
        'Transaction Committed'
      );
      
      // Reset form fields
      setFormData({
        student_id: '',
        book_id: '',
        issue_date: todayStr,
        due_date: defaultDueStr
      });
      setSelectedBookMeta(null);

      // Refresh data
      loadData();
    } catch (err) {
      toast.error(err.message, 'Issue Transaction Failed (Rolled Back)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Issue Books (ACID Transaction)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atomically records checkout in <code className="text-teal-700 font-mono">Issue</code> table and decrements <code className="text-teal-700 font-mono">Book.available_copies</code> with row-level locking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Transactional Issue Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">New Book Loan</h2>
                <span className="text-[11px] text-slate-500">Atomic Checkout Flow</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
              START TRANSACTION
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Student Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Student Borrower <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800"
                >
                  <option value="">— Choose Registered Student —</option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_name} (#{s.student_id}) — {s.department}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                FK: <code className="font-mono text-teal-700">Issue.student_id → Student(student_id)</code>
              </span>
            </div>

            {/* Book Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Book Title <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.book_id}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800"
              >
                <option value="">— Choose Book from Catalogue —</option>
                {books.map((b) => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} ({b.available_copies}/{b.total_copies} available)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                FK: <code className="font-mono text-teal-700">Issue.book_id → Book(book_id)</code>
              </span>
            </div>

            {/* Live Availability Callout */}
            {selectedBookMeta && (
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                selectedBookMeta.available_copies > 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div>
                  <div className="font-semibold">{selectedBookMeta.title}</div>
                  <div className="text-[11px] opacity-80 font-mono">
                    ISBN: {selectedBookMeta.isbn} • Category: {selectedBookMeta.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono">
                    {selectedBookMeta.available_copies} / {selectedBookMeta.total_copies}
                  </div>
                  <div className="text-[10px] font-medium">
                    {selectedBookMeta.available_copies > 0 ? 'Copies in Stock' : 'Out of Stock'}
                  </div>
                </div>
              </div>
            )}

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={formData.issue_date}
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Enforces <code className="font-mono text-teal-700">chk_issue_due_date (due_date &gt;= issue_date)</code>
            </span>

            {/* Transaction Protocol Details */}
            <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[11px] font-mono space-y-1">
              <div className="text-teal-400 font-bold">Relational Transaction Flow:</div>
              <div>1. SELECT book_id FROM Book WHERE ... FOR UPDATE;</div>
              <div>2. Validate available_copies &gt; 0;</div>
              <div>3. INSERT INTO Issue (status = 'ISSUED');</div>
              <div>4. UPDATE Book SET available_copies = available_copies - 1;</div>
              <div>5. COMMIT; -- Rolls back entirely on error</div>
            </div>

            <button
              type="submit"
              disabled={submitting || (selectedBookMeta && selectedBookMeta.available_copies <= 0)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Transaction...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Issue Book to Student</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Issues Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Currently Active Loans ({activeIssues.length})
              </h2>
              <span className="text-xs text-slate-500">Books currently in circulation (status = 'ISSUED')</span>
            </div>

            {/* Quick search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Filter by borrower or book..."
                className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-44"
              />
            </div>
          </div>

          {activeIssues.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No active loans found matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Loan ID</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeIssues.map((loan) => (
                    <tr key={loan.issue_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-500">
                        #{loan.issue_id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{loan.student_name}</div>
                        <div className="text-[10px] text-slate-400">{loan.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 max-w-[170px] truncate" title={loan.book_title}>
                          {loan.book_title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">ISBN: {loan.isbn}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-700 text-[11px]">{loan.due_date}</div>
                        <div className="text-[10px] text-slate-400">Issued: {loan.issue_date}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {loan.is_overdue ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            Overdue ({loan.overdue_days}d)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            On Schedule
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
      </div>
    </div>
  );
}
