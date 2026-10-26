const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

/**
 * GET /api/issues
 * List issues with search and status filter ('ALL', 'ISSUED', 'RETURNED')
 */
router.get('/', async (req, res) => {
  try {
    const { status, search, overdue } = req.query;

    let query = `
      SELECT 
        i.issue_id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_name,
        s.email AS student_email,
        s.department,
        b.title AS book_title,
        b.isbn,
        r.return_id,
        r.return_date,
        r.fine_amount,
        CASE 
          WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE 
          THEN 1 
          ELSE 0 
        END AS is_overdue,
        CASE 
          WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE 
          THEN DATEDIFF(CURRENT_DATE, i.due_date) 
          ELSE 0 
        END AS overdue_days
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND i.status = ? `;
      params.push(status);
    }

    if (overdue === 'true') {
      query += ` AND i.status = 'ISSUED' AND i.due_date < CURRENT_DATE `;
    }

    if (search && search.trim()) {
      query += ` AND (s.student_name LIKE ? OR b.title LIKE ? OR b.isbn LIKE ? OR s.email LIKE ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY i.issue_id DESC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/issues/active
 * Quick endpoint to fetch currently issued loans for return selection
 */
router.get('/active', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        i.issue_id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_name,
        s.email AS student_email,
        s.department,
        b.title AS book_title,
        b.isbn,
        CASE 
          WHEN i.due_date < CURRENT_DATE THEN 1 
          ELSE 0 
        END AS is_overdue,
        CASE 
          WHEN i.due_date < CURRENT_DATE 
          THEN DATEDIFF(CURRENT_DATE, i.due_date) 
          ELSE 0 
        END AS overdue_days
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE i.status = 'ISSUED'
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (s.student_name LIKE ? OR b.title LIKE ? OR b.isbn LIKE ? OR CAST(i.issue_id AS CHAR) = ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, search.trim());
    }

    query += ` ORDER BY i.due_date ASC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/issues
 * Transactional Issue of a Book
 * Steps:
 * 1. Validate inputs (student, book, dates)
 * 2. Begin transaction
 * 3. SELECT book FOR UPDATE to lock row and verify available_copies > 0
 * 4. INSERT INTO Issue
 * 5. UPDATE Book SET available_copies = available_copies - 1
 * 6. COMMIT
 */
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { student_id, book_id, issue_date, due_date } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Please select a student.' });
    }
    if (!book_id) {
      return res.status(400).json({ success: false, message: 'Please select a book.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const actualIssueDate = issue_date || todayStr;

    if (!due_date) {
      return res.status(400).json({ success: false, message: 'Due date is required.' });
    }

    // CHECK constraint validation: due_date cannot precede issue_date
    if (new Date(due_date) < new Date(actualIssueDate)) {
      return res.status(400).json({
        success: false,
        errorType: 'CHECK_CONSTRAINT_VIOLATION',
        message: `Due date (${due_date}) cannot precede the issue date (${actualIssueDate}). Relational CHECK constraint chk_issue_due_date enforced.`
      });
    }

    // Begin ACID transaction
    await connection.beginTransaction();

    // 1. Verify student exists
    const [[student]] = await connection.query(
      'SELECT student_id, student_name, email FROM Student WHERE student_id = ?',
      [student_id]
    );
    if (!student) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Student with ID #${student_id} not found.` });
    }

    // 2. Lock book row with SELECT FOR UPDATE to prevent race condition over-issuing
    const [[book]] = await connection.query(
      'SELECT book_id, title, total_copies, available_copies FROM Book WHERE book_id = ? FOR UPDATE',
      [book_id]
    );
    if (!book) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Book with ID #${book_id} not found.` });
    }

    // 3. Verify availability
    if (book.available_copies <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        errorType: 'BOOK_UNAVAILABLE',
        message: `Cannot issue "${book.title}". All ${book.total_copies} copies are currently on loan. Available copies is 0.`
      });
    }

    // 4. Insert into Issue table
    const [issueResult] = await connection.query(`
      INSERT INTO Issue (student_id, book_id, issue_date, due_date, status)
      VALUES (?, ?, ?, ?, 'ISSUED')
    `, [student_id, book_id, actualIssueDate, due_date]);

    const newIssueId = issueResult.insertId;

    // 5. Decrement available copies in Book table
    await connection.query(`
      UPDATE Book 
      SET available_copies = available_copies - 1 
      WHERE book_id = ?
    `, [book_id]);

    // 6. Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" successfully issued to ${student.student_name}. Available copies decreased to ${book.available_copies - 1}.`,
      data: {
        issue_id: newIssueId,
        student_id: student.student_id,
        student_name: student.student_name,
        book_id: book.book_id,
        book_title: book.title,
        issue_date: actualIssueDate,
        due_date,
        status: 'ISSUED',
        remaining_available_copies: book.available_copies - 1
      }
    });

  } catch (err) {
    await connection.rollback();
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  } finally {
    connection.release();
  }
});

module.exports = router;
