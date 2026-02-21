# Governance Tabs Test Guide

## How to Access All Admin Features

### 1. Login as Admin
- Go to: http://localhost:5173/
- Login with admin credentials

### 2. Navigate to Governance
- Click the **⚙️ Governance** tab in the sidebar
- You should see 6 tabs:

## Available Governance Tabs

### 📋 **Users Tab** (User Management)
- ✅ Create users (Admin, Form Master, Teacher)
- ✅ Edit user details
- ✅ Disable/Enable users
- ✅ Filter by role
- ✅ Toggle to show/hide disabled users

### 🏫 **Classrooms Tab** (Classroom Management)  
- ✅ Create classrooms
- ✅ Assign form masters
- ✅ Edit classroom details
- ✅ Toggle to show/hide inactive classrooms

### 👥 **Students Tab** (Student Management)
- ✅ Add new students
- ✅ View all students
- ✅ Student details (admission number, name, gender)

### 📚 **Subjects Tab** (Subject Management)
- ✅ Add new subjects
- ✅ View all subjects
- ✅ Subject management

### 📝 **Enrollments Tab** (Student Enrollment)
- ✅ Enroll students in classrooms
- ✅ View all enrollments
- ✅ Track academic year progression

### 👨‍🏫 **Teachers Tab** (Teacher Assignment)
- ✅ Assign teachers to classes
- ✅ Assign subjects to teachers
- ✅ View all teaching assignments

## Test Workflow

### Step 1: Create Basic Data
1. **Subjects Tab**: Add subjects (Math, English, Science)
2. **Users Tab**: Create form masters and teachers
3. **Classrooms Tab**: Create classrooms and assign form masters
4. **Students Tab**: Add students

### Step 2: Manage Enrollments
1. **Enrollments Tab**: Enroll students in classrooms
2. **Teachers Tab**: Assign teachers to classes and subjects

### Step 3: Verify Data
- Check that all data appears correctly
- Test the filter toggles
- Verify relationships (form master → classroom, student → enrollment)

## Troubleshooting

### If tabs don't appear:
1. Clear browser cache (Ctrl+Shift+R)
2. Check browser console for errors (F12)
3. Verify you're logged in as admin
4. Restart frontend server

### If data doesn't save:
1. Check backend server is running (port 8000)
2. Check API endpoints in browser network tab
3. Verify database connection

## Quick Commands

```bash
# Start backend
cd school_support_backend
python manage.py runserver

# Start frontend  
cd school_support_frontend
npm run dev
```

## Expected Result
All 6 governance tabs should be fully functional with create, read, update operations for complete school management.