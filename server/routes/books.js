const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

/**
 * GET /api/books/categories
 * Distinct categories for filtering
 */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM Book ORDER BY category ASC');
    res.json({ success: true, data: rows.map(r => r.category) });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/books
 * List books with joined author information and filters
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, author_id, availability } = req.query;

    let query = `
      SELECT 
        b.book_id,
        b.title,
        b.isbn,
        b.category,
        b.publication_year,
        b.total_copies,
        b.available_copies,
        (b.total_copies - b.available_copies) AS borrowed_copies,
        a.author_id,
        a.author_name,
        a.nationality AS author_nationality
      FROM Book b
      JOIN Author a ON b.author_id = a.author_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (b.title LIKE ? OR b.isbn LIKE ? OR a.author_name LIKE ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category.trim()) {
      query += ` AND b.category = ? `;
      params.push(category.trim());
    }

    if (author_id) {
      query += ` AND b.author_id = ? `;
      params.push(author_id);
    }

    if (availability === 'available') {
      query += ` AND b.available_copies > 0 `;
    } else if (availability === 'exhausted') {
      query += ` AND b.available_copies = 0 `;
    }

    query += ` ORDER BY b.title ASC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/books/:id
 * Single book details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        b.book_id,
        b.title,
        b.isbn,
        b.category,
        b.publication_year,
        b.total_copies,
        b.available_copies,
        a.author_id,
        a.author_name,
        a.nationality AS author_nationality
      FROM Book b
      JOIN Author a ON b.author_id = a.author_id
      WHERE b.book_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/books
 * Add a new book to catalogue
 */
router.post('/', async (req, res) => {
  try {
    const { author_id, title, isbn, category, publication_year, total_copies, available_copies } = req.body;

    // Required fields validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Book title is required.' });
    }
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ success: false, message: 'ISBN is required.' });
    }
    if (!author_id) {
      return res.status(400).json({ success: false, message: 'Please select an author.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const total = parseInt(total_copies !== undefined ? total_copies : '1', 10);
    const available = parseInt(available_copies !== undefined ? available_copies : total, 10);

    if (isNaN(total) || total < 0) {
      return res.status(400).json({ success: false, message: 'Total copies must be a non-negative number.' });
    }
    if (isNaN(available) || available < 0) {
      return res.status(400).json({ success: false, message: 'Available copies must be a non-negative number.' });
    }
    if (available > total) {
      return res.status(400).json({ success: false, message: 'Available copies cannot exceed total copies.' });
    }

    // Verify author exists
    const [[author]] = await pool.query('SELECT author_id, author_name FROM Author WHERE author_id = ?', [author_id]);
    if (!author) {
      return res.status(400).json({ success: false, message: `Author #${author_id} does not exist.` });
    }

    const year = publication_year ? parseInt(publication_year, 10) : null;

    const [result] = await pool.query(`
      INSERT INTO Book (author_id, title, isbn, category, publication_year, total_copies, available_copies)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [author_id, title.trim(), isbn.trim(), category.trim(), year, total, available]);

    res.status(201).json({
      success: true,
      message: 'Book added successfully to catalogue.',
      data: {
        book_id: result.insertId,
        author_id,
        author_name: author.author_name,
        title: title.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        publication_year: year,
        total_copies: total,
        available_copies: available
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * PUT /api/books/:id
 * Update book metadata and copy counts
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { author_id, title, isbn, category, publication_year, total_copies, available_copies } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Book title is required.' });
    }
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ success: false, message: 'ISBN is required.' });
    }
    if (!author_id) {
      return res.status(400).json({ success: false, message: 'Author is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const total = parseInt(total_copies, 10);
    const available = parseInt(available_copies, 10);

    if (isNaN(total) || total < 0) {
      return res.status(400).json({ success: false, message: 'Total copies must be a non-negative number.' });
    }
    if (isNaN(available) || available < 0) {
      return res.status(400).json({ success: false, message: 'Available copies must be a non-negative number.' });
    }
    if (available > total) {
      return res.status(400).json({ success: false, message: 'Available copies cannot exceed total copies.' });
    }

    // Verify how many copies are currently issued to prevent setting total < active loans
    const [[activeLoans]] = await pool.query(
      "SELECT COUNT(*) AS active_count FROM Issue WHERE book_id = ? AND status = 'ISSUED'",
      [id]
    );

    if (total < activeLoans.active_count) {
      return res.status(400).json({
        success: false,
        message: `Total copies (${total}) cannot be less than currently active loans (${activeLoans.active_count}).`
      });
    }

    const year = publication_year ? parseInt(publication_year, 10) : null;

    const [result] = await pool.query(`
      UPDATE Book
      SET author_id = ?, title = ?, isbn = ?, category = ?, publication_year = ?, total_copies = ?, available_copies = ?
      WHERE book_id = ?
    `, [author_id, title.trim(), isbn.trim(), category.trim(), year, total, available, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    }

    res.json({
      success: true,
      message: 'Book updated successfully.',
      data: {
        book_id: parseInt(id, 10),
        author_id,
        title: title.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        publication_year: year,
        total_copies: total,
        available_copies: available
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * DELETE /api/books/:id
 * Delete book (blocked if issue records reference it)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book has borrowing records
    const [[issueCount]] = await pool.query('SELECT COUNT(*) AS count FROM Issue WHERE book_id = ?', [id]);
    if (issueCount.count > 0) {
      return res.status(409).json({
        success: false,
        errorType: 'FOREIGN_KEY_RESTRICT_VIOLATION',
        message: `Cannot delete book #${id} because it has ${issueCount.count} borrowing record(s) in the Issue table. Foreign key constraint fk_issue_book prevents deleting books with active or historical loans.`
      });
    }

    const [result] = await pool.query('DELETE FROM Book WHERE book_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Book with ID ${id} not found.` });
    }

    res.json({ success: true, message: `Book #${id} deleted successfully.` });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

module.exports = router;
