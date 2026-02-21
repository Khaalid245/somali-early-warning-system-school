# Quick Setup Guide - Settings Page Improvements

## What Was Improved?

Your Settings Page now supports:
✅ Profile image upload
✅ Change password
✅ Update profile information (name, email, phone)
✅ Notification preferences (UI ready)
✅ Secure user authentication

## Setup Steps (5 minutes)

### Step 1: Install Required Package
```bash
cd school_support_backend
pip install Pillow
```

### Step 2: Create Media Directories
```bash
mkdir media
mkdir media\profile_images
```

### Step 3: Run Database Migrations
```bash
python manage.py makemigrations users
python manage.py migrate
```

### Step 4: Start Backend Server
```bash
python manage.py runserver
```

### Step 5: Test the Settings Page
1. Open frontend: http://localhost:5173
2. Login as a teacher
3. Click profile icon → Settings
4. Try uploading a profile image
5. Try changing your password
6. Try updating your profile info

## API Endpoints Added

### 1. Update Profile
```
PATCH http://127.0.0.1:8000/api/users/{user_id}/
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- name: "John Doe"
- email: "john@school.com"
- phone: "+252 XX XXX XXXX"
- profile_image: [file]
```

### 2. Change Password
```
POST http://127.0.0.1:8000/api/auth/change-password/
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "current_password": "oldpass123",
  "new_password": "newpass123"
}
```

## Testing Checklist

### Profile Image Upload
- [ ] Click camera icon on profile picture
- [ ] Select an image file
- [ ] See preview immediately
- [ ] Click "Update Profile"
- [ ] See success message
- [ ] Refresh page - image should persist

### Change Password
- [ ] Enter current password
- [ ] Enter new password (min 8 chars)
- [ ] Confirm new password
- [ ] Click "Change Password"
- [ ] See success message
- [ ] Logout and login with new password

### Update Profile Info
- [ ] Change your name
- [ ] Add/update phone number
- [ ] Click "Update Profile"
- [ ] See success message
- [ ] Check if changes persist

## Troubleshooting

### Issue: "Pillow not installed"
**Solution:**
```bash
pip install Pillow
```

### Issue: "No such table: users_user"
**Solution:**
```bash
python manage.py migrate
```

### Issue: "Permission denied" when uploading image
**Solution:**
```bash
# Make sure media directory exists and is writable
mkdir media
mkdir media\profile_images
```

### Issue: "Current password is incorrect"
**Solution:**
- Make sure you're entering the correct current password
- Password is case-sensitive

### Issue: Image not showing after upload
**Solution:**
- Check if `MEDIA_URL` and `MEDIA_ROOT` are configured in settings.py
- Verify media files are being served (check urls.py)
- Check browser console for CORS errors

## File Changes Summary

### Backend Files Modified:
1. `users/models.py` - Added phone and profile_image fields
2. `users/serializers.py` - Added UserUpdateSerializer and ChangePasswordSerializer
3. `users/views/users.py` - Added ChangePasswordView and updated UserDetailView
4. `users/urls_auth.py` - Added change-password endpoint
5. `school_support_backend/settings.py` - Added MEDIA_URL and MEDIA_ROOT
6. `school_support_backend/urls.py` - Added media file serving

### Frontend Files (Already Complete):
1. `src/teacher/SettingsPage.jsx` - Full settings UI with all features

## Next Steps

### Optional Enhancements:
1. **Add Email Verification**: Verify email when changed
2. **Add 2FA**: Two-factor authentication
3. **Save Notification Preferences**: Store in database
4. **Activity Log**: Show recent account activity
5. **Profile Completion**: Show profile completion percentage

### Production Deployment:
1. Use cloud storage (AWS S3) for images
2. Enable HTTPS for secure uploads
3. Set up CDN for faster image delivery
4. Configure proper CORS settings
5. Add rate limiting for uploads

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all migrations are applied
3. Ensure backend server is running
4. Check API endpoint responses in Network tab
5. Review the SETTINGS_UPGRADE_INSTRUCTIONS.md file

## Success! 🎉

Your settings page is now fully functional with:
- Profile image uploads
- Password management
- Profile information updates
- Beautiful, responsive UI
- Secure authentication

Enjoy your enhanced School Early Warning System!
