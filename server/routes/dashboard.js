const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

const FINE_RATE = parseFloat(process.env.FINE_RATE_PER_DAY || '5');

/**
 * GET /api/dashboard/stats
 * Retrieves live aggregated metrics across all 5 tables
 */
router.get('/stats', async (req, res) => {
  try {
    const [[studentsRow]] = await pool.query('SELECT COUNT(*) AS total_students FROM Student');
    const [[authorsRow]] = await pool.query('SELECT COUNT(*) AS total_authors FROM Author');
    const [[booksRow]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_titles,
        COALESCE(SUM(total_copies), 0) AS total_copies,
        COALESCE(SUM(available_copies), 0) AS available_copies
      FROM Book
    `);
    const [[issuesRow]] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'ISSUED' THEN 1 END) AS currently_issued,
        COUNT(CASE WHEN status = 'ISSUED' AND due_date < CURRENT_DATE THEN 1 END) AS overdue_loans
      FROM Issue
    `);
    const [[finesRow]] = await pool.query(`
      SELECT COALESCE(SUM(fine_amount), 0.00) AS total_fines
      FROM BookReturn
    `);

    res.json({
      success: true,
      data: {
        totalStudents: Number(studentsRow.total_students),
        totalAuthors: Number(authorsRow.total_authors),
        totalBookTitles: Number(booksRow.total_titles),
        totalCopies: Number(booksRow.total_copies),
        availableCopies: Number(booksRow.available_copies),
        currentlyIssued: Number(issuesRow.currently_issued),
        overdueLoans: Number(issuesRow.overdue_loans),
        totalFines: Number(finesRow.total_fines),
        fineRatePerDay: FINE_RATE
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/dashboard/recent-issues
 * Retrieves latest 5 book issue transactions with joined student and book info
 */
router.get('/recent-issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.issue_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_id,
        s.student_name,
        s.department,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        CASE WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE THEN 1 ELSE 0 END AS is_overdue,
        CASE 
          WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE 
          THEN DATEDIFF(CURRENT_DATE, i.due_date) 
          ELSE 0 
        END AS overdue_days
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      ORDER BY i.issue_id DESC
      LIMIT 5
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/dashboard/recent-returns
 * Retrieves latest 5 return records with student, book, and fine amounts
 */
router.get('/recent-returns', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.return_id,
        r.return_date,
        r.fine_amount,
        i.issue_id,
        i.issue_date,
        i.due_date,
        s.student_name,
        b.title AS book_title
      FROM BookReturn r
      JOIN Issue i ON r.issue_id = i.issue_id
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      ORDER BY r.return_id DESC
      LIMIT 5
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/dashboard/category-stats
 * Aggregates books and circulation counts by category for charts
 */
router.get('/category-stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        category,
        COUNT(book_id) AS book_count,
        COALESCE(SUM(total_copies), 0) AS total_copies,
        COALESCE(SUM(available_copies), 0) AS available_copies,
        COALESCE(SUM(total_copies - available_copies), 0) AS issued_copies
      FROM Book
      GROUP BY category
      ORDER BY book_count DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/dashboard/overdue-alerts
 * Lists active overdue loans requiring attention
 */
router.get('/overdue-alerts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.issue_id,
        i.issue_date,
        i.due_date,
        s.student_id,
        s.student_name,
        s.email,
        s.phone,
        s.department,
        b.book_id,
        b.title AS book_title,
        DATEDIFF(CURRENT_DATE, i.due_date) AS overdue_days,
        ROUND(DATEDIFF(CURRENT_DATE, i.due_date) * ?, 2) AS estimated_fine
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE i.status = 'ISSUED' AND i.due_date < CURRENT_DATE
      ORDER BY overdue_days DESC
      LIMIT 10
    `, [FINE_RATE]);

    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

module.exports = router;
