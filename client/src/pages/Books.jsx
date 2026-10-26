import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Edit2, Trash2, 
  X, Check, AlertCircle, RefreshCw, Layers, ShieldCheck, Bookmark
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Books() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    author_id: '',
    category: 'Database Systems',
    publication_year: new Date().getFullYear(),
    total_copies: 3,
    available_copies: 3
  });
  const [submitting, setSubmitting] = useState(false);

  // Load books with current filters
  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getBooks({
        search,
        category: selectedCategory,
        author_id: selectedAuthor,
        availability: availabilityFilter
      });
      setBooks(res.data || []);
    } catch (err) {
      toast.error(err.message, 'Failed to Load Books');
    } finally {
      setLoading(false);
    }
  };

  // Load auxiliary data (authors & categories) for dropdowns
  const loadMeta = async () => {
    try {
      const [authorsRes, catRes] = await Promise.all([
        api.getAuthors(),
        api.getBookCategories()
      ]);
      setAuthors(authorsRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [search, selectedCategory, selectedAuthor, availabilityFilter]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      isbn: '',
      author_id: authors.length > 0 ? authors[0].author_id : '',
      category: categories.length > 0 ? categories[0] : 'Database Systems',
      publication_year: 2024,
      total_copies: 3,
      available_copies: 3
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      isbn: book.isbn,
      author_id: book.author_id,
      category: book.category,
      publication_year: book.publication_year || '',
      total_copies: book.total_copies,
      available_copies: book.available_copies
    });
    setFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBook) {
        await api.updateBook(editingBook.book_id, formData);
        toast.success(`Book "${formData.title}" updated successfully.`);
      } else {
        await api.createBook(formData);
        toast.success(`Book "${formData.title}" added to catalogue.`);
      }
      setFormModalOpen(false);
      loadBooks();
      loadMeta();
    } catch (err) {
      toast.error(err.message, editingBook ? 'Update Failed' : 'Add Book Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}" (ISBN: ${book.isbn})?\n\nNote: If this book has borrowing records in the Issue table, MySQL foreign key fk_issue_book will prevent deletion.`)) {
      return;
    }

    try {
      await api.deleteBook(book.book_id);
      toast.success(`Book #${book.book_id} deleted successfully.`);
      loadBooks();
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
            Book Catalogue & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Book entity linked to Author via foreign key with CHECK copy count validation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadBooks}
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
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search text */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ISBN, or author name..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Authors</option>
            {authors.map((a) => (
              <option key={a.author_id} value={a.author_id}>{a.author_name}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Availabilities</option>
            <option value="available">Available (Copies &gt; 0)</option>
            <option value="exhausted">Out of Stock (Copies = 0)</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && books.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            <span>Executing SQL JOIN Book & Author...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No books found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Book ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Author (Joined)</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Availability</th>
                  <th className="py-3 px-4 text-center">Copies (Avail/Total)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => {
                  const isAvailable = book.available_copies > 0;
                  return (
                    <tr key={book.book_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        #{book.book_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>ISBN: {book.isbn}</span>
                          {book.publication_year && <span>• Year: {book.publication_year}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {book.author_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Author #{book.author_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isAvailable ? 'Available' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        <span className={isAvailable ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                          {book.available_copies}
                        </span>
                        <span className="text-slate-400"> / {book.total_copies}</span>
                        {book.borrowed_copies > 0 && (
                          <div className="text-[10px] text-amber-600 font-sans">
                            ({book.borrowed_copies} on loan)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(book)}
                            title="Edit Book"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            title="Delete Book"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Book */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingBook ? `Edit Book #${editingBook.book_id}` : 'Add Book to Catalogue'}
                </h3>
                <p className="text-xs text-slate-400">
                  Target Table: <code className="text-teal-300 font-mono">Book</code> • Enforces FK & CHECK constraints
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
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Modern Database Architecture"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ISBN <span className="text-rose-500">* (UNIQUE)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-XXXXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Enforces <code className="font-mono text-teal-700">uk_book_isbn</code>
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Author <span className="text-rose-500">* (Foreign Key)</span>
                  </label>
                  <select
                    required
                    value={formData.author_id}
                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="">Select Author from MySQL</option>
                    {authors.map((a) => (
                      <option key={a.author_id} value={a.author_id}>
                        {a.author_name} ({a.nationality || 'Author'})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    References <code className="font-mono text-teal-700">Author(author_id)</code>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Database Systems, Algorithms"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2099"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Total Copies (Inventory)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.total_copies}
                    onChange={(e) => {
                      const tot = parseInt(e.target.value, 10) || 0;
                      setFormData({ 
                        ...formData, 
                        total_copies: tot,
                        available_copies: editingBook ? Math.min(formData.available_copies, tot) : tot
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    CHECK <code className="font-mono text-teal-700">total_copies &gt;= 0</code>
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Available Copies
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.total_copies}
                    required
                    value={formData.available_copies}
                    onChange={(e) => setFormData({ ...formData, available_copies: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    CHECK <code className="font-mono text-teal-700">0 &lt;= avail &lt;= total</code>
                  </span>
                </div>
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
                  <span>{editingBook ? 'Save Changes' : 'Add to Catalogue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
