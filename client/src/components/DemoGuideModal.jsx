import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, Compass, ChevronRight, X, ExternalLink, 
  HelpCircle, Sparkles, BookOpen, Database, ShieldAlert, Award
} from 'lucide-react';

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Dashboard & Live Aggregate Statistics',
    route: '/',
    action: 'Open Dashboard and explain the 8 live KPI cards.',
    vivaTip: 'Point out that each counter (total copies, available copies, overdue loans, recorded fines) comes directly from real SQL COUNT/SUM queries, not hardcoded numbers.',
    tag: 'SQL Aggregation'
  },
  {
    step: 2,
    title: 'Add a Fictional Author',
    route: '/authors',
    action: 'Click "+ Add Author" and enter e.g. "Dr. Rajeev Bansal", Nationality: "Indian".',
    vivaTip: 'Explain that the Author entity is in Third Normal Form (3NF) to prevent repeating author details in every book row.',
    tag: 'Normalization'
  },
  {
    step: 3,
    title: 'Add a Book for that Author',
    route: '/books',
    action: 'Click "+ Add Book", pick the newly created author from the dropdown, enter Title, unique ISBN, Category, Total Copies: 3.',
    vivaTip: 'Explain the Foreign Key relationship `fk_book_author` and the CHECK constraint ensuring `available_copies <= total_copies`.',
    tag: 'Foreign Key & CHECK'
  },
  {
    step: 4,
    title: 'Register a Fictional Student',
    route: '/students',
    action: 'Click "+ Register Student" and register e.g. "Vikram Singhania", Department: "CSE".',
    vivaTip: 'Highlight the UNIQUE constraint on email (`uk_student_email`) and default registration date (`CURRENT_DATE`).',
    tag: 'UNIQUE Constraint'
  },
  {
    step: 5,
    title: 'Search & Filter Catalogue',
    route: '/books',
    action: 'Use the live search bar to search for "Database" or filter by category "Algorithms".',
    vivaTip: 'Explain the SQL `LIKE` operator with wildcard `%term%` and composite WHERE filtering.',
    tag: 'Relational Search'
  },
  {
    step: 6,
    title: 'Issue a Book (ACID Transaction)',
    route: '/issue',
    action: 'Select the registered student and book. Click "Issue Book".',
    vivaTip: 'Explain that issuing executes an atomic transaction with `SELECT ... FOR UPDATE` locking to prevent race conditions, and decrements `available_copies`.',
    tag: 'ACID Transaction'
  },
  {
    step: 7,
    title: 'Inspect Active Issues Report',
    route: '/reports?tab=active',
    action: 'View the active loan entry with student name, book title, and due date.',
    vivaTip: 'Explain the 3-table relational INNER JOIN connecting Issue, Student, and Book tables.',
    tag: 'Relational JOIN'
  },
  {
    step: 8,
    title: 'Return the Book & Restore Availability',
    route: '/return',
    action: 'Find the active issue, click "Process Return", review the fine preview, and confirm.',
    vivaTip: 'Demonstrate how the transaction marks the issue as RETURNED, inserts a single BookReturn record, and increments available copies by 1.',
    tag: 'Transaction & 1:0..1'
  },
  {
    step: 9,
    title: 'Demonstrate Overdue Loan & Fine Computation',
    route: '/reports?tab=overdue',
    action: 'Inspect the pre-seeded overdue loans (e.g., Rohan Verma or Priya Nair) and click "Return Book".',
    vivaTip: 'Show how `DATEDIFF(CURRENT_DATE, due_date) * Rs. 5` automatically calculates the illustrative overdue penalty.',
    tag: 'Date Functions'
  },
  {
    step: 10,
    title: 'Database Overview & ER Diagram',
    route: '/database-overview',
    action: 'Open the Database Overview tab and show the 5 tables, column data types, and ER relationships.',
    vivaTip: 'Explain cardinalities: Author 1:N Book, Student 1:N Issue, Book 1:N Issue, Issue 1:0..1 Return.',
    tag: 'ER Modeling'
  },
  {
    step: 11,
    title: 'Test Duplicate Constraint Violation',
    route: '/students',
    action: 'Try to register a student with an already existing email (e.g. `aarav.sharma@jaipur.manipal.edu`).',
    vivaTip: 'Show the clean database error dialog explaining MySQL `ER_DUP_ENTRY` unique key constraint enforcement.',
    tag: 'Integrity Enforcement'
  },
  {
    step: 12,
    title: 'Test Foreign Key Deletion Restriction',
    route: '/authors',
    action: 'Attempt to delete "Abraham Silberschatz" who has books catalogued in the library.',
    vivaTip: 'Show that the database rejects deletion under `ON DELETE RESTRICT`, preventing orphan records.',
    tag: 'Referential Integrity'
  }
];

export default function DemoGuideModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  const toggleStep = (stepNum) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / DEMO_STEPS.length) * 100);

  const handleJump = (route) => {
    navigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>RDBMS Lab Evaluation — Guided Demonstration Walkthrough</span>
                <span className="text-xs bg-teal-900/80 text-teal-300 px-2 py-0.5 rounded border border-teal-700/60 font-medium">
                  Manipal University Jaipur
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                12-step sequence to demonstrate database design, integrity constraints, transactions, and SQL queries to your examiner.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-medium text-slate-300">
              Demonstration Progress: {completedCount} of {DEMO_STEPS.length} Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-900/60">
          {DEMO_STEPS.map((s) => {
            const isDone = !!completedSteps[s.step];
            return (
              <div
                key={s.step}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-800/40 opacity-90'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => toggleStep(s.step)}
                      className="mt-0.5 text-slate-400 hover:text-teal-400 transition-colors"
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-teal-400">
                          Step {s.step}
                        </span>
                        <h3 className={`font-semibold text-sm ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                          {s.title}
                        </h3>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {s.tag}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                        <div>
                          <strong className="text-teal-300">Action: </strong>
                          <span>{s.action}</span>
                        </div>
                        <div className="text-amber-200/90 bg-amber-950/30 p-2 rounded border border-amber-900/40">
                          <strong className="text-amber-300 flex items-center gap-1 inline-flex">
                            <Sparkles className="w-3.5 h-3.5" /> What to Explain to Examiner:
                          </strong>
                          <span className="ml-1 text-[11px]">{s.vivaTip}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJump(s.route)}
                    className="flex-shrink-0 text-xs bg-teal-600 hover:bg-teal-500 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Jump</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Manipal University Jaipur — Department of Computer Science & Engineering</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
