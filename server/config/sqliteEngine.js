/**
 * SQLite Relational Engine via WebAssembly sql.js
 * Provides zero-config, embedded relational SQL database with full
 * ACID transactions, foreign keys (PRAGMA foreign_keys = ON), CHECK constraints,
 * UNIQUE indexes, and persistence.
 *
 * Used seamlessly when a standalone MySQL 8.0 daemon is not currently active on the host.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'library_relational.sqlite');

let dbInstance = null;
let SQL = null;
let isTransactionActive = false;

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function persistDb() {
  if (!dbInstance || isTransactionActive) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[SQLite Persistence Error]:', err.message);
  }
}

async function getSqliteDb() {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Load existing file or create fresh database
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Existing SQLite file corrupted, initializing fresh database');
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Enforce foreign key constraints in SQLite for every database session
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  // Register custom DATEDIFF(d1, d2) function for query parity with MySQL
  dbInstance.create_function('DATEDIFF', (d1, d2) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
  });

  // Check if tables already exist
  const res = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='Student'");
  if (res.length === 0 || res[0].values.length === 0) {
    initSchemaAndSeed(dbInstance);
    persistDb();
  }

  return dbInstance;
}

function initSchemaAndSeed(db) {
  console.log('[SQLite Engine] Initializing relational schema and seed data...');

  const schema = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Student (
      student_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      department TEXT NOT NULL,
      registration_date TEXT NOT NULL DEFAULT (DATE('now'))
    );

    CREATE TABLE IF NOT EXISTS Author (
      author_id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      nationality TEXT
    );

    CREATE TABLE IF NOT EXISTS Book (
      book_id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES Author(author_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      title TEXT NOT NULL,
      isbn TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      publication_year INTEGER,
      total_copies INTEGER NOT NULL CHECK(total_copies >= 0),
      available_copies INTEGER NOT NULL CHECK(available_copies >= 0 AND available_copies <= total_copies)
    );

    CREATE TABLE IF NOT EXISTS Issue (
      issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES Student(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      book_id INTEGER NOT NULL REFERENCES Book(book_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      issue_date TEXT NOT NULL DEFAULT (DATE('now')),
      due_date TEXT NOT NULL CHECK(due_date >= issue_date),
      status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('ISSUED', 'RETURNED'))
    );

    CREATE TABLE IF NOT EXISTS BookReturn (
      return_id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL UNIQUE REFERENCES Issue(issue_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      return_date TEXT NOT NULL DEFAULT (DATE('now')),
      fine_amount REAL NOT NULL DEFAULT 0.00 CHECK(fine_amount >= 0.00)
    );
  `;

  db.exec(schema);

  // Seed Authors (7)
  const authors = [
    [1, 'Abraham Silberschatz', 'American'],
    [2, 'Henry F. Korth', 'American'],
    [3, 'Thomas H. Cormen', 'American'],
    [4, 'Robert C. Martin', 'American'],
    [5, 'Martin Fowler', 'British'],
    [6, 'Donald E. Knuth', 'American'],
    [7, 'Andrew S. Tanenbaum', 'Dutch-American']
  ];
  for (const a of authors) {
    db.run('INSERT INTO Author (author_id, author_name, nationality) VALUES (?, ?, ?)', a);
  }

  // Seed Students (9)
  const students = [
    [1, 'Aarav Sharma', 'aarav.sharma@jaipur.manipal.edu', '+91-9829012345', 'Computer Science & Engineering', '2025-08-01'],
    [2, 'Diya Patel', 'diya.patel@jaipur.manipal.edu', '+91-9829023456', 'Information Technology', '2025-08-05'],
    [3, 'Rohan Verma', 'rohan.verma@jaipur.manipal.edu', '+91-9829034567', 'Electronics & Communication', '2025-08-10'],
    [4, 'Ananya Iyer', 'ananya.iyer@jaipur.manipal.edu', '+91-9829045678', 'Data Science & AI', '2025-08-12'],
    [5, 'Kabir Mehta', 'kabir.mehta@jaipur.manipal.edu', '+91-9829056789', 'Mechanical Engineering', '2025-08-15'],
    [6, 'Ishita Sen', 'ishita.sen@jaipur.manipal.edu', '+91-9829067890', 'Computer Science & Engineering', '2025-08-18'],
    [7, 'Siddharth Rao', 'siddharth.rao@jaipur.manipal.edu', '+91-9829078901', 'Electrical Engineering', '2025-08-20'],
    [8, 'Priya Nair', 'priya.nair@jaipur.manipal.edu', '+91-9829089012', 'Civil Engineering', '2025-08-22'],
    [9, 'Tanvi Joshi', 'tanvi.joshi@jaipur.manipal.edu', '+91-9829090123', 'Information Technology', '2025-08-25']
  ];
  for (const s of students) {
    db.run('INSERT INTO Student (student_id, student_name, email, phone, department, registration_date) VALUES (?, ?, ?, ?, ?, ?)', s);
  }

  // Seed Books (14)
  const books = [
    [1, 1, 'Database System Concepts', '978-0078022159', 'Database Systems', 2019, 5, 4],
    [2, 1, 'Operating System Concepts', '978-1119800361', 'Operating Systems', 2021, 4, 4],
    [3, 3, 'Introduction to Algorithms', '978-0262046305', 'Algorithms', 2022, 6, 4],
    [4, 4, 'Clean Code: Handbook of Agile Craft', '978-0132350884', 'Software Engineering', 2008, 4, 3],
    [5, 4, 'Clean Architecture', '978-0134494166', 'Software Architecture', 2017, 3, 3],
    [6, 5, 'Refactoring: Improving Existing Code', '978-0134757599', 'Software Engineering', 2018, 3, 2],
    [7, 5, 'Patterns of Enterprise Application Architecture', '978-0321127426', 'Software Architecture', 2002, 2, 2],
    [8, 6, 'The Art of Computer Programming, Vol 1', '978-0201896831', 'Computer Science', 1997, 2, 2],
    [9, 7, 'Computer Networks', '978-0132126953', 'Networking', 2010, 4, 3],
    [10, 7, 'Modern Operating Systems', '978-0133591620', 'Operating Systems', 2014, 3, 3],
    [11, 7, 'Structured Computer Organization', '978-0132916523', 'Computer Architecture', 2012, 3, 3],
    [12, 2, 'Database Management Systems Essentials', '978-0072465631', 'Database Systems', 2002, 3, 2],
    [13, 5, 'Designing Data-Intensive Applications', '978-1449373320', 'Distributed Systems', 2017, 5, 5],
    [14, 3, 'Algorithms Unlocked', '978-0262518802', 'Algorithms', 2013, 2, 2]
  ];
  for (const b of books) {
    db.run('INSERT INTO Book (book_id, author_id, title, isbn, category, publication_year, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', b);
  }

  // Dynamic date helpers
  const today = new Date();
  const formatOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // Seed Issues (10)
  const issues = [
    [1, 1, 1, formatOffset(-20), formatOffset(-6), 'RETURNED'],
    [2, 2, 3, formatOffset(-15), formatOffset(-1), 'RETURNED'],
    [3, 3, 4, formatOffset(-18), formatOffset(-4), 'ISSUED'],  // Overdue
    [4, 4, 3, formatOffset(-16), formatOffset(-2), 'ISSUED'],  // Overdue
    [5, 5, 6, formatOffset(-7), formatOffset(7), 'ISSUED'],
    [6, 6, 1, formatOffset(-5), formatOffset(9), 'ISSUED'],
    [7, 7, 9, formatOffset(-4), formatOffset(10), 'ISSUED'],
    [8, 8, 12, formatOffset(-25), formatOffset(-11), 'ISSUED'], // Overdue
    [9, 1, 2, formatOffset(-30), formatOffset(-16), 'RETURNED'],
    [10, 4, 3, formatOffset(-3), formatOffset(11), 'ISSUED']
  ];
  for (const i of issues) {
    db.run('INSERT INTO Issue (issue_id, student_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?)', i);
  }

  // Seed Returns (3)
  const returns = [
    [1, 1, formatOffset(-4), 10.00],
    [2, 2, formatOffset(-1), 0.00],
    [3, 9, formatOffset(-15), 5.00]
  ];
  for (const r of returns) {
    db.run('INSERT INTO BookReturn (return_id, issue_id, return_date, fine_amount) VALUES (?, ?, ?, ?)', r);
  }

  console.log('[SQLite Engine] Sample relational data seeded successfully.');
}

function adaptSql(sql) {
  let adapted = sql
    .replace(/CURRENT_DATE/gi, "DATE('now')")
    .replace(/\bFOR UPDATE\b/gi, "")
    .replace(/CAST\((\w+)\s+AS\s+CHAR\)/gi, "CAST($1 AS TEXT)");
  return adapted;
}

/**
 * Execute query on SQLite and return MySQL-compatible [rows] format
 */
