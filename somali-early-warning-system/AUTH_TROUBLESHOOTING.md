# Authentication Issues - Troubleshooting Guide

## Issues Identified

1. **401 Unauthorized on `/api/auth/login/`** - Login credentials are failing
2. **400 Bad Request on `/api/auth/2fa/verify/`** - 2FA verification is failing
3. **Token is null in AuthContext** - No authentication token is being stored

## Root Causes

### Most Likely Cause: No User Accounts Exist
The database might not have any user accounts created yet.

### Other Possible Causes:
- Wrong email/password being used
- User account is inactive (`is_active=False`)
- 2FA is enabled but not properly configured
- Password not set correctly in database

## Solutions

### Step 1: Check if Users Exist

Run the diagnostic script:

```bash
cd school_support_backend
python manage.py shell < check_users.py
```

This will show you:
- All users in the database
- Their roles and status
- Whether 2FA is enabled
- Test authentication with credentials

### Step 2: Create a Test User (if none exist)

#### Option A: Using Django Admin
```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user.

#### Option B: Using Django Shell
```bash
python manage.py shell
```

Then run:
```python
from users.models import User

# Create an admin user
admin = User.objects.create_user(
    email='admin@school.edu',
    password='Admin@123',
    name='System Administrator',
    role='admin',
    is_staff=True,
    is_active=True
)
print(f"Created admin: {admin.email}")

# Create a teacher user
teacher = User.objects.create_user(
    email='teacher@school.edu',
    password='Teacher@123',
    name='John Teacher',
    role='teacher',
    is_active=True
)
print(f"Created teacher: {teacher.email}")

# Create a form master user
form_master = User.objects.create_user(
    email='formmaster@school.edu',
    password='FormMaster@123',
    name='Jane FormMaster',
    role='form_master',
    is_active=True
)
print(f"Created form master: {form_master.email}")
```

### Step 3: Test Login

Try logging in with one of these accounts:

**Admin:**
- Email: `admin@school.edu`
- Password: `Admin@123`

**Teacher:**
- Email: `teacher@school.edu`
- Password: `Teacher@123`

**Form Master:**
- Email: `formmaster@school.edu`
- Password: `FormMaster@123`

### Step 4: Disable 2FA (if causing issues)

If 2FA is enabled and causing problems:

```bash
python manage.py shell
```

```python
from users.models import User

# Disable 2FA for a specific user
user = User.objects.get(email='admin@school.edu')
user.two_factor_enabled = False
user.two_factor_secret = None
user.save()
print(f"2FA disabled for {user.email}")
```

### Step 5: Check Backend Logs

Look at the Django console output when you try to login. You should see:
- Request received
- Authentication attempt
- Success or failure reason

### Step 6: Check Frontend Console

Open browser DevTools (F12) and check the Console tab. You should now see:
- `[Login] Attempting login with: { email: '...', hasPassword: true }`
- `[Login] Response status: ...`
- Any error messages

## Common Error Messages

### "Invalid email or password"
- User doesn't exist in database
- Wrong password
- Account is inactive

### "2FA not enabled for this account"
- Trying to verify 2FA for a user who doesn't have it enabled
- Email mismatch between login and 2FA verify

### "Invalid code"
- Wrong 2FA code entered
- Time sync issue (check system clock)
- 2FA secret not properly configured

### "User not found"
- Email doesn't exist in database
- Typo in email address

## Testing the Fix

1. **Clear browser cache and sessionStorage:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage → Clear site data

2. **Restart both servers:**
   ```bash
   # Backend
   cd school_support_backend
   python manage.py runserver

   # Frontend (new terminal)
   cd school_support_frontend
   npm run dev
   ```

3. **Try logging in** with the test credentials

4. **Check console logs** in both frontend and backend

## Additional Debugging

### Enable Django Debug Mode

In `school_support_backend/school_support_backend/settings.py`:
```python
DEBUG = True
```

### Check Database Connection

```bash
python manage.py dbshell
```

Then:
```sql
SELECT email, name, role, is_active, two_factor_enabled FROM users_user;
```

### Test API Directly

Using curl or Postman:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"Admin@123"}'
```

## Code Changes Made

1. **Login.jsx** - Added console logging for debugging
2. **TwoFactorModal.jsx** - Added console logging for 2FA verification
3. **AuthContext.jsx** - Added error handling and logging for token storage
4. **check_users.py** - Created diagnostic script

## Next Steps

After fixing the authentication:

1. ✅ Verify you can login successfully
2. ✅ Check that tokens are stored in sessionStorage
3. ✅ Verify navigation to correct dashboard based on role
4. ✅ Test 2FA flow if enabled
5. ✅ Create additional users via Admin Dashboard

## Need More Help?

If issues persist:
1. Share the console logs from both frontend and backend
2. Run the diagnostic script and share output
3. Check if MySQL service is running
4. Verify database migrations are up to date: `python manage.py migrate`
