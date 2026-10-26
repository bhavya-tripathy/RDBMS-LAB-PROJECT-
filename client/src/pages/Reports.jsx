import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart3, BookOpen, Clock, AlertTriangle, Users, 
  RotateCcw, IndianRupee, Printer, Download, RefreshCw, 
  Search, Filter, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'catalogue';
  const [activeTab, setActiveTab] = useState(tabParam);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Auxiliary filter states
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  // Load auxiliary lists for report filtering
  useEffect(() => {
    const fetchAux = async () => {
      try {
        const [studentsRes, catRes] = await Promise.all([
          api.getStudents(),
          api.getBookCategories()
        ]);
        setStudentsList(studentsRes.data || []);
        setCategoriesList(catRes.data || []);
      } catch (err) {
        console.error('Failed to load report filters:', err);
      }
    };
    fetchAux();
  }, []);

  // Fetch report data according to active tab
  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      switch (activeTab) {
        case 'catalogue':
          res = await api.getReportCatalogue({ category: selectedCategory });
          setData(res.data || []);
          break;
        case 'active':
          res = await api.getReportActiveIssues();
          setData(res.data || []);
          break;
        case 'overdue':
          res = await api.getReportOverdue();
          setData(res.data || []);
          break;
        case 'history':
          res = await api.getReportStudentHistory(selectedStudentId);
          setData(res.data || []);
          break;
        case 'circulation':
          res = await api.getReportCirculation();
          setData(res.data || { bookCirculation: [], categoryCirculation: [] });
          break;
        case 'fines':
          res = await api.getReportFines();
          setData(res.data || { summary: {}, records: [] });
          break;
        default:
          break;
      }
    } catch (err) {
      toast.error(err.message, 'Failed to Generate Report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedCategory, selectedStudentId]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!data) return;

    if (activeTab === 'circulation') {
      exportToCsv('Report_E_Book_Circulation', data.bookCirculation || []);
    } else if (activeTab === 'fines') {
      exportToCsv('Report_F_Fine_Summary', data.records || []);
    } else if (Array.isArray(data)) {
      exportToCsv(`Report_${activeTab.toUpperCase()}`, data);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Relational Reports & SQL Queries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real queries utilizing INNER JOIN, LEFT JOIN, GROUP BY, date arithmetic, and aggregate functions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-teal-300" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Header (Only shown during print) */}
      <div className="hidden print-header mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-slate-900">Manipal University Jaipur — Library Management System</h1>
        <div className="text-xs text-slate-600 mt-1">
          RDBMS Laboratory Project • Generated on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-sm flex items-center overflow-x-auto gap-1 no-print">
        <button
          onClick={() => handleTabChange('catalogue')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'catalogue' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Report A: Book Catalogue</span>
        </button>

        <button
          onClick={() => handleTabChange('active')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'active' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Report B: Currently Issued</span>
        </button>

        <button
          onClick={() => handleTabChange('overdue')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'overdue' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report C: Overdue Books</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'history' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Report D: Student History</span>
        </button>

        <button
          onClick={() => handleTabChange('circulation')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'circulation' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Report E: Book Circulation</span>
        </button>

        <button
          onClick={() => handleTabChange('fines')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'fines' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Report F: Fine Summary</span>
        </button>
      </div>

      {/* Sub-Filters per Report */}
      {activeTab === 'catalogue' && (
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 text-xs no-print">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter by Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
          >
            <option value="">All Categories ({categoriesList.length})</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 text-xs no-print">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter by Student:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
          >
            <option value="">All Students (Consolidated)</option>
            {studentsList.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_name} (#{s.student_id}) — {s.department}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* REPORT CONTENT BODY */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            <span>Executing SQL query against MySQL database...</span>
          </div>
        ) : (
          <>
            {/* REPORT A: COMPLETE CATALOGUE */}
            {activeTab === 'catalogue' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Book ID</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Author (Joined)</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">ISBN</th>
                      <th className="py-3 px-4 text-center">Total Copies</th>
                      <th className="py-3 px-4 text-center">Available Copies</th>
                      <th className="py-3 px-4 text-center">Issued Copies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((b) => (
                      <tr key={b.book_id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500">#{b.book_id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{b.title}</td>
                        <td className="py-3 px-4 text-slate-700">{b.author_name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{b.isbn}</td>
                        <td className="py-3 px-4 text-center font-mono">{b.total_copies}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{b.available_copies}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-700">{b.borrowed_copies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT B: CURRENTLY ISSUED BOOKS */}
            {activeTab === 'active' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Issue ID</th>
                      <th className="py-3 px-4">Student Borrower</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Schedule Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((i) => (
                      <tr key={i.issue_id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500">#{i.issue_id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{i.student_name}</div>
                          <div className="text-[10px] text-slate-400">{i.department}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{i.book_title}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{i.issue_date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">{i.due_date}</td>
                        <td className="py-3 px-4 text-right">
                          {i.is_overdue ? (
                            <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                              Overdue by {i.overdue_days} days
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                              Active / On Schedule
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT C: OVERDUE BOOKS */}
            {activeTab === 'overdue' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Issue ID</th>
                      <th className="py-3 px-4">Borrower Details</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Days Overdue</th>
                      <th className="py-3 px-4 text-right">Calculated Fine (₹5/day)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No overdue loans in the library system.
                        </td>
                      </tr>
                    ) : (
                      data.map((o) => (
                        <tr key={o.issue_id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-medium text-slate-500">#{o.issue_id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{o.student_name}</div>
                            <div className="text-[10px] text-slate-500">{o.student_email} • {o.department}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{o.book_title}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-600 text-[11px]">{o.due_date}</td>
                          <td className="py-3 px-4 text-center font-bold text-rose-700 font-mono">
                            {o.days_overdue} days
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                            ₹{parseFloat(o.calculated_fine).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT D: STUDENT BORROWING HISTORY */}
            {activeTab === 'history' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Issued</th>
                      <th className="py-3 px-4">Due</th>
                      <th className="py-3 px-4">Returned Date</th>
                      <th className="py-3 px-4 text-right">Fine</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((h) => (
                      <tr key={h.issue_id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{h.student_name}</div>
                          <div className="text-[10px] text-slate-400">{h.department}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{h.book_title}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{h.issue_date}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{h.due_date}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {h.return_date || <span className="text-amber-600 font-sans italic">Pending return</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          {h.fine_amount ? `₹${parseFloat(h.fine_amount).toFixed(2)}` : '₹0.00'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              h.status === 'RETURNED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT E: BOOK CIRCULATION SUMMARY */}
            {activeTab === 'circulation' && (
              <div className="space-y-6 p-4">
                <div className="overflow-x-auto">
                  <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-500">
                    Book-Level Circulation Metrics (SQL GROUP BY book_id)
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Author</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-center">Total Lifetime Loans</th>
                        <th className="py-2.5 px-3 text-center">Active Loans</th>
                        <th className="py-2.5 px-3 text-center">Returned Count</th>
                        <th className="py-2.5 px-3 text-right">Total Fines Accrued</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.bookCirculation?.map((c) => (
                        <tr key={c.book_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{c.title}</td>
                          <td className="py-2.5 px-3 text-slate-600">{c.author_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{c.category}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-teal-700 font-mono">
                            {c.total_times_issued}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                            {c.currently_issued_count}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-emerald-700">
                            {c.total_returned_count}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            ₹{parseFloat(c.total_fines_accrued).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto pt-4 border-t border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-500">
                    Category Circulation Summary (SQL GROUP BY category)
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Subject Category</th>
                        <th className="py-2.5 px-3 text-center">Unique Titles</th>
                        <th className="py-2.5 px-3 text-center">Total Loans</th>
                        <th className="py-2.5 px-3 text-right">Total Fines Recorded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.categoryCirculation?.map((cat) => (
                        <tr key={cat.category} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{cat.category}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{cat.unique_titles}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-teal-700 font-mono">
                            {cat.total_loans}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            ₹{parseFloat(cat.total_category_fines).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT F: FINE SUMMARY */}
            {activeTab === 'fines' && (
              <div className="space-y-6 p-4">
                {/* Aggregate KPI Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Fines Recorded</div>
                    <div className="text-xl font-bold text-amber-800 font-mono">
                      ₹{data.summary?.grandTotalFines?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Returns Audited</div>
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      {data.summary?.totalReturnsRecorded || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Returns with Fines</div>
                    <div className="text-xl font-bold text-rose-600 font-mono">
                      {data.summary?.returnsWithFines || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Average Fine when Overdue</div>
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      ₹{data.summary?.averageFineWhenOverdue?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Return ID</th>
                        <th className="py-2.5 px-3">Borrower Student</th>
                        <th className="py-2.5 px-3">Book Title</th>
                        <th className="py-2.5 px-3">Return Date</th>
                        <th className="py-2.5 px-3 text-center">Days Overdue</th>
                        <th className="py-2.5 px-3 text-right">Fine Recorded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.records?.map((r) => (
                        <tr key={r.return_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-500">#{r.return_id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{r.student_name}</td>
                          <td className="py-2.5 px-3 text-slate-800 max-w-[200px] truncate">{r.book_title}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{r.return_date}</td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {r.days_overdue > 0 ? (
                              <span className="text-rose-600 font-bold">{r.days_overdue}d</span>
                            ) : (
                              <span className="text-slate-400">0d</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {r.fine_amount > 0 ? (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ₹{parseFloat(r.fine_amount).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ₹0.00
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
