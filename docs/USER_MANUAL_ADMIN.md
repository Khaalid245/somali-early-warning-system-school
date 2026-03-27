# Administrator User Manual
## AlifMonitor — School Early Warning Support System

**Version**: 1.0  
**Audience**: School Administrators  
**System URL**: https://www.alifmonitor.com

---

## What This System Does for You

As administrator you have full access to the system. You manage users, classrooms, student enrolments, and teacher assignments. You also have school-wide visibility into attendance trends, intervention cases, and audit logs. You receive email notifications when a Form Master escalates a case to administration.

---

## 1. Logging In

1. Open your browser and go to **https://www.alifmonitor.com**
2. Enter your **email address** and **password**
3. Click **Login**

**Two-Factor Authentication (2FA) is mandatory for administrators.** After entering your password you will be asked for a 6-digit code from your authenticator app (Google Authenticator or Microsoft Authenticator). Enter the current code shown in the app.

**If login fails:**
- Check Caps Lock — passwords are case-sensitive
- After many consecutive failed attempts your account is temporarily locked for 15 minutes
- If you are locked out, use the Django admin panel at `/admin/` with a superuser account to reset your password

---

## 2. Your Dashboard

After logging in you land on the **Admin Dashboard**. The sidebar gives you access to all sections.

---

## 3. Governance — User, Classroom, and Enrolment Management

Click **Governance** in the sidebar. This section contains all setup and management tasks.

### 3.1 Creating a User

1. Go to Governance → User Management
2. Click **Create User**
3. Fill in:
   - Full name
   - Email address (used as login username)
   - Role: **Admin**, **Teacher**, or **Form Master**
   - Password (must meet the password policy — see Section 8)
4. Click **Save**

The user can now log in with the email and password you set. Advise them to change their password on first login.

### 3.2 Editing or Disabling a User

1. Go to Governance → User Management
2. Find the user in the list
3. Click **Edit** to change their details
4. To disable a user (e.g. a teacher who has left), toggle their **Active** status to off — they will no longer be able to log in but their historical data is preserved

### 3.3 Creating a Classroom

1. Go to Governance → Classroom Management
2. Click **Create Classroom**
3. Enter the classroom name (e.g. "3B")
4. Assign a **Form Master** — select from the list of users with the Form Master role
5. Click **Save**

Each classroom must have exactly one Form Master assigned. The Form Master can only see data for their assigned classroom.

### 3.4 Enrolling Students

1. Go to Governance → Student Enrolment
2. Select the classroom
3. Add students to the classroom
4. Click **Save**

Students must be enrolled in a classroom before teachers can record their attendance.

### 3.5 Assigning Teachers to Classes

1. Go to Governance → Teacher Assignment
2. Select a teacher
3. Assign them to a classroom and subject
4. Click **Save**

A teacher can be assigned to multiple classrooms and subjects. They will only see the classrooms and subjects assigned to them when recording attendance.

---

## 4. Alerts

Click **Alerts** in the sidebar to view all risk alerts across the school. You can see alerts from all classrooms, filter by status, and monitor whether Form Masters are reviewing them.

---

## 5. Cases

Click **Cases** in the sidebar to view all intervention cases across the school. Cases escalated to administration appear here with an **Escalated to Admin** status. When a Form Master escalates a case, you receive an email notification automatically.

---

## 6. Students

Click **Students** in the sidebar to view all students across the school with their risk levels and attendance rates.

---

## 7. Reports

Click **Reports** in the sidebar to view school-wide analytics including:
- Attendance rates by classroom
- Risk distribution across the school
- Intervention case summaries
- Trend data over time

---

## 8. Audit Logs

Click **Audit Logs** in the sidebar to view a complete log of all significant actions taken in the system, including:
- User logins and logouts
- Attendance submissions
- Case creations, updates, and escalations
- Alert status changes
- User account changes

Audit logs are retained for 7 years as required by school policy. You can filter by date range, user, and action type.

---

## 9. Timetable

Click **Timetable** in the sidebar to manage the school's period schedule. This defines the periods available when teachers record attendance (Period 1–6, Morning Session, Afternoon Session).

---

## 10. System Settings

Click **System Settings** in the sidebar to configure school-wide settings including security policies.

---

## 11. Password Policy

All passwords in the system must meet the following requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (e.g. `!`, `@`, `#`, `$`)

Example of a valid password: `School2024!`

When creating users, set an initial password that meets this policy and instruct the user to change it on first login.

---

## 12. Two-Factor Authentication (2FA)

2FA is **mandatory for administrators** and optional for teachers and form masters.

### Setting Up 2FA for Your Account

1. Click **My Profile** in the sidebar
2. Go to the Security section
3. Click **Enable 2FA**
4. A QR code appears — scan it with Google Authenticator or Microsoft Authenticator on your phone
5. Enter the 6-digit code shown in the app to confirm setup
6. 2FA is now active on your account

### If a User Loses Access to Their 2FA App

You can disable 2FA for a user via the Django admin panel at `/admin/` using a superuser account. Navigate to the user's record and clear their 2FA configuration.

---

## 13. Logging Out

Click **Logout** at the bottom of the sidebar. Sessions expire automatically after 1 hour of inactivity, with a 5-minute warning before expiry.

---

## 14. Common Problems

| Problem | What to do |
|---|---|
| Teacher cannot see their class | Check that a Teaching Assignment exists for that teacher, classroom, and subject in Governance |
| Form Master sees no students | Check that students are enrolled in their classroom and the classroom has the correct Form Master assigned |
| User cannot log in | Check their account is Active in User Management; reset their password if needed |
| Escalation email not received | Check your spam folder; verify the system email settings in the backend `.env` file |
| Audit log entry missing | Only actions through the web interface are logged; direct database changes are not captured |

---

## 15. Data Privacy and Compliance

As administrator you have access to all student data in the system. You are responsible for ensuring:
- User accounts are created only for authorised school staff
- Accounts of staff who leave the school are disabled promptly
- Student data is not shared outside the school without appropriate authorisation
- The system is used in accordance with your school's data protection policy

Audit logs provide a complete record of all system activity and are available for inspection if required.
