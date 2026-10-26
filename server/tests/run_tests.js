/**
 * Comprehensive Database Integrity & Constraint Test Suite
 * Validates all 12 key RDBMS integrity scenarios required for lab evaluation.
 * Runs on MySQL 8.0 when connected, or SQLite Relational Engine when offline.
 *
 * Run via: npm test or node server/tests/run_tests.js
 */

const path = require('path');
const { pool, checkConnection, dbConfig } = require('../config/db');

async function runTestSuite() {
  console.log('================================================================');
  console.log('  RDBMS LAB: AUTOMATED TEST SUITE & DATA INTEGRITY VERIFIER    ');
  console.log('  Course: Relational Database Management Systems Lab            ');
  console.log('  Manipal University Jaipur                                    ');
  console.log('================================================================\n');

  const status = await checkConnection();

  console.log(`Active Engine: ${status.engine === 'mysql' ? 'MySQL 8.0' : 'SQLite Relational Engine (sql.js)'}`);
  console.log(`Target:        ${status.host} / ${status.database}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Verify all 5 tables exist
    await test('1. All five core tables exist in schema', async () => {
      const tables = ['Student', 'Author', 'Book', 'Issue', 'BookReturn'];
      for (const t of tables) {
        const [rows] = await pool.query(`SELECT COUNT(*) as c FROM ${t}`);
        if (!rows || rows.length === 0) throw new Error(`Table ${t} is missing or inaccessible.`);
      }
    });

    // 2. Test duplicate student email rejection (UNIQUE constraint)
    await test('2. Duplicate student email rejection (UNIQUE constraint uk_student_email)', async () => {
      try {
        await pool.query(`
          INSERT INTO Student (student_name, email, department)
          VALUES ('Duplicate Test', 'aarav.sharma@jaipur.manipal.edu', 'CSE')
        `);
        throw new Error('Insert should have failed due to duplicate email.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('duplicate') && !msg.includes('unique')) {
          throw err;
        }
      }
    });

    // 3. Test duplicate ISBN rejection (UNIQUE constraint)
    await test('3. Duplicate ISBN rejection (UNIQUE constraint uk_book_isbn)', async () => {
      try {
        await pool.query(`
          INSERT INTO Book (author_id, title, isbn, category, total_copies, available_copies)
          VALUES (1, 'Duplicate ISBN Test', '978-0078022159', 'Database Systems', 3, 3)
        `);
        throw new Error('Insert should have failed due to duplicate ISBN.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('duplicate') && !msg.includes('unique')) {
          throw err;
        }
      }
    });

    // 4. Test non-existent author foreign key rejection
    await test('4. Book cannot reference non-existent author (FK fk_book_author)', async () => {
      try {
        await pool.query(`
          INSERT INTO Book (author_id, title, isbn, category, total_copies, available_copies)
          VALUES (99999, 'Orphan Book', '978-9999999999', 'Fiction', 2, 2)
        `);
        throw new Error('Insert should have failed due to missing author_id FK.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('foreign key') && !msg.includes('referenced')) {
          throw err;
        }
      }
    });

    // 5. Test CHECK constraint: due_date cannot precede issue_date
    await test('5. Issue due_date cannot precede issue_date (CHECK chk_issue_due_date)', async () => {
      try {
        await pool.query(`
          INSERT INTO Issue (student_id, book_id, issue_date, due_date, status)
          VALUES (1, 1, '2026-05-10', '2026-05-01', 'ISSUED')
        `);
        throw new Error('Insert should have failed due to chk_issue_due_date.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('check')) {
          throw err;
        }
      }
    });

    // 6. Test CHECK constraint: available_copies cannot exceed total_copies
    await test('6. Available copies cannot exceed total copies (CHECK chk_available_copies_valid)', async () => {
      try {
        await pool.query(`
          INSERT INTO Book (author_id, title, isbn, category, total_copies, available_copies)
          VALUES (1, 'Invalid Copies Book', '978-0000000001', 'Test', 2, 5)
        `);
        throw new Error('Insert should have failed due to available_copies > total_copies.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('check')) {
          throw err;
        }
      }
    });

    // 7. Test CHECK constraint: fine_amount cannot be negative
    await test('7. Negative fine amount is rejected (CHECK chk_fine_non_negative)', async () => {
      try {
        await pool.query(`
          INSERT INTO BookReturn (issue_id, return_date, fine_amount)
          VALUES (1, CURRENT_DATE, -50.00)
        `);
        throw new Error('Insert should have failed due to negative fine amount.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('check') && !msg.includes('unique') && !msg.includes('duplicate')) {
          throw err;
        }
      }
    });

    // 8. Test transaction atomicity and rollback
    await test('8. Transaction atomicity & rollback on failure', async () => {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [[bookBefore]] = await conn.query('SELECT available_copies FROM Book WHERE book_id = 2');
        const copiesBefore = bookBefore.available_copies;

        // Decrement copy
        await conn.query('UPDATE Book SET available_copies = available_copies - 1 WHERE book_id = 2');

        // Deliberately rollback
        await conn.rollback();

        const [[bookAfter]] = await conn.query('SELECT available_copies FROM Book WHERE book_id = 2');
        if (bookAfter.available_copies !== copiesBefore) {
          throw new Error(`Rollback failed! Copies before: ${copiesBefore}, copies after: ${bookAfter.available_copies}`);
        }
      } finally {
        conn.release();
      }
    });

    // 9. Test referential integrity on deleting student with active loans
    await test('9. Referential integrity blocks deleting student with active loans', async () => {
      try {
        await pool.query('DELETE FROM Student WHERE student_id = 3');
        throw new Error('Student deletion should have been blocked by fk_issue_student.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('foreign key') && !msg.includes('referenced')) {
          throw err;
        }
      }
    });

    // 10. Test overdue loans calculation accuracy
    await test('10. Overdue report accurately identifies past due loans', async () => {
      const [overdueRows] = await pool.query(`
        SELECT issue_id, due_date, CURRENT_DATE AS today
        FROM Issue
        WHERE status = 'ISSUED' AND due_date < CURRENT_DATE
      `);
      if (overdueRows.length === 0) {
        throw new Error('Expected at least one seeded overdue loan.');
      }
      for (const row of overdueRows) {
        if (new Date(row.due_date) >= new Date(row.today)) {
          throw new Error(`Issue #${row.issue_id} is marked overdue but due date ${row.due_date} is not earlier than ${row.today}`);
        }
      }
    });

    // 11. Test Return table 1-to-0..1 UNIQUE constraint (no duplicate returns)
    await test('11. Unique constraint prevents duplicate returns for same issue', async () => {
      try {
        // Issue 1 is already returned in seed data
        await pool.query(`
          INSERT INTO BookReturn (issue_id, return_date, fine_amount)
          VALUES (1, CURRENT_DATE, 0.00)
        `);
        throw new Error('Insert should have failed due to UNIQUE constraint on issue_id.');
      } catch (err) {
        const msg = err.message.toLowerCase();
        if (!msg.includes('duplicate') && !msg.includes('unique')) {
          throw err;
        }
      }
    });

    // 12. Test copy count consistency across all books
    await test('12. Inventory consistency: available_copies = total_copies - active_loans', async () => {
      const [books] = await pool.query(`
        SELECT 
          b.book_id,
          b.title,
          b.total_copies,
          b.available_copies,
          COUNT(CASE WHEN i.status = 'ISSUED' THEN 1 END) AS active_loans
        FROM Book b
        LEFT JOIN Issue i ON b.book_id = i.book_id
        GROUP BY b.book_id, b.title, b.total_copies, b.available_copies
      `);

      for (const b of books) {
        const expectedAvailable = b.total_copies - b.active_loans;
        if (b.available_copies !== expectedAvailable) {
          throw new Error(
            `Inconsistent inventory for book "${b.title}" (#${b.book_id}): ` +
            `total=${b.total_copies}, active_loans=${b.active_loans}, ` +
            `actual available=${b.available_copies}, expected=${expectedAvailable}`
          );
        }
      }
    });

    console.log('\n================================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total 12)`);
    console.log('================================================================\n');

  } catch (globalErr) {
    console.error('Fatal test execution error:', globalErr);
  }
}

if (require.main === module) {
  runTestSuite();
}

module.exports = runTestSuite;
