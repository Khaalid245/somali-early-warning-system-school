# Settings Page Upgrade Instructions

## Changes Made

### 1. Backend Changes

#### User Model (`users/models.py`)
- Added `phone` field (CharField, optional)
- Added `profile_image` field (ImageField, optional)

#### Serializers (`users/serializers.py`)
- Updated `UserSerializer` to include `phone` and `profile_image`
- Added `UserUpdateSerializer` for profile updates
- Added `ChangePasswordSerializer` for password changes

#### Views (`users/views/users.py`)
- Updated `UserDetailView` to allow users to update their own profile
- Added `ChangePasswordView` for password change functionality

#### URLs (`users/urls_auth.py`)
- Added `/api/auth/change-password/` endpoint

#### Settings (`school_support_backend/settings.py`)
- Added `MEDIA_URL` and `MEDIA_ROOT` configuration
- Updated main `urls.py` to serve media files in development

### 2. Required Steps

#### Step 1: Install Pillow (for image handling)
```bash
pip install Pillow
```

#### Step 2: Create and run migrations
```bash
python manage.py makemigrations users
python manage.py migrate
```

#### Step 3: Create media directory
```bash
mkdir media
mkdir media\profile_images
```

#### Step 4: Update requirements.txt
Add `Pillow` to your requirements.txt file

### 3. API Endpoints Available

#### Update Profile
```
PATCH /api/users/{user_id}/
Content-Type: multipart/form-data

Fields:
- name (string)
- email (string)
- phone (string, optional)
- profile_image (file, optional)
```

#### Change Password
```
POST /api/auth/change-password/
Content-Type: application/json

Body:
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

### 4. Frontend Integration

The frontend `SettingsPage.jsx` already has all the UI components ready:
- ✅ Profile image upload with preview
- ✅ Profile information form (name, email, phone)
- ✅ Change password form
- ✅ Notification preferences (UI only, backend not implemented)
- ✅ Account actions (logout, back to dashboard)

### 5. Testing

1. Start the backend server:
```bash
python manage.py runserver
```

2. Navigate to Settings page in the frontend
3. Test uploading a profile image
4. Test updating profile information
5. Test changing password

### 6. Security Notes

- Users can only update their own profile (enforced in backend)
- Password validation is enforced (minimum 8 characters)
- Profile images are limited to 5MB (enforced in frontend)
- Images are stored in `media/profile_images/` directory

### 7. Production Considerations

For production deployment:
- Use cloud storage (AWS S3, Azure Blob) for media files
- Configure `DEFAULT_FILE_STORAGE` in settings
- Set up proper CORS for media file access
- Enable HTTPS for secure file uploads