async function querySqlite(sql, params = []) {
  const db = await getSqliteDb();
  const adapted = adaptSql(sql);

  const cleanParams = (params || []).map(p => (p === undefined ? null : p));

  const trimmed = adapted.trim().toUpperCase();
  const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA');

  if (isSelect) {
    const stmt = db.prepare(adapted);
    try {
      stmt.bind(cleanParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return [rows];
    } finally {
      stmt.free();
    }
  } else {
    // INSERT, UPDATE, DELETE
    db.run(adapted, cleanParams);
    if (!isTransactionActive) {
      persistDb();
    }

    // Get last insert ID and changes
    const lastIdRes = db.exec('SELECT last_insert_rowid() AS insertId');
    const changesRes = db.exec('SELECT changes() AS affectedRows');

    const insertId = lastIdRes.length > 0 && lastIdRes[0].values.length > 0 ? lastIdRes[0].values[0][0] : 0;
    const affectedRows = changesRes.length > 0 && changesRes[0].values.length > 0 ? changesRes[0].values[0][0] : 0;

    return [{
      insertId,
      affectedRows
    }];
  }
}

/**
 * Emulate MySQL connection for transactions
 */
async function getSqliteConnection() {
  const db = await getSqliteDb();

  return {
    query: async (sql, params = []) => querySqlite(sql, params),
    beginTransaction: async () => {
      if (!isTransactionActive) {
        db.exec('BEGIN TRANSACTION;');
        isTransactionActive = true;
      }
    },
    commit: async () => {
      if (isTransactionActive) {
        db.exec('COMMIT;');
        isTransactionActive = false;
        persistDb();
      }
    },
    rollback: async () => {
      if (isTransactionActive) {
        db.exec('ROLLBACK;');
        isTransactionActive = false;
      }
    },
    release: () => {
      // No-op for SQLite
    }
  };
}

module.exports = {
  getSqliteDb,
  querySqlite,
  getSqliteConnection,
  persistDb
};
