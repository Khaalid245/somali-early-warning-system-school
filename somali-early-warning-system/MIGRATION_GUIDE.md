# Settings Page Migration Guide

## 🎯 Goal
Upgrade your School Early Warning System to include full user profile management with image uploads, password changes, and profile updates.

---

## ⏱️ Estimated Time: 10 minutes

---

## 📋 Prerequisites

- Python 3.11+ installed
- Node.js 18+ installed
- MySQL server running
- Backend and frontend already set up
- Virtual environment activated

---

## 🔧 Step-by-Step Migration

### Step 1: Install Pillow (2 minutes)

```bash
# Navigate to backend directory
cd school_support_backend

# Activate virtual environment (if not already activated)
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Mac/Linux

# Install Pillow for image processing
pip install Pillow

# Update requirements.txt
pip freeze > requirements.txt
```

**Expected Output:**
```
Successfully installed Pillow-10.x.x
```

---

### Step 2: Create Media Directories (1 minute)

```bash
# Still in school_support_backend directory
mkdir media
mkdir media\profile_images
```

**Verify:**
```
school_support_backend/
├── media/
│   └── profile_images/
```

---

### Step 3: Create and Run Migrations (3 minutes)

```bash
# Create migrations for the new fields
python manage.py makemigrations users

# Apply migrations to database
python manage.py migrate
```

**Expected Output:**
```
Migrations for 'users':
  users\migrations\0002_user_phone_user_profile_image.py
    - Add field phone to user
    - Add field profile_image to user

Running migrations:
  Applying users.0002_user_phone_user_profile_image... OK
```

**Troubleshooting:**
- If you see "No changes detected", the fields might already exist
- If you see database errors, check MySQL connection in .env file

---

### Step 4: Verify Backend Changes (2 minutes)

```bash
# Start the backend server
python manage.py runserver
```

**Test the endpoints:**

1. Open a new terminal
2. Test change password endpoint:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/change-password/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"old","new_password":"new123456"}'
```

**Expected Response:**
```json
{
  "detail": "Current password is incorrect"
}
```
(This is expected if you used dummy passwords)

---

### Step 5: Start Frontend (1 minute)

```bash
# Open new terminal
cd school_support_frontend

# Start frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 6: Test the Settings Page (5 minutes)

#### 6.1 Login
1. Open browser: http://localhost:5173
2. Login with your teacher account

#### 6.2 Navigate to Settings
1. Click your profile icon (top right)
2. Click "Settings" from dropdown
   - OR navigate directly to: http://localhost:5173/teacher/settings

#### 6.3 Test Profile Image Upload
1. Click the camera icon on the profile picture
2. Select an image file (JPG or PNG)
3. See the preview immediately
4. Click "Update Profile" button
5. Wait for success message: "Profile updated successfully!"
6. Refresh the page
7. Verify image persists

#### 6.4 Test Profile Information Update
1. Change your name
2. Add/update phone number (e.g., "+252 XX XXX XXXX")
3. Click "Update Profile"
4. Wait for success message
5. Verify changes in the navbar

#### 6.5 Test Password Change
1. Scroll to "Change Password" section
2. Enter your current password
3. Enter a new password (min 8 characters)
4. Confirm the new password
5. Click "Change Password"
6. Wait for success message: "Password changed successfully!"
7. Logout
8. Login with the new password
9. Verify login works

---

## ✅ Verification Checklist

### Backend Verification
- [ ] Pillow installed successfully
- [ ] Media directories created
- [ ] Migrations created and applied
- [ ] Backend server starts without errors
- [ ] `/api/auth/change-password/` endpoint exists
- [ ] `/api/users/{id}/` endpoint accepts PATCH requests

### Frontend Verification
- [ ] Settings page loads without errors
- [ ] Profile image upload works
- [ ] Image preview shows immediately
- [ ] Profile update form works
- [ ] Password change form works
- [ ] Success/error messages display
- [ ] Loading states show during API calls
- [ ] Changes persist after page refresh

