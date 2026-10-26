-- ============================================================================
-- SEED DATA: Library Management System
-- Course: Relational Database Management Systems (RDBMS) Lab
-- Institution: Manipal University Jaipur
-- All data is realistic but entirely fictional demonstration data.
-- ============================================================================

USE `library_management_system`;

-- Clear existing data if needed (respecting foreign key hierarchy)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `BookReturn`;
TRUNCATE TABLE `Issue`;
TRUNCATE TABLE `Book`;
TRUNCATE TABLE `Author`;
TRUNCATE TABLE `Student`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. SEED AUTHORS (7 Authors)
-- ============================================================================
INSERT INTO `Author` (`author_id`, `author_name`, `nationality`) VALUES
(1, 'Abraham Silberschatz', 'American'),
(2, 'Henry F. Korth', 'American'),
(3, 'Thomas H. Cormen', 'American'),
(4, 'Robert C. Martin', 'American'),
(5, 'Martin Fowler', 'British'),
(6, 'Donald E. Knuth', 'American'),
(7, 'Andrew S. Tanenbaum', 'Dutch-American');

-- ============================================================================
-- 2. SEED STUDENTS (9 Students across multiple MUJ Departments)
-- ============================================================================
INSERT INTO `Student` (`student_id`, `student_name`, `email`, `phone`, `department`, `registration_date`) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@jaipur.manipal.edu', '+91-9829012345', 'Computer Science & Engineering', '2025-08-01'),
(2, 'Diya Patel', 'diya.patel@jaipur.manipal.edu', '+91-9829023456', 'Information Technology', '2025-08-05'),
(3, 'Rohan Verma', 'rohan.verma@jaipur.manipal.edu', '+91-9829034567', 'Electronics & Communication', '2025-08-10'),
(4, 'Ananya Iyer', 'ananya.iyer@jaipur.manipal.edu', '+91-9829045678', 'Data Science & AI', '2025-08-12'),
(5, 'Kabir Mehta', 'kabir.mehta@jaipur.manipal.edu', '+91-9829056789', 'Mechanical Engineering', '2025-08-15'),
(6, 'Ishita Sen', 'ishita.sen@jaipur.manipal.edu', '+91-9829067890', 'Computer Science & Engineering', '2025-08-18'),
(7, 'Siddharth Rao', 'siddharth.rao@jaipur.manipal.edu', '+91-9829078901', 'Electrical Engineering', '2025-08-20'),
(8, 'Priya Nair', 'priya.nair@jaipur.manipal.edu', '+91-9829089012', 'Civil Engineering', '2025-08-22'),
(9, 'Tanvi Joshi', 'tanvi.joshi@jaipur.manipal.edu', '+91-9829090123', 'Information Technology', '2025-08-25');

