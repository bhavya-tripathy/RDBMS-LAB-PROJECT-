-- ============================================================================
-- DATABASE SCHEMA: Library Management System
-- Course: Relational Database Management Systems (RDBMS) Lab
-- Institution: Manipal University Jaipur
-- Engine: MySQL 8.0+ (InnoDB)
-- ============================================================================

-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS `library_management_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `library_management_system`;

-- Disable foreign key checks during schema creation/updates
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse order of foreign key dependency if re-initializing
DROP TABLE IF EXISTS `BookReturn`;
DROP TABLE IF EXISTS `Issue`;
DROP TABLE IF EXISTS `Book`;
DROP TABLE IF EXISTS `Author`;
DROP TABLE IF EXISTS `Student`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. STUDENT TABLE
-- Stores registered university students who can borrow books.
-- Demonstrates: PRIMARY KEY, UNIQUE constraint on email, NOT NULL, DEFAULT
-- ============================================================================
CREATE TABLE `Student` (
  `student_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `department` VARCHAR(100) NOT NULL,
  `registration_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT `uk_student_email` UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. AUTHOR TABLE
-- Stores details of authors whose books are present in the catalogue.
-- Demonstrates: PRIMARY KEY, NOT NULL
-- ============================================================================
CREATE TABLE `Author` (
  `author_id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_name` VARCHAR(100) NOT NULL,
  `nationality` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. BOOK TABLE
-- Stores book titles, categories, ISBNs, and copy counts.
-- Demonstrates: PRIMARY KEY, FOREIGN KEY, UNIQUE ISBN, CHECK constraints
-- ============================================================================
CREATE TABLE `Book` (
  `book_id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `isbn` VARCHAR(20) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `publication_year` INT NULL,
  `total_copies` INT NOT NULL,
  `available_copies` INT NOT NULL,
  CONSTRAINT `uk_book_isbn` UNIQUE (`isbn`),
  CONSTRAINT `fk_book_author` FOREIGN KEY (`author_id`) 
    REFERENCES `Author` (`author_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  CONSTRAINT `chk_total_copies_non_negative` CHECK (`total_copies` >= 0),
  CONSTRAINT `chk_available_copies_valid` CHECK (`available_copies` >= 0 AND `available_copies` <= `total_copies`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ISSUE TABLE
-- Tracks book borrowing transactions by students.
-- Demonstrates: Composite Foreign Keys, CHECK constraint (due_date >= issue_date), ENUM
-- ============================================================================
CREATE TABLE `Issue` (
  `issue_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `issue_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `due_date` DATE NOT NULL,
  `status` ENUM('ISSUED', 'RETURNED') NOT NULL DEFAULT 'ISSUED',
  CONSTRAINT `fk_issue_student` FOREIGN KEY (`student_id`) 
    REFERENCES `Student` (`student_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_issue_book` FOREIGN KEY (`book_id`) 
    REFERENCES `Book` (`book_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  CONSTRAINT `chk_issue_due_date` CHECK (`due_date` >= `issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. RETURN TABLE (Safely mapped as BookReturn to avoid MySQL RETURN keyword)
-- Tracks return events and calculated fines.
-- Demonstrates: 1-to-0..1 UNIQUE Foreign Key, CHECK fine non-negative, DEFAULT
-- ============================================================================
CREATE TABLE `BookReturn` (
  `return_id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL,
  `return_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `fine_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `uk_return_issue` UNIQUE (`issue_id`),
  CONSTRAINT `fk_return_issue` FOREIGN KEY (`issue_id`) 
    REFERENCES `Issue` (`issue_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  CONSTRAINT `chk_fine_non_negative` CHECK (`fine_amount` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional view providing exact `Return` identifier alias for strict SQL syntax alignment
CREATE OR REPLACE VIEW `ReturnView` AS
SELECT 
  `return_id`,
  `issue_id`,
  `return_date`,
  `fine_amount`
FROM `BookReturn`;

-- Helpful indexes for join and search query performance
CREATE INDEX `idx_book_title` ON `Book` (`title`);
CREATE INDEX `idx_book_category` ON `Book` (`category`);
CREATE INDEX `idx_issue_status` ON `Issue` (`status`);
CREATE INDEX `idx_issue_due_date` ON `Issue` (`due_date`);
