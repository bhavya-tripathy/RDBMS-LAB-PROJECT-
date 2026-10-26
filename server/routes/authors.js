const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

/**
 * GET /api/authors
 * List all authors with associated book count
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT 
        a.author_id,
        a.author_name,
        a.nationality,
        COUNT(b.book_id) AS book_count,
        COALESCE(SUM(b.total_copies), 0) AS total_copies_in_library
      FROM Author a
      LEFT JOIN Book b ON a.author_id = b.author_id
    `;
    const params = [];

    if (q && q.trim()) {
      query += ` WHERE a.author_name LIKE ? OR a.nationality LIKE ? `;
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    query += `
      GROUP BY a.author_id, a.author_name, a.nationality
      ORDER BY a.author_name ASC
    `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/authors/:id
 * Retrieve single author
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM Author WHERE author_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Author with ID ${id} not found.` });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/authors/:id/books
 * Retrieve all books linked to this author
 */
router.get('/:id/books', async (req, res) => {
  try {
    const { id } = req.params;
    const [[author]] = await pool.query('SELECT * FROM Author WHERE author_id = ?', [id]);
    if (!author) {
      return res.status(404).json({ success: false, message: `Author with ID ${id} not found.` });
    }

    const [books] = await pool.query(`
      SELECT 
        book_id,
        title,
        isbn,
        category,
        publication_year,
        total_copies,
        available_copies
      FROM Book
      WHERE author_id = ?
      ORDER BY title ASC
    `, [id]);

    res.json({ success: true, data: { author, books } });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/authors
 * Create a new author
 */
router.post('/', async (req, res) => {
  try {
    const { author_name, nationality } = req.body;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ success: false, message: 'Author name is required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO Author (author_name, nationality)
      VALUES (?, ?)
    `, [author_name.trim(), nationality ? nationality.trim() : null]);

    res.status(201).json({
      success: true,
      message: 'Author added successfully.',
      data: {
        author_id: result.insertId,
        author_name: author_name.trim(),
        nationality: nationality ? nationality.trim() : null,
        book_count: 0
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * PUT /api/authors/:id
 * Update author details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, nationality } = req.body;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ success: false, message: 'Author name is required.' });
    }

    const [result] = await pool.query(`
      UPDATE Author
      SET author_name = ?, nationality = ?
      WHERE author_id = ?
    `, [author_name.trim(), nationality ? nationality.trim() : null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Author with ID ${id} not found.` });
    }

    res.json({
      success: true,
      message: 'Author updated successfully.',
      data: {
        author_id: parseInt(id, 10),
        author_name: author_name.trim(),
        nationality: nationality ? nationality.trim() : null
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * DELETE /api/authors/:id
 * Delete author (prevented if books reference this author)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if books reference this author
    const [[bookCount]] = await pool.query('SELECT COUNT(*) AS count FROM Book WHERE author_id = ?', [id]);
    if (bookCount.count > 0) {
      return res.status(409).json({
        success: false,
        errorType: 'FOREIGN_KEY_RESTRICT_VIOLATION',
        message: `Cannot delete author #${id} because ${bookCount.count} book(s) in the catalogue reference this author. Foreign key constraint fk_book_author prevents orphan books.`
      });
    }

    const [result] = await pool.query('DELETE FROM Author WHERE author_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Author with ID ${id} not found.` });
    }

    res.json({ success: true, message: `Author #${id} deleted successfully.` });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

module.exports = router;
