-- ============================================
-- CHECK ATTENDANCE DATA IN DATABASE
-- Run these queries in MySQL to see your data
-- ============================================

-- 1. Check if there are any attendance sessions
SELECT 
    session_id,
    attendance_date,
    created_at,
    classroom_id,
    subject_id,
    teacher_id
FROM attendance_attendancesession 
ORDER BY created_at DESC;

-- 2. Check attendance sessions with details
SELECT 
    s.session_id,
    s.attendance_date,
    s.created_at,
    c.name as classroom_name,
    sub.name as subject_name,
    u.name as teacher_name
FROM attendance_attendancesession s
LEFT JOIN students_classroom c ON s.classroom_id = c.classroom_id
LEFT JOIN academics_subject sub ON s.subject_id = sub.subject_id  
LEFT JOIN users_user u ON s.teacher_id = u.user_id
ORDER BY s.created_at DESC;

-- 3. Check attendance records with student names
SELECT 
    r.record_id,
    r.status,
    r.remarks,
    s.attendance_date,
    st.full_name as student_name,
    st.student_id,
    c.name as classroom_name,
    sub.name as subject_name
FROM attendance_attendancerecord r
JOIN attendance_attendancesession s ON r.session_id = s.session_id
JOIN students_student st ON r.student_id = st.student_id
LEFT JOIN students_classroom c ON s.classroom_id = c.classroom_id
LEFT JOIN academics_subject sub ON s.subject_id = sub.subject_id
ORDER BY s.created_at DESC, st.full_name;

-- 4. Count records by session
SELECT 
    s.session_id,
    s.attendance_date,
    c.name as classroom_name,
    sub.name as subject_name,
    COUNT(r.record_id) as total_records,
    SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) as late_count
FROM attendance_attendancesession s
LEFT JOIN attendance_attendancerecord r ON s.session_id = r.session_id
LEFT JOIN students_classroom c ON s.classroom_id = c.classroom_id
LEFT JOIN academics_subject sub ON s.subject_id = sub.subject_id
GROUP BY s.session_id, s.attendance_date, c.name, sub.name
ORDER BY s.created_at DESC;

-- 5. Check recent attendance (last 7 days)
SELECT 
    s.session_id,
    s.attendance_date,
    s.created_at,
    c.name as classroom_name,
    sub.name as subject_name,
    u.name as teacher_name,
    COUNT(r.record_id) as student_count
FROM attendance_attendancesession s
LEFT JOIN attendance_attendancerecord r ON s.session_id = r.session_id
LEFT JOIN students_classroom c ON s.classroom_id = c.classroom_id
LEFT JOIN academics_subject sub ON s.subject_id = sub.subject_id
LEFT JOIN users_user u ON s.teacher_id = u.user_id
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY s.session_id, s.attendance_date, s.created_at, c.name, sub.name, u.name
ORDER BY s.created_at DESC;

-- 6. Check if you have any data at all
SELECT 
    'Sessions' as table_name, 
    COUNT(*) as count 
FROM attendance_attendancesession
UNION ALL
SELECT 
    'Records' as table_name, 
    COUNT(*) as count 
FROM attendance_attendancerecord
UNION ALL
SELECT 
    'Students' as table_name, 
    COUNT(*) as count 
FROM students_student
UNION ALL
SELECT 
    'Classrooms' as table_name, 
    COUNT(*) as count 
FROM students_classroom
UNION ALL
SELECT 
    'Subjects' as table_name, 
    COUNT(*) as count 
FROM academics_subject;