const express = require('express');
const router = express.Router();
const { pool, checkConnection, formatDbError, dbConfig } = require('../config/db');

const DEMO_QUERIES = {
  1: {
    id: 1,
    title: '1. Filtering with WHERE Clause',
    concept: 'Selection Operation & Equality/Inequality Filtering',
    description: 'Retrieves books that belong to the "Database Systems" category with publication year >= 2000.',
    sql: `SELECT book_id, title, isbn, category, publication_year, available_copies, total_copies
FROM Book
WHERE category = 'Database Systems' AND publication_year >= 2000
ORDER BY publication_year DESC;`,
    explanation: 'Demonstrates horizontal selection using relational algebra WHERE predicates and boolean AND conjunction.'
  },
  2: {
    id: 2,
    title: '2. Two-Table INNER JOIN (Book & Author)',
    concept: 'Relational INNER JOIN across Primary Key - Foreign Key Relationship',
    description: 'Combines the Book table with Author table using fk_book_author = author_id.',
    sql: `SELECT 
  b.book_id,
  b.title,
  b.category,
  b.isbn,
  a.author_id,
  a.author_name,
  a.nationality
FROM Book b
INNER JOIN Author a ON b.author_id = a.author_id
ORDER BY b.title ASC
LIMIT 8;`,
    explanation: 'Demonstrates 1-to-many cardinality where multiple books reference a single author without data redundancy.'
  },
  3: {
    id: 3,
    title: '3. Multi-Table JOIN (Issue, Student, Book, Author)',
    concept: 'Complex 4-Table Relational JOIN for Transaction History',
    description: 'Joins Issue with Student, Book, and Author to reconstruct complete checkout records.',
    sql: `SELECT 
  i.issue_id,
  s.student_name,
  s.department,
  b.title AS book_title,
  a.author_name,
  i.issue_date,
  i.due_date,
  i.status
FROM Issue i
JOIN Student s ON i.student_id = s.student_id
JOIN Book b ON i.book_id = b.book_id
JOIN Author a ON b.author_id = a.author_id
ORDER BY i.issue_id DESC
LIMIT 8;`,
    explanation: 'Demonstrates normalization: student contact details and author metadata are normalized and joined on demand.'
  },
  4: {
    id: 4,
    title: '4. Overdue Loan Detection via Date Arithmetic',
    concept: 'Date Functions, Predicate Logic & DATEDIFF Computation',
    description: 'Finds active loans whose due_date is in the past and calculates days overdue and estimated fine.',
    sql: `SELECT 
  i.issue_id,
  s.student_name,
  s.email,
  b.title,
  i.issue_date,
  i.due_date,
  CURRENT_DATE AS today,
  DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue,
  ROUND(DATEDIFF(CURRENT_DATE, i.due_date) * 5.0, 2) AS estimated_fine_inr
FROM Issue i
JOIN Student s ON i.student_id = s.student_id
JOIN Book b ON i.book_id = b.book_id
WHERE i.status = 'ISSUED' AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;`,
    explanation: 'Demonstrates temporal queries comparing calendar dates dynamically against CURRENT_DATE.'
  },
  5: {
    id: 5,
    title: '5. Aggregation with GROUP BY, COUNT, and SUM',
    concept: 'Relational Aggregation, Grouping & Multi-Row Calculations',
    description: 'Summarizes book count, total inventory, and current issued copies per subject category.',
    sql: `SELECT 
  category,
  COUNT(book_id) AS total_titles,
  SUM(total_copies) AS total_physical_copies,
  SUM(available_copies) AS total_available,
  SUM(total_copies - available_copies) AS total_currently_issued
FROM Book
GROUP BY category
ORDER BY total_physical_copies DESC;`,
    explanation: 'Demonstrates GROUP BY aggregate query for inventory control and library analytics.'
  },
  6: {
    id: 6,
    title: '6. Circulation & Return Auditing (Issue, BookReturn, Student)',
    concept: 'LEFT OUTER JOIN with Coalesced Aggregate Calculations',
    description: 'Queries return status and fines, using LEFT JOIN so active unreturned issues are not omitted.',
    sql: `SELECT 
  i.issue_id,
  s.student_name,
  b.title,
  i.status,
  COALESCE(r.return_date, 'Not Returned') AS return_date,
  COALESCE(r.fine_amount, 0.00) AS recorded_fine
FROM Issue i
JOIN Student s ON i.student_id = s.student_id
JOIN Book b ON i.book_id = b.book_id
LEFT JOIN BookReturn r ON i.issue_id = r.issue_id
ORDER BY i.issue_id DESC
LIMIT 8;`,
    explanation: 'Demonstrates 1-to-0..1 relationship where an Issue may or may not have a matching BookReturn.'
  }
};

