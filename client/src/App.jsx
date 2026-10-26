import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Authors from './pages/Authors';
import Books from './pages/Books';
import IssueBooks from './pages/IssueBooks';
import ReturnBooks from './pages/ReturnBooks';
import Reports from './pages/Reports';
import DatabaseOverview from './pages/DatabaseOverview';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="authors" element={<Authors />} />
            <Route path="books" element={<Books />} />
            <Route path="issue" element={<IssueBooks />} />
            <Route path="return" element={<ReturnBooks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="database-overview" element={<DatabaseOverview />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