-- ============================================================================
-- 3. SEED BOOKS (14 Books across disciplines)
-- Note: available_copies perfectly matches total_copies minus active ISSUED loans
-- ============================================================================
INSERT INTO `Book` (`book_id`, `author_id`, `title`, `isbn`, `category`, `publication_year`, `total_copies`, `available_copies`) VALUES
(1, 1, 'Database System Concepts', '978-0078022159', 'Database Systems', 2019, 5, 4), -- 1 active loan (Issue #6)
(2, 1, 'Operating System Concepts', '978-1119800361', 'Operating Systems', 2021, 4, 4), -- 0 active loans (Issue #9 returned)
(3, 3, 'Introduction to Algorithms', '978-0262046305', 'Algorithms', 2022, 6, 4), -- 2 active loans (Issue #4, #10)
(4, 4, 'Clean Code: Handbook of Agile Craft', '978-0132350884', 'Software Engineering', 2008, 4, 3), -- 1 active loan (Issue #3)
(5, 4, 'Clean Architecture', '978-0134494166', 'Software Architecture', 2017, 3, 3), -- 0 active loans
(6, 5, 'Refactoring: Improving Existing Code', '978-0134757599', 'Software Engineering', 2018, 3, 2), -- 1 active loan (Issue #5)
(7, 5, 'Patterns of Enterprise Application Architecture', '978-0321127426', 'Software Architecture', 2002, 2, 2), -- 0 active loans
(8, 6, 'The Art of Computer Programming, Vol 1', '978-0201896831', 'Computer Science', 1997, 2, 2), -- 0 active loans
(9, 7, 'Computer Networks', '978-0132126953', 'Networking', 2010, 4, 3), -- 1 active loan (Issue #7)
(10, 7, 'Modern Operating Systems', '978-0133591620', 'Operating Systems', 2014, 3, 3), -- 0 active loans
(11, 7, 'Structured Computer Organization', '978-0132916523', 'Computer Architecture', 2012, 3, 3), -- 0 active loans
(12, 2, 'Database Management Systems Essentials', '978-0072465631', 'Database Systems', 2002, 3, 2), -- 1 active loan (Issue #8)
(13, 5, 'Designing Data-Intensive Applications', '978-1449373320', 'Distributed Systems', 2017, 5, 5), -- 0 active loans
(14, 3, 'Algorithms Unlocked', '978-0262518802', 'Algorithms', 2013, 2, 2); -- 0 active loans

-- ============================================================================
-- 4. SEED ISSUE TRANSACTIONS (10 Issues: 3 Returned, 7 Active including 3 Overdue)
-- Uses dynamic date arithmetic relative to CURRENT_DATE so overdue tests remain valid
-- ============================================================================
INSERT INTO `Issue` (`issue_id`, `student_id`, `book_id`, `issue_date`, `due_date`, `status`) VALUES
-- Issue 1: Returned with overdue fine (Due 6 days ago, returned 4 days ago => 2 overdue days)
(1, 1, 1, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), 'RETURNED'),

-- Issue 2: Returned on time (Due 1 day ago, returned 1 day ago => 0 fine)
(2, 2, 3, DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 'RETURNED'),

-- Issue 3: ACTIVE & OVERDUE (Due 4 days ago) -> Rohan Verma / Clean Code
(3, 3, 4, DATE_SUB(CURRENT_DATE, INTERVAL 18 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), 'ISSUED'),

-- Issue 4: ACTIVE & OVERDUE (Due 2 days ago) -> Ananya Iyer / Intro to Algorithms
(4, 4, 3, DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 'ISSUED'),

-- Issue 5: ACTIVE & ON SCHEDULE (Due in 7 days) -> Kabir Mehta / Refactoring
(5, 5, 6, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'ISSUED'),

-- Issue 6: ACTIVE & ON SCHEDULE (Due in 9 days) -> Ishita Sen / Database System Concepts
(6, 6, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), 'ISSUED'),

-- Issue 7: ACTIVE & ON SCHEDULE (Due in 10 days) -> Siddharth Rao / Computer Networks
(7, 7, 9, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'ISSUED'),

-- Issue 8: ACTIVE & OVERDUE (Due 11 days ago) -> Priya Nair / DBMS Essentials
(8, 8, 12, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 11 DAY), 'ISSUED'),

-- Issue 9: Returned with 1 day overdue fine
(9, 1, 2, DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 16 DAY), 'RETURNED'),

-- Issue 10: ACTIVE & ON SCHEDULE (Due in 11 days) -> Ananya Iyer / Intro to Algorithms
(10, 4, 3, DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 11 DAY), 'ISSUED');

-- ============================================================================
-- 5. SEED RETURNS (Corresponds to Returned Issues #1, #2, #9)
-- Fine rate = Rs. 5 per overdue day
-- ============================================================================
INSERT INTO `BookReturn` (`return_id`, `issue_id`, `return_date`, `fine_amount`) VALUES
-- Return 1 for Issue 1: Returned 4 days ago, due was 6 days ago -> 2 days overdue * 5 = Rs. 10.00
(1, 1, DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), 10.00),

-- Return 2 for Issue 2: Returned exactly on due date (1 day ago) -> 0 fine
(2, 2, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 0.00),

-- Return 3 for Issue 9: Returned 15 days ago, due was 16 days ago -> 1 day overdue * 5 = Rs. 5.00
(3, 9, DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), 5.00);

-- Reset AUTO_INCREMENT counters to follow after seeded values
ALTER TABLE `Author` AUTO_INCREMENT = 8;
ALTER TABLE `Student` AUTO_INCREMENT = 10;
ALTER TABLE `Book` AUTO_INCREMENT = 15;
ALTER TABLE `Issue` AUTO_INCREMENT = 11;
ALTER TABLE `BookReturn` AUTO_INCREMENT = 4;
