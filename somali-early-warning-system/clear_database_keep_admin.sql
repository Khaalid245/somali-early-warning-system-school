-- ============================================
-- CLEAR ALL DATA BUT KEEP ADMIN USER
-- Run this in MySQL to reset everything safely
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

-- Clear only non-admin users
DELETE FROM users_user WHERE role != 'admin';

-- Clear audit logs
TRUNCATE TABLE audit_auditlog;

SET FOREIGN_KEY_CHECKS = 1;

-- Show remaining data
SELECT 'Admin users remaining:' as info, COUNT(*) as count FROM users_user WHERE role = 'admin';
