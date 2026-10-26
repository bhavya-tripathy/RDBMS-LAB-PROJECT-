import React, { useState, useEffect } from 'react';
import { 
  Database, Play, Code, CheckCircle, ShieldCheck, 
  Layers, Key, Link2, Sparkles, RefreshCw, Terminal, 
  HelpCircle, BookOpen, AlertCircle, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function DatabaseOverview() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('er'); // 'er', 'schema', 'viva', 'queries'
  const [status, setStatus] = useState(null);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // SQL Demo state
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(1);
  const [queryResult, setQueryResult] = useState(null);
  const [queryExecuting, setQueryExecuting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, queriesRes] = await Promise.all([
        api.getDatabaseStatus(),
        api.getDemoQueriesList()
      ]);
      setStatus(statusRes);
      setQueriesList(queriesRes.data || []);
      
      // Auto-run Query 1
      runQuery(1);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Database Telemetry');
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const res = await api.getDatabaseSchemaInfo();
      setSchemaInfo(res);
    } catch (err) {
      console.error('Failed to load schema dictionary:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadSchema();
  }, []);

  const runQuery = async (id) => {
    setSelectedQueryId(id);
    setQueryExecuting(true);
    try {
      const res = await api.getDemoQuery(id);
      setQueryResult(res);
    } catch (err) {
      toast.error(err.message, 'Query Execution Failed');
    } finally {
      setQueryExecuting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-teal-600" />
            <span>Database Architecture & RDBMS Viva Reference</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Five-table relational model, entity-relationship cardinality, constraints, normalization, and live SQL demonstration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-navy-900 text-teal-300 px-3 py-1.5 rounded-lg font-mono border border-teal-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>MySQL 8.0 • InnoDB Engine</span>
          </span>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('er')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'er'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Entity-Relationship Diagram</span>
        </button>

        <button
          onClick={() => setActiveSection('schema')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'schema'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4 text-teal-400" />
          <span>Five Core Tables Dictionary</span>
        </button>

        <button
          onClick={() => setActiveSection('viva')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'viva'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>RDBMS Viva Concepts & Normalization</span>
        </button>

        <button
          onClick={() => setActiveSection('queries')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSection === 'queries'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>Interactive SQL Query Runner</span>
        </button>
      </div>

      {/* SECTION 1: INTERACTIVE ER DIAGRAM */}
      {activeSection === 'er' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Entity-Relationship Visual Architecture</h2>
                <p className="text-xs text-slate-500">Visual mapping of the five tables and their relational cardinalities</p>
              </div>
              <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded border border-teal-200 font-mono">
                Relational Model: 3NF
              </span>
            </div>

            {/* Visual ER Block Model */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-200 space-y-8">
              
              {/* Row 1: Author -> Book */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Author Card */}
                <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-purple-500/40 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-purple-300 text-sm">Author</span>
                    <span className="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded font-mono">Entity (1)</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <div className="text-amber-400 flex items-center gap-1 font-bold">
                      <Key className="w-3 h-3 text-amber-400" /> author_id [PK] INT AI
                    </div>
                    <div>author_name VARCHAR(100) NOT NULL</div>
                    <div className="text-slate-500">nationality VARCHAR(100)</div>
                  </div>
                </div>

                {/* Relationship connector 1:N */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2">
                  <div className="text-[11px] font-mono font-bold text-teal-400 bg-slate-900 px-3 py-1 rounded-full border border-teal-500/40">
                    1 : N (One Author writes Many Books)
                  </div>
                  <div className="w-full flex items-center justify-center my-1.5">
                    <div className="h-0.5 bg-gradient-to-r from-purple-500 via-teal-500 to-sky-500 w-full"></div>
                    <ArrowRight className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">FK: fk_book_author ON DELETE RESTRICT</span>
                </div>

                {/* Book Card */}
                <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-sky-500/40 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-sky-300 text-sm">Book</span>
                    <span className="text-[10px] bg-sky-950 text-sky-400 px-1.5 py-0.5 rounded font-mono">Entity (N)</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <div className="text-amber-400 flex items-center gap-1 font-bold">
                      <Key className="w-3 h-3 text-amber-400" /> book_id [PK] INT AI
                    </div>
                    <div className="text-purple-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-purple-400" /> author_id [FK → Author]
                    </div>
                    <div>title VARCHAR(200) NOT NULL</div>
                    <div className="text-teal-300">isbn VARCHAR(20) [UNIQUE]</div>
                    <div>category VARCHAR(100) NOT NULL</div>
                    <div>total_copies INT [CHK &gt;= 0]</div>
                    <div>available_copies INT [CHK &lt;= total]</div>
                  </div>
                </div>

              </div>

              {/* Row 2: Student & Book -> Issue */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4 border-t border-slate-800/80">
                
                {/* Student Card */}
                <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-blue-500/40 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-blue-300 text-sm">Student</span>
                    <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-mono">Entity (1)</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <div className="text-amber-400 flex items-center gap-1 font-bold">
                      <Key className="w-3 h-3 text-amber-400" /> student_id [PK] INT AI
                    </div>
                    <div>student_name VARCHAR(100) NOT NULL</div>
                    <div className="text-teal-300">email VARCHAR(150) [UNIQUE]</div>
                    <div>department VARCHAR(100) NOT NULL</div>
                    <div className="text-slate-500">registration_date DATE DEFAULT CURRENT_DATE</div>
                  </div>
                </div>

                {/* Composite Connection to Issue */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2">
                  <div className="text-[11px] font-mono font-bold text-teal-400 bg-slate-900 px-3 py-1 rounded-full border border-teal-500/40">
                    Composite M:N via Issue Entity
                  </div>
                  <div className="w-full flex items-center justify-center my-1.5">
                    <div className="h-0.5 bg-gradient-to-r from-blue-500 via-teal-500 to-amber-500 w-full"></div>
                    <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Student (1:N) & Book (1:N)</span>
                </div>

                {/* Issue Card */}
                <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-amber-500/40 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-300 text-sm">Issue</span>
                    <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded font-mono">Transaction Entity</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <div className="text-amber-400 flex items-center gap-1 font-bold">
                      <Key className="w-3 h-3 text-amber-400" /> issue_id [PK] INT AI
                    </div>
                    <div className="text-blue-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-blue-400" /> student_id [FK → Student]
                    </div>
                    <div className="text-sky-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-sky-400" /> book_id [FK → Book]
                    </div>
                    <div>issue_date DATE DEFAULT CURRENT_DATE</div>
                    <div>due_date DATE [CHK &gt;= issue_date]</div>
                    <div className="text-amber-300">status ENUM('ISSUED', 'RETURNED')</div>
                  </div>
                </div>

              </div>

              {/* Row 3: Issue -> Return */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4 border-t border-slate-800/80">
                <div className="md:col-span-4"></div>

                <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2">
                  <div className="text-[11px] font-mono font-bold text-teal-400 bg-slate-900 px-3 py-1 rounded-full border border-teal-500/40">
                    1 : 0..1 (Optional Return Record)
                  </div>
                  <div className="w-full flex items-center justify-center my-1.5">
                    <div className="h-0.5 bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 w-full"></div>
                    <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">UNIQUE FK issue_id prevents duplicate returns</span>
                </div>

                {/* Return Card */}
                <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-emerald-500/40 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-emerald-300 text-sm">BookReturn (Entity: Return)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">1:0..1</span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <div className="text-amber-400 flex items-center gap-1 font-bold">
                      <Key className="w-3 h-3 text-amber-400" /> return_id [PK] INT AI
                    </div>
                    <div className="text-amber-300 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-amber-300" /> issue_id [FK UNIQUE → Issue]
                    </div>
                    <div>return_date DATE DEFAULT CURRENT_DATE</div>
                    <div>fine_amount DECIMAL(10,2) [CHK &gt;= 0]</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Cardinality Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Parent Table</th>
                    <th className="py-2.5 px-3">Child Table</th>
                    <th className="py-2.5 px-3">Cardinality</th>
                    <th className="py-2.5 px-3">Foreign Key Column</th>
                    <th className="py-2.5 px-3">Relational Integrity Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Author</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Book</td>
                    <td className="py-2.5 px-3 font-mono text-teal-700">1 to Many (1 : N)</td>
                    <td className="py-2.5 px-3 font-mono">Book.author_id → Author.author_id</td>
                    <td className="py-2.5 px-3 text-slate-600">ON DELETE RESTRICT (Prevents orphan books)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Student</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Issue</td>
                    <td className="py-2.5 px-3 font-mono text-teal-700">1 to Many (1 : N)</td>
                    <td className="py-2.5 px-3 font-mono">Issue.student_id → Student.student_id</td>
                    <td className="py-2.5 px-3 text-slate-600">ON DELETE RESTRICT (Preserves borrowing history)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Book</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Issue</td>
                    <td className="py-2.5 px-3 font-mono text-teal-700">1 to Many (1 : N)</td>
                    <td className="py-2.5 px-3 font-mono">Issue.book_id → Book.book_id</td>
                    <td className="py-2.5 px-3 text-slate-600">ON DELETE RESTRICT (Preserves circulation records)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Issue</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">BookReturn</td>
                    <td className="py-2.5 px-3 font-mono text-teal-700">1 to Zero-or-One (1 : 0..1)</td>
                    <td className="py-2.5 px-3 font-mono">BookReturn.issue_id → Issue.issue_id</td>
                    <td className="py-2.5 px-3 text-slate-600">UNIQUE constraint ensures single return event per issue</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: FIVE TABLES DATA DICTIONARY */}
      {activeSection === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Database Schema Dictionary (information_schema)</h2>
              <p className="text-xs text-slate-500">Live column data types, constraints, and keys queried directly from MySQL</p>
            </div>

            {['Student', 'Author', 'Book', 'Issue', 'BookReturn'].map((tbl) => {
              const tableCols = schemaInfo?.columns?.filter((c) => c.TABLE_NAME === tbl) || [];
              const tableCons = schemaInfo?.constraints?.filter((c) => c.TABLE_NAME === tbl) || [];

              return (
                <div key={tbl} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm font-mono text-teal-400">{tbl}</span>
                      <span className="text-[11px] text-slate-400">
                        ({tableCols.length} columns)
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      InnoDB
                    </span>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Column Name</th>
                          <th className="py-2 px-3">Data Type</th>
                          <th className="py-2 px-3 text-center">Nullable</th>
                          <th className="py-2 px-3">Key</th>
                          <th className="py-2 px-3">Default Value</th>
                          <th className="py-2 px-3">Extra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {tableCols.map((col) => (
                          <tr key={col.COLUMN_NAME} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-400">{col.ORDINAL_POSITION}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{col.COLUMN_NAME}</td>
                            <td className="py-2 px-3 text-teal-700">{col.COLUMN_TYPE}</td>
                            <td className="py-2 px-3 text-center">
                              {col.IS_NULLABLE === 'NO' ? (
                                <span className="text-rose-600 font-bold">NOT NULL</span>
                              ) : (
                                <span className="text-slate-400">NULL</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {col.COLUMN_KEY === 'PRI' && <span className="text-amber-600 font-bold">PRIMARY KEY</span>}
                              {col.COLUMN_KEY === 'UNI' && <span className="text-teal-600 font-bold">UNIQUE</span>}
                              {col.COLUMN_KEY === 'MUL' && <span className="text-purple-600 font-bold">FOREIGN KEY / INDEX</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{col.COLUMN_DEFAULT || '—'}</td>
                            <td className="py-2 px-3 text-slate-500">{col.EXTRA || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: RDBMS VIVA CONCEPTS & NORMALIZATION */}
      {activeSection === 'viva' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Key RDBMS Concepts for Viva Preparation</h2>
              <p className="text-xs text-slate-500">Concise academic explanations mapped to the Library Management System implementation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <Key className="w-4 h-4 text-teal-600" />
                  <span>1. Primary Key (PK)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  A unique identifier for each tuple (row) in a relation. It enforces entity integrity and cannot contain <code className="text-rose-600 font-mono">NULL</code> values. In our schema: <code className="font-mono text-teal-700">student_id</code>, <code className="font-mono text-teal-700">book_id</code>, etc. are surrogate auto-increment primary keys.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <Link2 className="w-4 h-4 text-teal-600" />
                  <span>2. Foreign Key (FK) & Referential Integrity</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  A column that references the primary key of another table, ensuring referential integrity. <code className="font-mono text-teal-700">Issue(book_id)</code> references <code className="font-mono text-teal-700">Book(book_id)</code> with <code className="font-mono text-rose-700">ON DELETE RESTRICT</code>, which prevents deleting books that have loan history.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>3. UNIQUE Constraint</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Guarantees that all values in a column are distinct across the table. We apply <code className="font-mono text-teal-700">uk_student_email</code> to ensure no two students share an email address, and <code className="font-mono text-teal-700">uk_book_isbn</code> to prevent duplicate ISBN registration.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span>4. CHECK Constraint</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Enforces domain integrity at the database layer. In our schema: <code className="font-mono text-teal-700">chk_available_copies_valid (available_copies &gt;= 0 AND available_copies &lt;= total_copies)</code> and <code className="font-mono text-teal-700">chk_issue_due_date (due_date &gt;= issue_date)</code> prevent illegal states directly in MySQL.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>5. Relational JOINs</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Merges tuples from two or more relations based on related keys. <code className="font-mono text-teal-700">INNER JOIN</code> matches records where keys exist in both tables. <code className="font-mono text-teal-700">LEFT OUTER JOIN</code> (used in borrowing history and circulation) retains all parent rows even if no return record exists yet.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-teal-800">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>6. ACID Transactions & Row Locking</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Transactions maintain <strong>Atomicity, Consistency, Isolation, and Durability</strong>. During book issuing: <code className="font-mono text-teal-700">START TRANSACTION</code>, <code className="font-mono text-teal-700">SELECT ... FOR UPDATE</code> (locks book row), decrements copy count, inserts Issue, and runs <code className="font-mono text-teal-700">COMMIT</code>. If any step fails, <code className="font-mono text-rose-700">ROLLBACK</code> restores the database.
                </p>
              </div>

            </div>

            {/* Normalization Walkthrough */}
            <div className="bg-navy-950 text-white p-5 rounded-xl border border-navy-800 space-y-3">
              <h3 className="text-sm font-bold text-teal-300">
                Database Normalization: From 1NF to 3NF
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Why separate into 5 tables instead of a single flat spreadsheet?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-teal-400 block mb-1">First Normal Form (1NF)</span>
                  <span className="text-slate-400 text-[11px] leading-relaxed">
                    Eliminates repeating groups and ensures every attribute is atomic (e.g. single student per row, single book per loan).
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-teal-400 block mb-1">Second Normal Form (2NF)</span>
                  <span className="text-slate-400 text-[11px] leading-relaxed">
                    Eliminates partial functional dependencies. Non-key attributes depend on the entire primary key, not part of a composite key.
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-teal-400 block mb-1">Third Normal Form (3NF)</span>
                  <span className="text-slate-400 text-[11px] leading-relaxed">
                    Eliminates transitive dependencies. Author details are moved to the Author table so author nationality does not depend on book_id.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 4: INTERACTIVE SQL QUERY RUNNER */}
      {activeSection === 'queries' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Interactive SQL Demonstration Panel</h2>
              <p className="text-xs text-slate-500">
                Execute curated, read-only queries against live MySQL tables to demonstrate SQL syntax and results during evaluation
              </p>
            </div>

            {/* Query Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {queriesList.map((q) => (
                <button
                  key={q.id}
                  onClick={() => runQuery(q.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs ${
                    selectedQueryId === q.id
                      ? 'bg-teal-50 border-teal-500 text-teal-950 font-semibold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{q.title}</span>
                    {selectedQueryId === q.id && <Play className="w-3 h-3 text-teal-600 fill-teal-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{q.concept}</div>
                </button>
              ))}
            </div>

            {/* Display Selected Query & Live Results */}
            {queryResult && (
              <div className="space-y-4 pt-2">
                {/* Query Concept & Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{queryResult.title}</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-semibold font-mono">
                      {queryResult.concept}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{queryResult.description}</p>
                  <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 font-medium">
                    <strong>Viva Explanation: </strong>
                    <span>{queryResult.explanation}</span>
                  </div>
                </div>

                {/* SQL Code Block */}
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                  <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-teal-400 font-semibold">SQL Statement</span>
                    <button
                      onClick={() => runQuery(selectedQueryId)}
                      disabled={queryExecuting}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{queryExecuting ? 'Running...' : 'Re-Execute'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed">
                    {queryResult.sql}
                  </pre>
                </div>

                {/* Tabular Output */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Query Execution Results ({queryResult.rowCount} rows returned)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Latency: {queryResult.executionTimeMs}ms
                    </span>
                  </div>

                  {queryResult.rows && queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] font-mono">
                          <tr>
                            {Object.keys(queryResult.rows[0]).map((key) => (
                              <th key={key} className="py-2.5 px-3 whitespace-nowrap">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {queryResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {Object.values(row).map((val, cellIdx) => (
                                <td key={cellIdx} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-400 italic">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Zero rows returned by this query.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
