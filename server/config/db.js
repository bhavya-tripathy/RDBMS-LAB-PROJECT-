const mysql = require('mysql2/promise');
const path = require('path');
const { querySqlite, getSqliteConnection, getSqliteDb } = require('./sqliteEngine');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'library_management_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true
};

let mysqlPool = null;
let activeEngine = 'detecting'; // 'mysql' | 'sqlite'

try {
  mysqlPool = mysql.createPool(dbConfig);
} catch (err) {
  console.warn('[MySQL Pool Init Notice]:', err.message);
}

/**
 * Checks MySQL server availability. If offline, activates embedded SQLite relational engine.
 */
async function checkConnection() {
  // 1. Try MySQL
  if (mysqlPool) {
    try {
      const conn = await mysqlPool.getConnection();
      try {
        await conn.ping();
        const [tables] = await conn.query(`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = ?
        `, [dbConfig.database]);
        
        const tableNames = tables.map(t => t.TABLE_NAME || t.table_name);
        const requiredTables = ['Student', 'Author', 'Book', 'Issue', 'BookReturn'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        activeEngine = 'mysql';
        return {
          connected: true,
          engine: 'mysql',
          isRelationalFallback: false,
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          database: dbConfig.database,
          tablesFound: tableNames,
          schemaReady: missingTables.length === 0,
          missingTables
        };
      } finally {
        conn.release();
      }
    } catch (err) {
      // MySQL unavailable, fall through to SQLite
    }
  }

  // 2. MySQL is not running -> Activate zero-config SQLite Relational Engine
  try {
    const db = await getSqliteDb();
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Student', 'Author', 'Book', 'Issue', 'BookReturn')");
    const tableNames = res.length > 0 ? res[0].values.map(v => v[0]) : [];

    activeEngine = 'sqlite';
    return {
      connected: true,
      engine: 'sqlite',
      isRelationalFallback: true,
      host: 'localhost (in-process)',
      port: 0,
      user: 'local',
      database: 'library_relational.sqlite',
      serverVersion: 'SQLite 3.x (Relational Engine via WebAssembly)',
      tablesFound: tableNames,
      schemaReady: tableNames.length >= 5,
      missingTables: [],
      mysqlNotice: `MySQL server at ${dbConfig.host}:${dbConfig.port} is currently offline. Running in Embedded Relational SQL mode with full tables, foreign keys, constraints, and seed transactions.`
    };
  } catch (sqliteErr) {
    return {
      connected: false,
      engine: 'none',
      error: sqliteErr.message
    };
  }
}

/**
 * Unified pool proxy that routes to MySQL when online or SQLite when offline
 */
const pool = {
  query: async (sql, params = []) => {
    // If we haven't determined engine yet, check connection first
    if (activeEngine === 'detecting') {
      await checkConnection();
    }

    if (activeEngine === 'mysql' && mysqlPool) {
      try {
        return await mysqlPool.query(sql, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.warn('[DB Failover] MySQL disconnected, failing over to SQLite relational engine...');
          activeEngine = 'sqlite';
          return await querySqlite(sql, params);
        }
        throw err;
      }
    } else {
      return await querySqlite(sql, params);
    }
  },

  getConnection: async () => {
    if (activeEngine === 'detecting') {
      await checkConnection();
    }

    if (activeEngine === 'mysql' && mysqlPool) {
      try {
        return await mysqlPool.getConnection();
      } catch (err) {
        activeEngine = 'sqlite';
        return await getSqliteConnection();
      }
    } else {
      return await getSqliteConnection();
    }
  }
};

/**
 * Formats relational database error messages for both MySQL and SQLite
 */
function formatDbError(err) {
  if (!err) return { status: 500, message: 'An unknown database error occurred.' };

  const msg = err.message || '';

  // UNIQUE constraint
  if (err.code === 'ER_DUP_ENTRY' || msg.includes('UNIQUE constraint failed')) {
    let field = 'unique field';
    if (msg.includes('email') || msg.includes('uk_student_email') || msg.includes('Student.email')) {
      field = 'Email address';
    } else if (msg.includes('isbn') || msg.includes('uk_book_isbn') || msg.includes('Book.isbn')) {
      field = 'ISBN';
    } else if (msg.includes('issue_id') || msg.includes('uk_return_issue')) {
      field = 'Issue return';
    }
    return {
      status: 409,
      errorType: 'UNIQUE_CONSTRAINT_VIOLATION',
      message: `${field} already exists in the database. Duplicate values violate relational UNIQUE constraints.`,
      sqlError: msg
    };
  }

  // FOREIGN KEY constraint
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED' || msg.includes('FOREIGN KEY constraint failed')) {
    return {
      status: 409,
      errorType: 'FOREIGN_KEY_RESTRICT_VIOLATION',
      message: 'Cannot delete or update this record because it is referenced by other records in the system (ON DELETE RESTRICT enforcement).',
      sqlError: msg
    };
  }

  // CHECK constraint
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || msg.includes('CHECK constraint failed')) {
    return {
      status: 400,
      errorType: 'CHECK_CONSTRAINT_VIOLATION',
      message: 'Operation violated a table CHECK constraint (e.g., negative copies, due_date preceding issue_date, or negative fines).',
      sqlError: msg
    };
  }

  return {
    status: 500,
    errorType: 'SQL_EXECUTION_ERROR',
    message: msg || 'Database query execution failed.',
    sqlError: msg
  };
}

module.exports = {
  pool,
  dbConfig,
  checkConnection,
  formatDbError
};
