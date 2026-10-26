import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp, Terminal, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function DatabaseStatusBanner() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getDatabaseStatus();
      setStatus(res);
    } catch (err) {
      setStatus({
        connected: false,
        error: err.message,
        details: err.data?.details || {}
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Periodic status check
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return null;
  }

  // 1. MySQL 8.0 Primary Connected
  if (status?.connected && !status?.isRelationalFallback) {
    return (
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between no-print">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-emerald-200">MySQL Database Online:</span>
          <span>{status.databaseName || 'library_management_system'}</span>
          <span className="text-emerald-400/60">•</span>
          <span className="text-emerald-300/80">{status.user}@{status.host}:{status.port}</span>
          <span className="text-emerald-400/60">•</span>
          <span className="text-emerald-300/80">MySQL v{status.serverVersion?.split('-')[0]}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden md:inline text-emerald-400/90 font-mono text-[11px]">
            Students: {status.tables?.Student} | Books: {status.tables?.Book} | Loans: {status.tables?.Issue}
          </span>
          <button
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh database connection status"
            className="hover:text-emerald-100 transition-colors p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Relational Demo Mode Active (SQLite WebAssembly fallback with full relational schema)
  if (status?.connected && status?.isRelationalFallback) {
    return (
      <div className="bg-navy-950 border-b border-teal-800/40 text-slate-200 px-4 py-2.5 text-xs shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Relational SQL Engine Active
              </span>
              <span className="text-[10px] bg-teal-900/80 text-teal-200 px-2 py-0.5 rounded border border-teal-700/60 font-mono">
                SQLite 3 (Embedded Fallback)
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                All 5 tables, foreign keys, CHECK constraints, and sample data fully operational
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-auto text-xs">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-teal-300 hover:text-teal-200 bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded border border-teal-700/40 flex items-center gap-1 transition-colors"
            >
              <span>{expanded ? 'Hide MySQL Switch Guide' : 'Connect MySQL 8.0'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              onClick={fetchStatus}
              disabled={loading}
              title="Check for active MySQL server"
              className="text-[11px] bg-teal-600 hover:bg-teal-500 text-white font-medium px-2.5 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Detect MySQL</span>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-teal-900 text-teal-300 flex items-center justify-center text-[10px]">1</span>
                <span>Start MySQL Service</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Start MySQL via XAMPP Control Panel or run <code className="text-teal-300 font-mono">net start mysql</code>.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-teal-900 text-teal-300 flex items-center justify-center text-[10px]">2</span>
                <span>Verify Credentials in .env</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Ensure <code className="text-teal-300 font-mono">DB_USER</code> and <code className="text-teal-300 font-mono">DB_PASSWORD</code> match your local root password.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-teal-900 text-teal-300 flex items-center justify-center text-[10px]">3</span>
                <span>Initialize Schema</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Run <code className="text-teal-300 font-mono">npm run db:init</code> then click <strong>Detect MySQL</strong> above.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Complete Disconnect (neither MySQL nor SQLite)
  return (
    <div className="bg-amber-950 border-b border-amber-600/50 text-amber-200 px-4 py-2.5 text-xs shadow-md no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">Database Offline: {status?.error}</span>
        </div>
        <button
          onClick={fetchStatus}
          className="bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded text-xs"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
