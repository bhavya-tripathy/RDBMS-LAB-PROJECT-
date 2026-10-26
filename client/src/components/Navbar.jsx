import React from 'react';
import { Menu, Compass, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({ onOpenSidebar, onOpenDemoGuide, title }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {title || 'Dashboard'}
          </h2>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Relational Database Management System • Lab Demo
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenDemoGuide}
          className="bg-navy-900 hover:bg-navy-800 text-teal-300 border border-teal-500/40 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Compass className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">Lab Demo Guide</span>
          <span className="sm:hidden">Guide</span>
        </button>
      </div>
    </header>
  );
}
