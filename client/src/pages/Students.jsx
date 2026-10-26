import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, History, 
  X, Check, AlertCircle, RefreshCw, Mail, Phone, Building, Calendar, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone: '',
    department: 'Computer Science & Engineering',
    registration_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  // Load students
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents(search);
      setStudents(res.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      student_name: '',
      email: '',
      phone: '',
      department: 'Computer Science & Engineering',
      registration_date: new Date().toISOString().split('T')[0]
    });
    setFormModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_name: student.student_name,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      registration_date: student.registration_date
    });
    setFormModalOpen(true);
  };

  // View borrowing history
  const handleViewHistory = async (student) => {
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    try {
      const res = await api.getStudentHistory(student.student_id);
      setSelectedHistory(res.data);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Borrowing History');
      setHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save student (Add / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.student_id, formData);
        toast.success(`Student #${editingStudent.student_id} updated successfully.`);
      } else {
        await api.createStudent(formData);
        toast.success(`Student "${formData.student_name}" registered successfully.`);
      }
      setFormModalOpen(false);
      loadStudents();
    } catch (err) {
      toast.error(err.message, editingStudent ? 'Update Failed' : 'Registration Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete student
  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete student "${student.student_name}" (ID #${student.student_id})?\n\nNote: If this student has borrowing records, MySQL foreign key constraint fk_issue_student will block deletion.`)) {
      return;
    }

    try {
      await api.deleteStudent(student.student_id);
      toast.success(`Student #${student.student_id} deleted successfully.`);
      loadStudents();
    } catch (err) {
      toast.error(err.message, 'Foreign Key Constraint Restriction');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student entity with primary keys, unique email constraint, and loan relationships
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name, email, department, or phone number..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            <span>Querying MySQL Student table...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email & Phone</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-center">Active Loans</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">
                      #{student.student_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.student_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200">
                        {student.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {student.registration_date}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          student.currently_borrowed > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {student.currently_borrowed} active / {student.total_borrowed} total
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleViewHistory(student)}
                          title="View Borrowing History"
                          className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          title="Delete Student"
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Student */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingStudent ? `Edit Student #${editingStudent.student_id}` : 'Register New Student'}
                </h3>
                <p className="text-xs text-slate-400">
                  Target Table: <code className="text-teal-300 font-mono">Student</code> (InnoDB)
                </p>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="e.g. Vikram Singhania"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">* (UNIQUE)</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. vikram.singhania@jaipur.manipal.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enforces relational UNIQUE constraint <code className="font-mono text-teal-700">uk_student_email</code>.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9829011111"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
              </div>

              {!editingStudent && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Defaults to MySQL <code className="font-mono text-teal-700">(CURRENT_DATE)</code>.
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingStudent ? 'Save Changes' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Borrowing History */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-400" />
                  <span>Borrowing History — {selectedHistory?.student?.student_name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Student ID #{selectedHistory?.student?.student_id} • {selectedHistory?.student?.department}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
                  <span>Loading borrowing history from Issue & BookReturn tables...</span>
                </div>
              ) : !selectedHistory?.history || selectedHistory.history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  This student has no borrowing records in the database.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="pb-2">Issue #</th>
                        <th className="pb-2">Book Title</th>
                        <th className="pb-2">Issued</th>
                        <th className="pb-2">Due Date</th>
                        <th className="pb-2">Returned</th>
                        <th className="pb-2 text-right">Fine</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHistory.history.map((record) => (
                        <tr key={record.issue_id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono text-slate-500">#{record.issue_id}</td>
                          <td className="py-2.5 font-medium text-slate-900 max-w-[160px] truncate" title={record.book_title}>
                            {record.book_title}
                          </td>
                          <td className="py-2.5 text-slate-600 font-mono text-[11px]">{record.issue_date}</td>
                          <td className="py-2.5 text-slate-600 font-mono text-[11px]">{record.due_date}</td>
                          <td className="py-2.5 text-slate-600 font-mono text-[11px]">
                            {record.return_date || <span className="text-amber-600 font-sans italic">Not yet</span>}
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-800">
                            {record.fine_amount ? `₹${parseFloat(record.fine_amount).toFixed(2)}` : '₹0.00'}
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                record.status === 'RETURNED'
                                  ? 'bg-slate-100 text-slate-600'
                                  : record.overdue_days > 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {record.status === 'RETURNED' ? 'Returned' : record.overdue_days > 0 ? 'Overdue' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
