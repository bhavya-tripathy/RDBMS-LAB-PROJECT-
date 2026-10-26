const express = require('express');
const router = express.Router();
const { pool, formatDbError } = require('../config/db');

/**
 * GET /api/students
 * List all students with optional search filter
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT 
        s.student_id,
        s.student_name,
        s.email,
        s.phone,
        s.department,
        s.registration_date,
        COUNT(i.issue_id) AS total_borrowed,
        COUNT(CASE WHEN i.status = 'ISSUED' THEN 1 END) AS currently_borrowed
      FROM Student s
      LEFT JOIN Issue i ON s.student_id = i.student_id
    `;
    const params = [];

    if (q && q.trim()) {
      query += `
        WHERE s.student_name LIKE ? 
           OR s.email LIKE ? 
           OR s.department LIKE ?
           OR s.phone LIKE ?
      `;
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    query += `
      GROUP BY s.student_id, s.student_name, s.email, s.phone, s.department, s.registration_date
      ORDER BY s.student_id DESC
    `;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/students/:id
 * Retrieve single student by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM Student WHERE student_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Student with ID ${id} not found.` });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/students/:id/history
 * Retrieve borrowing history for a specific student
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify student exists
    const [[student]] = await pool.query('SELECT * FROM Student WHERE student_id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with ID ${id} not found.` });
    }

    const [history] = await pool.query(`
      SELECT 
        i.issue_id,
        i.issue_date,
        i.due_date,
        i.status,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        b.category,
        r.return_id,
        r.return_date,
        r.fine_amount,
        CASE 
          WHEN i.status = 'ISSUED' AND i.due_date < CURRENT_DATE 
          THEN DATEDIFF(CURRENT_DATE, i.due_date) 
          ELSE 0 
        END AS overdue_days
      FROM Issue i
      JOIN Book b ON i.book_id = b.book_id
      LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
      WHERE i.student_id = ?
      ORDER BY i.issue_id DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        student,
        history
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * POST /api/students
 * Add a new student record
 */
router.post('/', async (req, res) => {
  try {
    const { student_name, email, phone, department, registration_date } = req.body;

    // Validation
    if (!student_name || !student_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const regDate = registration_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO Student (student_name, email, phone, department, registration_date)
      VALUES (?, ?, ?, ?, ?)
    `, [student_name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, department.trim(), regDate]);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully in MySQL.',
      data: {
        student_id: result.insertId,
        student_name: student_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        department: department.trim(),
        registration_date: regDate
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * PUT /api/students/:id
 * Update an existing student's details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, email, phone, department } = req.body;

    if (!student_name || !student_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const [result] = await pool.query(`
      UPDATE Student
      SET student_name = ?, email = ?, phone = ?, department = ?
      WHERE student_id = ?
    `, [student_name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, department.trim(), id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Student with ID ${id} not found.` });
    }

    res.json({
      success: true,
      message: 'Student details updated successfully.',
      data: {
        student_id: parseInt(id, 10),
        student_name: student_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        department: department.trim()
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * DELETE /api/students/:id
 * Delete student (blocked by FK constraint if borrowing history exists)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check active or previous loans to explain referential integrity
    const [[issueCount]] = await pool.query('SELECT COUNT(*) AS count FROM Issue WHERE student_id = ?', [id]);
    if (issueCount.count > 0) {
      return res.status(409).json({
        success: false,
        errorType: 'FOREIGN_KEY_RESTRICT_VIOLATION',
        message: `Cannot delete student #${id} because they have ${issueCount.count} issue record(s) in the database. Deleting would violate referential integrity.`
      });
    }

    const [result] = await pool.query('DELETE FROM Student WHERE student_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Student with ID ${id} not found.` });
    }

    res.json({ success: true, message: `Student #${id} deleted successfully.` });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

module.exports = router;
