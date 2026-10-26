import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Feather, BookOpen, Layers, CheckCircle2, 
  Clock, AlertTriangle, IndianRupee, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, ChevronRight, BarChart2, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const PIE_COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

export default function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [overdueAlerts, setOverdueAlerts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes, returnsRes, alertsRes, catRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentIssues(),
        api.getRecentReturns(),
        api.getOverdueAlerts(),
        api.getCategoryStats()
      ]);

      setStats(statsRes.data);
      setRecentIssues(issuesRes.data || []);
      setRecentReturns(returnsRes.data || []);
      setOverdueAlerts(alertsRes.data || []);
      setCategoryStats(catRes.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Library Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry and relational database metrics from MySQL 8.0
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/issue"
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue a Book</span>
          </Link>
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

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <Link
          to="/students"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Students</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.totalStudents : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Registered borrowers</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Authors */}
        <Link
          to="/authors"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Authors</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Feather className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.totalAuthors : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Catalogue creators</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Book Titles */}
        <Link
          to="/books"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Book Titles</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.totalBookTitles : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Unique ISBN titles</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Copies Breakdown */}
        <Link
          to="/books"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Available Copies</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {stats ? `${stats.availableCopies} / ${stats.totalCopies}` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats ? `${stats.totalCopies - stats.availableCopies} on loan` : 'Inventory status'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 5: Currently Issued */}
        <Link
          to="/reports"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Currently Issued</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats ? stats.currentlyIssued : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Active transactions</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 6: Overdue Loans (Alert) */}
        <Link
          to="/reports"
          className={`p-4 rounded-xl border transition-all group ${
            stats?.overdueLoans > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400 hover:shadow-md'
              : 'bg-white border-slate-200/80 hover:border-teal-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-rose-800">Overdue Loans</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {stats ? stats.overdueLoans : '—'}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1 flex items-center justify-between">
            <span>Past due date</span>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 7: Total Fines Collected */}
        <Link
          to="/reports"
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-500/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Recorded Fines</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{stats ? stats.totalFines.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>@ ₹{stats ? stats.fineRatePerDay : '5'}/day</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Card 8: Database Engine Integrity */}
        <Link
          to="/database-overview"
          className="bg-navy-900 text-white p-4 rounded-xl border border-navy-800 hover:border-teal-500/60 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-teal-300">RDBMS Engine</span>
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-lg group-hover:bg-teal-500 group-hover:text-navy-950 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            InnoDB
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>ACID & FK Integrity</span>
            <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Catalogue by Category</h2>
              <p className="text-xs text-slate-500">Total physical copies vs. currently available</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Book Table Aggregation
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="total_copies" name="Total Copies" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available_copies" name="Available Copies" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Title Diversity</h2>
            <p className="text-xs text-slate-500">Distribution of unique titles by subject</p>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  dataKey="book_count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-center text-slate-400 mt-2">
            {categoryStats.length} distinct academic domains catalogued
          </div>
        </div>
      </div>

      {/* Tables Row: Overdue Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Overdue Loan Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
              <h2 className="text-sm font-bold text-slate-900">Overdue Loan Alerts</h2>
            </div>
            <Link to="/reports" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              View all
            </Link>
          </div>

          {overdueAlerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <span>No overdue loans currently pending.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Book Title</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Overdue</th>
                    <th className="pb-2 text-right">Fine</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueAlerts.slice(0, 4).map((alert) => (
                    <tr key={alert.issue_id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-medium text-slate-800">
                        <div>{alert.student_name}</div>
                        <div className="text-[10px] text-slate-400">{alert.department}</div>
                      </td>
                      <td className="py-2.5 text-slate-600 max-w-[140px] truncate" title={alert.book_title}>
                        {alert.book_title}
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                        {alert.due_date}
                      </td>
                      <td className="py-2.5 text-right font-medium text-rose-600">
                        {alert.overdue_days}d
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">
                        ₹{alert.estimated_fine}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to="/return"
                          className="inline-flex items-center text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 rounded font-medium transition-colors"
                        >
                          Return
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Issue Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Recent Book Issues</h2>
            <Link to="/reports" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              View all
            </Link>
          </div>

          {recentIssues.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-slate-400 text-xs">
              No recent issue transactions recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Issue ID</th>
                    <th className="pb-2">Borrower</th>
                    <th className="pb-2">Book Title</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentIssues.slice(0, 4).map((issue) => (
                    <tr key={issue.issue_id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-mono text-slate-400">#{issue.issue_id}</td>
                      <td className="py-2.5 font-medium text-slate-800">{issue.student_name}</td>
                      <td className="py-2.5 text-slate-600 max-w-[140px] truncate" title={issue.book_title}>
                        {issue.book_title}
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">{issue.due_date}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            issue.status === 'RETURNED'
                              ? 'bg-slate-100 text-slate-600'
                              : issue.is_overdue
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {issue.status === 'RETURNED' ? 'Returned' : issue.is_overdue ? 'Overdue' : 'Active'}
                        </span>
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
