import React, { useState, useEffect } from 'react';
import { 
  Feather, Plus, Search, Edit2, Trash2, BookOpen, 
  X, Check, AlertCircle, RefreshCw, Globe, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Authors() {
  const toast = useToast();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [booksModalOpen, setBooksModalOpen] = useState(false);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState(null);
  const [booksLoading, setBooksLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    author_name: '',
    nationality: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const res = await api.getAuthors(search);
      setAuthors(res.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingAuthor(null);
    setFormData({ author_name: '', nationality: '' });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      author_name: author.author_name,
      nationality: author.nationality || ''
    });
    setFormModalOpen(true);
  };

  const handleViewBooks = async (author) => {
    setBooksLoading(true);
    setBooksModalOpen(true);
    try {
      const res = await api.getAuthorBooks(author.author_id);
      setSelectedAuthorBooks(res.data);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Books for Author');
      setBooksModalOpen(false);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAuthor) {
        await api.updateAuthor(editingAuthor.author_id, formData);
        toast.success(`Author #${editingAuthor.author_id} updated successfully.`);
      } else {
        await api.createAuthor(formData);
        toast.success(`Author "${formData.author_name}" added successfully.`);
      }
      setFormModalOpen(false);
      loadAuthors();
    } catch (err) {
      toast.error(err.message, editingAuthor ? 'Update Failed' : 'Add Author Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (author) => {
    if (!window.confirm(`Are you sure you want to delete author "${author.author_name}" (ID #${author.author_id})?\n\nNote: If this author has books in the library, MySQL foreign key constraint fk_book_author will prevent deletion.`)) {
      return;
    }

    try {
      await api.deleteAuthor(author.author_id);
      toast.success(`Author #${author.author_id} deleted successfully.`);
      loadAuthors();
    } catch (err) {
      toast.error(err.message, 'Foreign Key Constraint Restriction');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Author Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Normalized 3NF Author entity referenced by the Book table
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAuthors}
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
            <Plus className="w-4 h-4" />
            <span>Add Author</span>
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
          placeholder="Search authors by name or nationality..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Authors Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && authors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            <span>Querying MySQL Author table...</span>
          </div>
        ) : authors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No authors found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Author ID</th>
                  <th className="py-3 px-4">Author Name</th>
                  <th className="py-3 px-4">Nationality</th>
                  <th className="py-3 px-4 text-center">Books in Catalogue</th>
                  <th className="py-3 px-4 text-center">Total Copies</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authors.map((author) => (
                  <tr key={author.author_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">
                      #{author.author_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {author.author_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{author.nationality || 'Unspecified'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewBooks(author)}
                        className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors"
                      >
                        <BookOpen className="w-3 h-3 text-teal-600" />
                        <span>{author.book_count} title(s)</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {author.total_copies_in_library} copies
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleViewBooks(author)}
                          title="View Authored Books"
                          className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(author)}
                          title="Edit Author"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(author)}
                          title="Delete Author"
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

      {/* Modal: Add / Edit Author */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingAuthor ? `Edit Author #${editingAuthor.author_id}` : 'Add New Author'}
                </h3>
                <p className="text-xs text-slate-400">
                  Target Table: <code className="text-teal-300 font-mono">Author</code> (InnoDB)
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
                  Author Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="e.g. Abraham Silberschatz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nationality / Origin
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="e.g. American, Indian, British"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

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
                  <span>{editingAuthor ? 'Save Changes' : 'Add Author'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Books by Author */}
      {booksModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Feather className="w-4 h-4 text-teal-400" />
                  <span>Books by {selectedAuthorBooks?.author?.author_name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Nationality: {selectedAuthorBooks?.author?.nationality || 'Unspecified'} • Relational 1:N Link
                </p>
              </div>
              <button
                onClick={() => setBooksModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {booksLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
                  <span>Retrieving authored books via fk_book_author...</span>
                </div>
              ) : !selectedAuthorBooks?.books || selectedAuthorBooks.books.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No books are currently catalogued under this author.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="pb-2">Book ID</th>
                        <th className="pb-2">Title</th>
                        <th className="pb-2">ISBN</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Available / Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAuthorBooks.books.map((book) => (
                        <tr key={book.book_id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono text-slate-500">#{book.book_id}</td>
                          <td className="py-2.5 font-semibold text-slate-900">{book.title}</td>
                          <td className="py-2.5 font-mono text-slate-600 text-[11px]">{book.isbn}</td>
                          <td className="py-2.5 text-slate-600">{book.category}</td>
                          <td className="py-2.5 text-center font-medium">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                book.available_copies > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {book.available_copies} / {book.total_copies}
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
                  onClick={() => setBooksModalOpen(false)}
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
