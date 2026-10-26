const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

const FINE_RATE = parseFloat(process.env.FINE_RATE_PER_DAY || '5');

/**
 * REPORT A: Complete Book Catalogue
 * Displays all books with authors, ISBNs, categories, total and available copies
 */
router.get('/catalogue', async (req, res) => {
  try {
    const { category, author_id } = req.query;
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
        a.author_name,
        a.nationality AS author_nationality
      FROM Book b
      JOIN Author a ON b.author_id = a.author_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND b.category = ? `;
      params.push(category);
    }
    if (author_id) {
      query += ` AND b.author_id = ? `;
      params.push(author_id);
    }

    query += ` ORDER BY b.category ASC, b.title ASC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * REPORT B: Currently Issued Books
 * Active loans only (status = 'ISSUED')
 */
router.get('/active-issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.issue_id,
        i.issue_date,
        i.due_date,
        i.status,
        s.student_id,
        s.student_name,
        s.email AS student_email,
        s.department,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        b.category,
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
      ORDER BY i.due_date ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * REPORT C: Overdue Books
 * Active loans with due_date strictly earlier than CURRENT_DATE
 */
router.get('/overdue', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.issue_id,
        i.issue_date,
        i.due_date,
        s.student_id,
        s.student_name,
        s.email AS student_email,
        s.phone AS student_phone,
        s.department,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue,
        ROUND(DATEDIFF(CURRENT_DATE, i.due_date) * ?, 2) AS calculated_fine
      FROM Issue i
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      WHERE i.status = 'ISSUED' AND i.due_date < CURRENT_DATE
      ORDER BY days_overdue DESC
    `, [FINE_RATE]);

    res.json({ success: true, data: rows, fineRate: FINE_RATE });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * REPORT D: Student Borrowing History
 * All issues and returns for a specific student or full student history summary
 */
router.get('/student-history', async (req, res) => {
  try {
    const { student_id } = req.query;

    let query = `
      SELECT 
        s.student_id,
        s.student_name,
        s.email,
        s.department,
        i.issue_id,
        i.issue_date,
        i.due_date,
        i.status,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        r.return_id,
        r.return_date,
        COALESCE(r.fine_amount, 0.00) AS fine_amount,
        CASE 
          WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE 
          THEN DATEDIFF(CURRENT_DATE, i.due_date) 
          WHEN i.status = 'RETURNED' AND r.return_date > i.due_date
          THEN DATEDIFF(r.return_date, i.due_date)
          ELSE 0 
        END AS overdue_days
      FROM Student s
      JOIN Issue i ON s.student_id = i.student_id
      JOIN Book b ON i.book_id = b.book_id
      LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ` AND s.student_id = ? `;
      params.push(student_id);
    }

    query += ` ORDER BY s.student_name ASC, i.issue_id DESC `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * REPORT E: Book Circulation Summary
 * Uses COUNT, GROUP BY, and JOIN to summarize borrowing frequency
 */
router.get('/circulation', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.book_id,
        b.title,
        b.isbn,
        b.category,
        a.author_name,
        b.total_copies,
        b.available_copies,
        COUNT(i.issue_id) AS total_times_issued,
        COUNT(CASE WHEN i.status = 'ISSUED' THEN 1 END) AS currently_issued_count,
        COUNT(CASE WHEN i.status = 'RETURNED' THEN 1 END) AS total_returned_count,
        COALESCE(SUM(r.fine_amount), 0.00) AS total_fines_accrued
      FROM Book b
      JOIN Author a ON b.author_id = a.author_id
      LEFT JOIN Issue i ON b.book_id = i.book_id
      LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
      GROUP BY b.book_id, b.title, b.isbn, b.category, a.author_name, b.total_copies, b.available_copies
      ORDER BY total_times_issued DESC, b.title ASC
    `);

    // Also summary grouped by category
    const [categoryCirculation] = await pool.query(`
      SELECT 
        b.category,
        COUNT(DISTINCT b.book_id) AS unique_titles,
        COUNT(i.issue_id) AS total_loans,
        COALESCE(SUM(r.fine_amount), 0.00) AS total_category_fines
      FROM Book b
      LEFT JOIN Issue i ON b.book_id = i.book_id
      LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
      GROUP BY b.category
      ORDER BY total_loans DESC
    `);

    res.json({
      success: true,
      data: {
        bookCirculation: rows,
        categoryCirculation
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * REPORT F: Fine Summary
 * Detailed return records with non-zero fines, plus cumulative aggregate totals
 */
router.get('/fines', async (req, res) => {
  try {
    const [[aggregateRow]] = await pool.query(`
      SELECT 
        COALESCE(SUM(fine_amount), 0.00) AS grand_total_fines,
        COUNT(*) AS total_returns_recorded,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) AS returns_with_fines,
        COALESCE(AVG(CASE WHEN fine_amount > 0 THEN fine_amount END), 0.00) AS average_fine_when_overdue
      FROM BookReturn
    `);

    const [records] = await pool.query(`
      SELECT 
        r.return_id,
        r.issue_id,
        r.return_date,
        r.fine_amount,
        i.issue_date,
        i.due_date,
        s.student_id,
        s.student_name,
        s.email,
        s.department,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        DATEDIFF(r.return_date, i.due_date) AS days_overdue
      FROM BookReturn r
      JOIN Issue i ON r.issue_id = i.issue_id
      JOIN Student s ON i.student_id = s.student_id
      JOIN Book b ON i.book_id = b.book_id
      ORDER BY r.return_date DESC, r.fine_amount DESC
    `);

    res.json({
      success: true,
      data: {
        summary: {
          grandTotalFines: Number(aggregateRow.grand_total_fines),
          totalReturnsRecorded: Number(aggregateRow.total_returns_recorded),
          returnsWithFines: Number(aggregateRow.returns_with_fines),
          averageFineWhenOverdue: Number(aggregateRow.average_fine_when_overdue)
        },
        records
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

module.exports = router;
