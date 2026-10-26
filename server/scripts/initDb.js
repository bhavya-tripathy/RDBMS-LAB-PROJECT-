/**
 * Database Initializer Script
 * Connects to MySQL, creates library_management_system database, applies schema.sql and seed.sql.
 * Run via: node server/scripts/initDb.js or npm run db:init
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const database = process.env.DB_NAME || 'library_management_system';

  console.log('====================================================');
  console.log('  RDBMS LAB: LIBRARY MANAGEMENT SYSTEM INITIALIZER  ');
  console.log('====================================================');
  console.log(`Target: ${user}@${host}:${port}/${database}`);

  let connection;
  try {
    // 1. Connect without selecting database to ensure server is alive and create DB if needed
    console.log('\n[1/4] Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log(' Connected to MySQL successfully!');

    // 2. Create database
    console.log(`\n[2/4] Ensuring database '${database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${database}\`;`);
    console.log(` Database '${database}' is ready!`);

    // 3. Read and execute schema.sql
    console.log('\n[3/4] Applying schema.sql (tables, constraints, views)...');
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log(' Schema created successfully: Student, Author, Book, Issue, BookReturn!');

    // 4. Read and execute seed.sql
    console.log('\n[4/4] Inserting sample demonstration data...');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found at ${seedPath}`);
    }
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log(' Sample demonstration data seeded successfully!');

    // Verify row counts
    const [students] = await connection.query('SELECT COUNT(*) AS count FROM Student');
    const [authors] = await connection.query('SELECT COUNT(*) AS count FROM Author');
    const [books] = await connection.query('SELECT COUNT(*) AS count FROM Book');
    const [issues] = await connection.query('SELECT COUNT(*) AS count FROM Issue');
    const [returns] = await connection.query('SELECT COUNT(*) AS count FROM BookReturn');

    console.log('\n====================================================');
    console.log('               DATABASE STATUS REPORT               ');
    console.log('====================================================');
    console.log(`  Students:    ${students[0].count}`);
    console.log(`  Authors:     ${authors[0].count}`);
    console.log(`  Books:       ${books[0].count}`);
    console.log(`  Issues:      ${issues[0].count}`);
    console.log(`  Returns:     ${returns[0].count}`);
    console.log('====================================================');
    console.log('Initialization completed with zero errors!\n');

  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED:');
    console.error(`Message: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n-> Could not connect to MySQL at ${host}:${port}.`);
      console.error('-> Please ensure MySQL service is installed and running.');
      console.error('-> If using XAMPP or Laragon, click "Start" next to MySQL.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`\n-> Authentication failed for user '${user}'.`);
      console.error('-> Check or update DB_PASSWORD in your .env file.');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
