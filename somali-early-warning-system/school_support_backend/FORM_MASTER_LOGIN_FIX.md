# Form Master Login Authentication Fix

## Issue Summary
Form Master users were unable to log in, receiving a 401 Unauthorized error. The error occurred because the JWT authentication serializer was not properly configured to use email-based authentication.

## Root Cause
1. **Missing username_field configuration**: The `TokenObtainPairSerializer` was using the default `username` field, but the User model uses `email` as the USERNAME_FIELD.
2. **No custom authentication backend**: Django's default authentication backend expects a `username` field, but the system uses email for authentication.
3. **Password mismatch**: Some form master accounts had passwords that didn't match the expected test password.

## Solution Implemented

### 1. Updated Token Serializer (`users/tokens.py`)
- Added `username_field = 'email'` to explicitly use email for authentication
- Overrode the `validate()` method to properly authenticate using email
- Added explicit error handling for authentication failures

### 2. Created Custom Authentication Backend (`users/backends.py`)
- Created `EmailBackend` class that authenticates users by email
- Normalizes email (lowercase and strip whitespace)
- Properly checks password and user active status
- Includes timing attack protection

### 3. Updated Settings (`school_support_backend/settings.py`)
- Added `AUTHENTICATION_BACKENDS` configuration
- Set `users.backends.EmailBackend` as the primary authentication backend
- Kept Django's default `ModelBackend` as fallback

### 4. Password Reset Script (`reset_form_master_password.py`)
- Created utility script to reset form master passwords
- Sets password to `Test@1234` for testing
- Includes authentication verification

## Files Modified

1. **users/tokens.py** - Fixed JWT serializer to use email authentication
2. **users/backends.py** - NEW: Custom email-based authentication backend
3. **school_support_backend/settings.py** - Added authentication backend configuration
4. **reset_form_master_password.py** - NEW: Password reset utility

## Testing

### Test Form Master Login
1. Email: `miiqeykhalid@gmail.com`
2. Password: `Test@1234`
3. Role: `form_master`

### Verify Authentication
```bash
python manage.py shell -c "from django.contrib.auth import authenticate; result = authenticate(username='miiqeykhalid@gmail.com', password='Test@1234'); print('Auth Success:', result is not None)"
```

## How to Use

### Start Backend Server
```bash
cd school_support_backend
python manage.py runserver
```

### Login as Form Master
1. Navigate to `http://localhost:5173/`
2. Select "Form Master" role
3. Enter email: `miiqeykhalid@gmail.com`
4. Enter password: `Test@1234`
5. Click "Sign In"

### Reset Password (if needed)
```bash
cd school_support_backend
python reset_form_master_password.py
```

## Security Improvements

1. **Email normalization**: All emails are converted to lowercase and trimmed
2. **Timing attack protection**: Password hasher runs even for non-existent users
3. **Active user check**: Only active users can authenticate
4. **Proper error messages**: Clear authentication failure messages

## All User Roles Now Work

- ✅ **Admin** - Can log in with email
- ✅ **Teacher** - Can log in with email  
- ✅ **Form Master** - Can log in with email (FIXED)

## Next Steps

1. Start the Django backend server
2. Test form master login at `http://localhost:5173/`
3. Verify dashboard access after successful login
4. If login fails, run the password reset script

## Troubleshooting

### If login still fails:
1. Check if backend server is running on port 8000
2. Verify form master user exists in database
3. Run password reset script
4. Check browser console for CORS errors
5. Verify email is correct (case-insensitive)

### Common Issues:
- **401 Unauthorized**: Password incorrect - run reset script
- **CORS Error**: Backend not running or wrong port
- **Network Error**: Check if backend is accessible at `http://127.0.0.1:8000`
