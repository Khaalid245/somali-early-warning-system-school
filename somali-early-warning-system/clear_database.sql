-- ============================================
-- CLEAR ALL DATA FROM DATABASE
-- Run this in MySQL to reset everything
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Clear attendance data
TRUNCATE TABLE attendance_attendancerecord;
TRUNCATE TABLE attendance_attendancesession;

-- Clear intervention data
TRUNCATE TABLE interventions_interventioncase;
TRUNCATE TABLE interventions_caseupdate;

-- Clear alerts
TRUNCATE TABLE alerts_alert;

-- Clear risk profiles
TRUNCATE TABLE risk_studentriskprofile;

-- Clear academic assignments
TRUNCATE TABLE academics_teachingassignment;

-- Clear enrollments
TRUNCATE TABLE students_studentenrollment;

-- Clear students
TRUNCATE TABLE students_student;

-- Clear classrooms
TRUNCATE TABLE students_classroom;

-- Clear subjects
TRUNCATE TABLE academics_subject;

-- Clear users (EXCEPT admin - optional)
-- If you want to keep admin user, skip this or delete selectively
DELETE FROM users_user WHERE role != 'admin';
-- OR to delete ALL users including admin:
-- TRUNCATE TABLE users_user;

-- Clear audit logs (optional)
TRUNCATE TABLE audit_auditlog;

-- Clear Django sessions (optional)
TRUNCATE TABLE django_session;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to confirm tables are empty
-- ============================================

SELECT COUNT(*) as students FROM students_student;
SELECT COUNT(*) as classrooms FROM students_classroom;
SELECT COUNT(*) as enrollments FROM students_studentenrollment;
SELECT COUNT(*) as users FROM users_user;
SELECT COUNT(*) as alerts FROM alerts_alert;
SELECT COUNT(*) as cases FROM interventions_interventioncase;
SELECT COUNT(*) as attendance FROM attendance_attendancerecord;
