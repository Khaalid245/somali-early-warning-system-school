# Settings Page Features

## Overview
The Settings Page provides comprehensive user profile management and account customization options.

## Features Implemented

### 1. Profile Picture Management
- **Upload Profile Image**: Click camera icon to upload a new profile picture
- **Image Preview**: Real-time preview before saving
- **Size Validation**: Maximum 5MB file size
- **Supported Formats**: All common image formats (JPG, PNG, GIF, etc.)
- **Default Avatar**: Shows first letter of name if no image uploaded

### 2. Profile Information
- **Full Name**: Update your display name
- **Email Address**: View/update email (read-only for security)
- **Phone Number**: Add or update phone number (optional)
- **Auto-save**: Changes saved when you click "Update Profile"

### 3. Password Management
- **Change Password**: Secure password change functionality
- **Current Password Verification**: Must enter current password
- **Password Confirmation**: New password must be entered twice
- **Validation**: Minimum 8 characters required
- **Security**: Passwords are hashed and never stored in plain text

### 4. Notification Preferences (UI Ready)
- **Email Notifications**: Toggle email alerts on/off
- **Dashboard Notifications**: Toggle in-app notifications
- **Note**: Backend integration pending

### 5. Account Actions
- **Back to Dashboard**: Quick navigation to main dashboard
- **Logout**: Secure logout with token blacklisting

## User Interface

### Layout
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Grid Layout**: 2-column layout on large screens, single column on mobile
- **Card-based UI**: Clean, organized sections

### Visual Elements
- Profile picture with camera icon overlay
- Form inputs with focus states
- Loading states for async operations
- Success/error toast notifications

## API Integration

### Endpoints Used
1. `PATCH /api/users/{user_id}/` - Update profile
2. `POST /api/auth/change-password/` - Change password
3. `POST /api/auth/logout/` - Logout

### Data Flow
1. User makes changes in form
2. Frontend validates input
3. API request sent with authentication token
4. Backend validates and processes
5. Success/error message displayed
6. UI updates with new data

## Security Features

### Authentication
- JWT token required for all operations
- Users can only update their own profile
- Admin override available for user management

### Validation
- Client-side validation (immediate feedback)
- Server-side validation (security enforcement)
- Password strength requirements
- File type and size restrictions

### Data Protection
- Passwords hashed with Django's built-in hasher
- Profile images stored securely
- No sensitive data in URLs or logs

## User Experience

### Success Scenarios
- ✅ Profile updated successfully
- ✅ Password changed successfully
- ✅ Image uploaded successfully

### Error Handling
- ❌ Current password incorrect
- ❌ New passwords don't match
- ❌ Password too short
- ❌ Image file too large
- ❌ Network error

### Loading States
- Buttons show "Updating..." or "Changing..." during API calls
- Disabled state prevents double-submission
- Spinner for async operations

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- High contrast for readability
- Focus indicators on interactive elements

## Future Enhancements

### Planned Features
1. **Two-Factor Authentication**: Add 2FA for extra security
2. **Email Verification**: Verify email changes
3. **Activity Log**: View recent account activity
4. **Privacy Settings**: Control data visibility
5. **Theme Preferences**: Light/dark mode toggle
6. **Language Selection**: Multi-language support
7. **Notification Settings Backend**: Save preferences to database
8. **Account Deletion**: Self-service account deletion

### Integration Opportunities
- Connect with school directory
- Sync with calendar for availability
- Link to teaching schedule
- Integration with messaging system

## Technical Details

### Frontend Stack
- React with Hooks (useState, useContext, useRef)
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend Stack
- Django REST Framework
- JWT Authentication
- MySQL Database
- Pillow for image processing

### File Structure
```
Frontend: src/teacher/SettingsPage.jsx
Backend: users/views/users.py
Models: users/models.py
Serializers: users/serializers.py
URLs: users/urls_auth.py
```

## Usage Guide

### For Users
1. Click your profile icon in navbar
2. Select "Settings" from dropdown
3. Make desired changes
4. Click "Update Profile" or "Change Password"
5. Wait for confirmation message

### For Developers
1. Import SettingsPage component
2. Ensure user is authenticated
3. AuthContext provides user data
4. API client handles authentication headers
5. Toast notifications show feedback

## Testing Checklist

- [ ] Upload profile image
- [ ] Update name
- [ ] Update phone number
- [ ] Change password with correct current password
- [ ] Try changing password with wrong current password
- [ ] Try uploading image > 5MB
- [ ] Test on mobile device
- [ ] Test with slow network
- [ ] Test logout functionality
- [ ] Test navigation back to dashboard

## Support

For issues or questions:
- Check browser console for errors
- Verify backend server is running
- Ensure database migrations are applied
- Check API endpoint availability
- Review authentication token validity
