/**
 * Central API Client for Library Management System
 */

const API_BASE = '/api';

async function handleResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    error.errorType = data?.errorType;
    throw error;
  }

  return data;
}

export const api = {
  // Health & Database
  checkHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),
  getDatabaseStatus: () => fetch(`${API_BASE}/database/status`).then(handleResponse),
  getDatabaseSchemaInfo: () => fetch(`${API_BASE}/database/schema-info`).then(handleResponse),
  getDemoQueriesList: () => fetch(`${API_BASE}/database/queries`).then(handleResponse),
  getDemoQuery: (id) => fetch(`${API_BASE}/database/query-demo/${id}`).then(handleResponse),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`).then(handleResponse),
  getRecentIssues: () => fetch(`${API_BASE}/dashboard/recent-issues`).then(handleResponse),
  getRecentReturns: () => fetch(`${API_BASE}/dashboard/recent-returns`).then(handleResponse),
  getCategoryStats: () => fetch(`${API_BASE}/dashboard/category-stats`).then(handleResponse),
  getOverdueAlerts: () => fetch(`${API_BASE}/dashboard/overdue-alerts`).then(handleResponse),

  // Students
  getStudents: (q = '') => fetch(`${API_BASE}/students${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(handleResponse),
  getStudent: (id) => fetch(`${API_BASE}/students/${id}`).then(handleResponse),
  getStudentHistory: (id) => fetch(`${API_BASE}/students/${id}/history`).then(handleResponse),
  createStudent: (payload) => fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  updateStudent: (id, payload) => fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  deleteStudent: (id) => fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Authors
  getAuthors: (q = '') => fetch(`${API_BASE}/authors${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(handleResponse),
  getAuthor: (id) => fetch(`${API_BASE}/authors/${id}`).then(handleResponse),
  getAuthorBooks: (id) => fetch(`${API_BASE}/authors/${id}/books`).then(handleResponse),
  createAuthor: (payload) => fetch(`${API_BASE}/authors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  updateAuthor: (id, payload) => fetch(`${API_BASE}/authors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  deleteAuthor: (id) => fetch(`${API_BASE}/authors/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Books
  getBooks: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.author_id) searchParams.append('author_id', params.author_id);
    if (params.availability) searchParams.append('availability', params.availability);
    const queryString = searchParams.toString();
    return fetch(`${API_BASE}/books${queryString ? `?${queryString}` : ''}`).then(handleResponse);
  },
  getBook: (id) => fetch(`${API_BASE}/books/${id}`).then(handleResponse),
  getBookCategories: () => fetch(`${API_BASE}/books/categories`).then(handleResponse),
  createBook: (payload) => fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  updateBook: (id, payload) => fetch(`${API_BASE}/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  deleteBook: (id) => fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Issues
  getIssues: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.overdue) searchParams.append('overdue', params.overdue);
    const queryString = searchParams.toString();
    return fetch(`${API_BASE}/issues${queryString ? `?${queryString}` : ''}`).then(handleResponse);
  },
  getActiveIssues: (search = '') => fetch(`${API_BASE}/issues/active${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(handleResponse),
  issueBook: (payload) => fetch(`${API_BASE}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),

  // Returns
  getReturns: (search = '') => fetch(`${API_BASE}/returns${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(handleResponse),
  calculateReturn: (payload) => fetch(`${API_BASE}/returns/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  processReturn: (payload) => fetch(`${API_BASE}/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),

  // Reports
  getReportCatalogue: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/reports/catalogue${q ? `?${q}` : ''}`).then(handleResponse);
  },
  getReportActiveIssues: () => fetch(`${API_BASE}/reports/active-issues`).then(handleResponse),
  getReportOverdue: () => fetch(`${API_BASE}/reports/overdue`).then(handleResponse),
  getReportStudentHistory: (studentId = '') => fetch(`${API_BASE}/reports/student-history${studentId ? `?student_id=${studentId}` : ''}`).then(handleResponse),
  getReportCirculation: () => fetch(`${API_BASE}/reports/circulation`).then(handleResponse),
  getReportFines: () => fetch(`${API_BASE}/reports/fines`).then(handleResponse),
};