/**
 * GET /api/database/status
 */
router.get('/status', async (req, res) => {
  const status = await checkConnection();

  try {
    let serverVersion = 'MySQL 8.0';
    let dbName = dbConfig.database;

    if (status.engine === 'sqlite') {
      serverVersion = 'SQLite 3.x (Relational Engine via WebAssembly)';
      dbName = 'library_relational.sqlite';
    } else {
      const [[verRow]] = await pool.query('SELECT VERSION() AS version, DATABASE() AS db_name');
      serverVersion = verRow.version;
      dbName = verRow.db_name;
    }

    // Query table counts
    const [[sCount]] = await pool.query('SELECT COUNT(*) AS c FROM Student');
    const [[aCount]] = await pool.query('SELECT COUNT(*) AS c FROM Author');
    const [[bCount]] = await pool.query('SELECT COUNT(*) AS c FROM Book');
    const [[iCount]] = await pool.query('SELECT COUNT(*) AS c FROM Issue');
    const [[rCount]] = await pool.query('SELECT COUNT(*) AS c FROM BookReturn');

    res.json({
      success: true,
      connected: true,
      engine: status.engine,
      isRelationalFallback: status.isRelationalFallback || false,
      serverVersion,
      databaseName: dbName,
      host: status.host,
      port: status.port,
      user: status.user,
      schemaReady: true,
      mysqlNotice: status.mysqlNotice || null,
      tables: {
        Student: Number(sCount.c),
        Author: Number(aCount.c),
        Book: Number(bCount.c),
        Issue: Number(iCount.c),
        BookReturn: Number(rCount.c)
      }
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/database/schema-info
 */
router.get('/schema-info', async (req, res) => {
  try {
    const status = await checkConnection();
    const tables = ['Student', 'Author', 'Book', 'Issue', 'BookReturn'];

    if (status.engine === 'sqlite') {
      // Query SQLite table info for schema dictionary
      const columns = [];
      for (const t of tables) {
        const [tCols] = await pool.query(`PRAGMA table_info(${t})`);
        for (const c of tCols) {
          columns.push({
            TABLE_NAME: t,
            COLUMN_NAME: c.name,
            ORDINAL_POSITION: c.cid + 1,
            COLUMN_DEFAULT: c.dflt_value,
            IS_NULLABLE: c.notnull === 1 ? 'NO' : 'YES',
            DATA_TYPE: c.type.split('(')[0],
            COLUMN_TYPE: c.type,
            COLUMN_KEY: c.pk === 1 ? 'PRI' : '',
            EXTRA: c.pk === 1 ? 'AUTOINCREMENT' : ''
          });
        }
      }

      res.json({
        success: true,
        database: 'library_relational.sqlite',
        engine: 'sqlite',
        columns,
        constraints: [
          { TABLE_NAME: 'Student', CONSTRAINT_NAME: 'uk_student_email', CONSTRAINT_TYPE: 'UNIQUE', COLUMN_NAME: 'email' },
          { TABLE_NAME: 'Book', CONSTRAINT_NAME: 'uk_book_isbn', CONSTRAINT_TYPE: 'UNIQUE', COLUMN_NAME: 'isbn' },
          { TABLE_NAME: 'Book', CONSTRAINT_NAME: 'fk_book_author', CONSTRAINT_TYPE: 'FOREIGN KEY', COLUMN_NAME: 'author_id', REFERENCED_TABLE_NAME: 'Author', REFERENCED_COLUMN_NAME: 'author_id' },
          { TABLE_NAME: 'Issue', CONSTRAINT_NAME: 'fk_issue_student', CONSTRAINT_TYPE: 'FOREIGN KEY', COLUMN_NAME: 'student_id', REFERENCED_TABLE_NAME: 'Student', REFERENCED_COLUMN_NAME: 'student_id' },
          { TABLE_NAME: 'Issue', CONSTRAINT_NAME: 'fk_issue_book', CONSTRAINT_TYPE: 'FOREIGN KEY', COLUMN_NAME: 'book_id', REFERENCED_TABLE_NAME: 'Book', REFERENCED_COLUMN_NAME: 'book_id' },
          { TABLE_NAME: 'BookReturn', CONSTRAINT_NAME: 'uk_return_issue', CONSTRAINT_TYPE: 'UNIQUE', COLUMN_NAME: 'issue_id' },
          { TABLE_NAME: 'BookReturn', CONSTRAINT_NAME: 'fk_return_issue', CONSTRAINT_TYPE: 'FOREIGN KEY', COLUMN_NAME: 'issue_id', REFERENCED_TABLE_NAME: 'Issue', REFERENCED_COLUMN_NAME: 'issue_id' }
        ]
      });
    } else {
      // Query MySQL information_schema
      const dbName = dbConfig.database;
      const [columns] = await pool.query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          ORDINAL_POSITION,
          COLUMN_DEFAULT,
          IS_NULLABLE,
          DATA_TYPE,
          COLUMN_TYPE,
          COLUMN_KEY,
          EXTRA
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('Student', 'Author', 'Book', 'Issue', 'BookReturn')
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `, [dbName]);

      const [constraints] = await pool.query(`
        SELECT 
          tc.TABLE_NAME,
          tc.CONSTRAINT_NAME,
          tc.CONSTRAINT_TYPE,
          kcu.COLUMN_NAME,
          kcu.REFERENCED_TABLE_NAME,
          kcu.REFERENCED_COLUMN_NAME
        FROM information_schema.TABLE_CONSTRAINTS tc
        LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
          ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
          AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
          AND tc.TABLE_NAME = kcu.TABLE_NAME
        WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME IN ('Student', 'Author', 'Book', 'Issue', 'BookReturn')
        ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME
      `, [dbName]);

      res.json({
        success: true,
        database: dbName,
        engine: 'mysql',
        columns,
        constraints
      });
    }
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/database/query-demo/:id
 */
router.get('/query-demo/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const queryConfig = DEMO_QUERIES[id];

    if (!queryConfig) {
      return res.status(404).json({
        success: false,
        message: `Query demo #${id} not found. Available queries: 1 to 6.`
      });
    }

    const startTime = Date.now();
    const [rows] = await pool.query(queryConfig.sql);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      queryId: id,
      title: queryConfig.title,
      concept: queryConfig.concept,
      description: queryConfig.description,
      sql: queryConfig.sql,
      explanation: queryConfig.explanation,
      rowCount: rows.length,
      executionTimeMs,
      rows
    });
  } catch (err) {
    const errorDetails = formatDbError(err);
    res.status(errorDetails.status).json({ success: false, ...errorDetails });
  }
});

/**
 * GET /api/database/queries
 */
router.get('/queries', (req, res) => {
  const queryList = Object.values(DEMO_QUERIES).map(q => ({
    id: q.id,
    title: q.title,
    concept: q.concept,
    description: q.description,
    sql: q.sql,
    explanation: q.explanation
  }));
  res.json({ success: true, data: queryList });
});

module.exports = router;
