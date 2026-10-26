const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

const FINE_RATE = parseFloat(process.env.FINE_RATE_PER_DAY || '5');

/**
 * Helper to compute whole-day difference between two YYYY-MM-DD date strings
 */
function calculateOverdueDays(dueDateStr, returnDateStr) {
  const due = new Date(dueDateStr);
  const ret = new Date(returnDateStr);
  
  // Set to midnight UTC to compare pure calendar dates
  const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const utcRet = Date.UTC(ret.getFullYear(), ret.getMonth(), ret.getDate());
  
  const diffDays = Math.floor((utcRet - utcDue) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * GET /api/returns
 * List all processed return records
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT 
        r.return_id,
        r.issue_id,
        r.return_date,
        r.fine_amount,
        i.issue_date,
        i.due_date,
        s.student_id,
        s.student_name,
        s.email AS student_email,
        s.department,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        CASE 
          WHEN r.return_date > i.due_date 
          THEN DATEDIFF(r.return_date, i.due_date) 
          ELSE 0 
        END AS overdue_days
      FROM BookReturn r
      JOIN Issue i ON r.issue_id = i.issue_id
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (s.student_name LIKE ? OR b.title LIKE ? OR b.isbn LIKE ? OR CAST(r.return_id AS CHAR) = ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, search.trim());
    }

    query += ` ORDER BY r.return_id DESC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/returns/calculate
 * Computes overdue days and illustrative fine before committing
 */
router.post('/calculate', async (req, res) => {
  try {
    const { issue_id, return_date } = req.body;

    if (!issue_id) {
      return res.status(400).json({ success: false, message: 'issue_id is required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const actualReturnDate = return_date || todayStr;

    const [rows] = await pool.query(`
      SELECT 
        i.issue_id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_name,
        s.email,
        b.title AS book_title,
        b.isbn
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE i.issue_id = ?
    `, [issue_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Issue #${issue_id} not found.` });
    }

    const issue = rows[0];

    if (issue.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: `Issue #${issue_id} has already been returned. Cannot process duplicate returns.`
      });
    }

    const overdueDays = calculateOverdueDays(issue.due_date, actualReturnDate);
    const fineAmount = parseFloat((overdueDays * FINE_RATE).toFixed(2));

    res.json({
      success: true,
      data: {
        issue_id: issue.issue_id,
        student_name: issue.student_name,
        student_email: issue.email,
        book_title: issue.book_title,
        isbn: issue.isbn,
        issue_date: issue.issue_date,
        due_date: issue.due_date,
        return_date: actualReturnDate,
        overdue_days: overdueDays,
        fine_rate_per_day: FINE_RATE,
        fine_amount: fineAmount,
        is_overdue: overdueDays > 0,
        rate_note: 'Illustrative academic demo rate (Rs. 5/day)'
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/returns
 * Transactional Return of a Book
 * Steps:
 * 1. Validate inputs
 * 2. Start transaction
 * 3. SELECT issue FOR UPDATE to lock row and verify status = 'ISSUED'
 * 4. Verify no existing record in BookReturn for this issue (enforcing 1-to-0..1)
 * 5. Calculate overdue days & fine
 * 6. INSERT INTO BookReturn
 * 7. UPDATE Issue SET status = 'RETURNED'
 * 8. UPDATE Book SET available_copies = available_copies + 1
 * 9. COMMIT
 */
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { issue_id, return_date } = req.body;

    if (!issue_id) {
      return res.status(400).json({ success: false, message: 'issue_id is required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const actualReturnDate = return_date || todayStr;

    await connection.beginTransaction();

    // 1. Lock the issue row
    const [issueRows] = await connection.query(`
      SELECT 
        i.issue_id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_name,
        b.title AS book_title,
        b.available_copies,
        b.total_copies
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE i.issue_id = ?
      FOR UPDATE
    `, [issue_id]);

    if (issueRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Issue #${issue_id} not found.` });
    }

    const issue = issueRows[0];

    // 2. Prevent duplicate return
    if (issue.status === 'RETURNED') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        errorType: 'DUPLICATE_RETURN_ATTEMPT',
        message: `Issue #${issue_id} is already marked as RETURNED. Duplicate returns are prevented by UNIQUE constraint uk_return_issue.`
      });
    }

    // 3. Calculate overdue days and fine
    const overdueDays = calculateOverdueDays(issue.due_date, actualReturnDate);
    const fineAmount = parseFloat((overdueDays * FINE_RATE).toFixed(2));

    // 4. Insert into BookReturn table
    const [returnResult] = await connection.query(`
      INSERT INTO BookReturn (issue_id, return_date, fine_amount)
      VALUES (?, ?, ?)
    `, [issue_id, actualReturnDate, fineAmount]);

    const returnId = returnResult.insertId;

    // 5. Update Issue status to 'RETURNED'
    await connection.query(`
      UPDATE Issue
      SET status = 'RETURNED'
      WHERE issue_id = ?
    `, [issue_id]);

    // 6. Increment Book available_copies by 1
    await connection.query(`
      UPDATE Book
      SET available_copies = available_copies + 1
      WHERE book_id = ?
    `, [issue.book_id]);

    // 7. Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Return recorded successfully for "${issue.book_title}" borrowed by ${issue.student_name}. Available copies increased to ${issue.available_copies + 1}.`,
      data: {
        return_id: returnId,
        issue_id: issue.issue_id,
        student_name: issue.student_name,
        book_title: issue.book_title,
        return_date: actualReturnDate,
        due_date: issue.due_date,
        overdue_days: overdueDays,
        fine_amount: fineAmount,
        new_available_copies: issue.available_copies + 1
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
