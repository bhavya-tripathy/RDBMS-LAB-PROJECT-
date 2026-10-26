import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Feather, BookOpen, 
  ArrowUpRight, ArrowDownLeft, BarChart3, Database,
  Compass, School, X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Authors', path: '/authors', icon: Feather },
  { name: 'Books', path: '/books', icon: BookOpen },
  { name: 'Issue Books', path: '/issue', icon: ArrowUpRight },
  { name: 'Return Books', path: '/return', icon: ArrowDownLeft },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Database Overview', path: '/database-overview', icon: Database, badge: 'Viva' },
];

export default function Sidebar({ isOpen, onClose, onOpenDemoGuide }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
                Library Management
              </h1>
              <span className="text-[11px] text-teal-400 font-medium">
                System • RDBMS Lab
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution Badge */}
        <div className="px-5 py-3 bg-navy-900/60 border-b border-slate-800/60 flex items-center space-x-2 text-[11px] text-slate-400">
          <School className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="truncate">Manipal University Jaipur</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Demo Guide Action */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
              onOpenDemoGuide();
            }}
            className="w-full bg-gradient-to-r from-teal-700 to-navy-700 hover:from-teal-600 hover:to-navy-600 text-white p-3 rounded-xl border border-teal-500/30 text-xs font-medium flex items-center justify-between transition-all group shadow-md"
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-teal-300 group-hover:rotate-45 transition-transform" />
              <div className="text-left">
                <div className="font-semibold text-white">Lab Demo Guide</div>
                <div className="text-[10px] text-teal-200">12 Viva Steps</div>
              </div>
            </div>
            <span className="text-[11px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded">
              Start
            </span>
          </button>
        </div>

        {/* User / Lab info */}
        <div className="px-4 py-3 bg-navy-950 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="font-medium text-slate-300">RDBMS End-Term Demo</div>
          <div className="text-[10px] text-slate-400">Dept. of Computer Science & Engg.</div>
        </div>
      </aside>
    </>
  );
}
