import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DatabaseStatusBanner from './DatabaseStatusBanner';
import DemoGuideModal from './DemoGuideModal';

const PAGE_TITLES = {
  '/': 'Dashboard Overview',
  '/students': 'Student Registration & Records',
  '/authors': 'Author Management',
  '/books': 'Book Catalogue & Inventory',
  '/issue': 'Issue Books (ACID Transaction)',
  '/return': 'Return Books & Fine Management',
  '/reports': 'Relational Reports & SQL Queries',
  '/database-overview': 'Database Overview & ER Diagram',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Library Management System';

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Real-time DB Status Bar */}
      <DatabaseStatusBanner />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onOpenDemoGuide={() => setDemoGuideOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Navbar 
            title={title} 
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenDemoGuide={() => setDemoGuideOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Demo Guide Modal */}
      <DemoGuideModal
        isOpen={demoGuideOpen}
        onClose={() => setDemoGuideOpen(false)}
      />
    </div>
  );
}