### Database Verification
```sql
-- Connect to MySQL
mysql -u django_user -p school_support_db

-- Check if new fields exist
DESCRIBE users_user;

-- You should see:
-- phone         | varchar(20)  | YES  |     | NULL
-- profile_image | varchar(100) | YES  |     | NULL
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'PIL'"
**Solution:**
```bash
pip install Pillow
```

### Issue 2: "No such table: users_user"
**Solution:**
```bash
python manage.py migrate
```

### Issue 3: "Permission denied" when uploading image
**Solution:**
```bash
# Windows
icacls media /grant Users:F /T

# Mac/Linux
chmod -R 755 media
```

### Issue 4: Image uploads but doesn't show
**Solution:**
1. Check `settings.py` has `MEDIA_URL` and `MEDIA_ROOT`
2. Check `urls.py` has media file serving
3. Check browser console for CORS errors
4. Verify image file exists in `media/profile_images/`

### Issue 5: "Current password is incorrect" (but it's correct)
**Solution:**
1. Verify you're logged in as the correct user
2. Check if password was recently changed
3. Try resetting password via Django admin

### Issue 6: Frontend shows old profile data
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check if `updateUser` is called in SettingsPage.jsx

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong, you can rollback:

### Rollback Migrations
```bash
# Rollback to previous migration
python manage.py migrate users 0001_initial

# Delete migration file
del users\migrations\0002_user_phone_user_profile_image.py
```

### Restore Original Files
```bash
# Use git to restore original files
git checkout users/models.py
git checkout users/serializers.py
git checkout users/views/users.py
git checkout users/urls_auth.py
git checkout school_support_backend/settings.py
git checkout school_support_backend/urls.py
```

---

## 📊 Before & After Comparison

### Before Migration
- ❌ No profile image support
- ❌ No password change functionality
- ❌ No phone number field
- ❌ Limited profile management

### After Migration
- ✅ Profile image upload with preview
- ✅ Secure password change
- ✅ Phone number field
- ✅ Complete profile management
- ✅ Real-time UI updates
- ✅ Beautiful, responsive design

---

## 🎓 What You've Learned

Through this migration, you've:
1. Extended Django models with new fields
2. Created custom serializers for different use cases
3. Implemented file upload handling
4. Added custom API endpoints
5. Configured media file serving
6. Enhanced React context for state management
7. Integrated frontend with backend APIs

---

## 📚 Next Steps

### Immediate
1. Test all features thoroughly
2. Update user documentation
3. Train users on new features
4. Monitor for any issues

### Short-term
1. Add email verification for email changes
2. Implement notification preferences backend
3. Add profile completion indicator
4. Create activity log

### Long-term
1. Add two-factor authentication
2. Implement social login
3. Add profile visibility settings
4. Create user preferences system

---

## 🎉 Success!

Congratulations! You've successfully upgraded your School Early Warning System with comprehensive user profile management.

Your users can now:
- Upload profile pictures
- Change passwords securely
- Update personal information
- Manage account settings

All with a beautiful, responsive UI and secure backend implementation.

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the error messages in console
3. Check the documentation files:
   - `SETTINGS_UPGRADE_INSTRUCTIONS.md`
   - `SETTINGS_PAGE_FEATURES.md`
   - `QUICK_SETUP_SETTINGS.md`
   - `SETTINGS_IMPLEMENTATION_SUMMARY.md`

---

## 📝 Migration Completion Checklist

- [ ] Pillow installed
- [ ] Media directories created
- [ ] Migrations applied
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Profile image upload tested
- [ ] Profile update tested
- [ ] Password change tested
- [ ] All features working
- [ ] Documentation reviewed

**Date Completed:** _______________
**Completed By:** _______________
**Notes:** _______________

---

**Happy coding! 🚀**
