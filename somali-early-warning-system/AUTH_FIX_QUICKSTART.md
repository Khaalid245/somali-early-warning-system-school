# 🔧 Authentication Fix - Quick Start Guide

## Problem Summary

You're experiencing authentication errors:
- ❌ 401 Unauthorized on login
- ❌ 400 Bad Request on 2FA verification  
- ❌ Token is null in AuthContext

## ✅ Solution (5 Minutes)

### Step 1: Create Test Users

Open a terminal in the backend directory:

```bash
cd school_support_backend
python manage.py shell < create_test_users.py
```

This will create 3 test accounts:
- **Admin:** admin@school.edu / Admin@123
- **Teacher:** teacher@school.edu / Teacher@123
- **Form Master:** formmaster@school.edu / FormMaster@123

### Step 2: Clear Browser Data

1. Open your browser DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data**
4. Refresh the page

### Step 3: Test Login

1. Go to http://localhost:5173/login
2. Try logging in with:
   - **Email:** admin@school.edu
   - **Password:** Admin@123

You should now be able to login successfully! ✅

## 🔍 Diagnostic Tools

### Check Existing Users

```bash
cd school_support_backend
python manage.py shell < check_users.py
```

This will show:
- All users in database
- Their roles and status
- Test authentication

### Manual User Creation

If the script doesn't work, create users manually:

```bash
python manage.py shell
```

```python
from users.models import User

# Create admin
User.objects.create_user(
    email='admin@school.edu',
    password='Admin@123',
    name='Admin User',
    role='admin',
    is_staff=True,
    is_active=True
)
```

## 🐛 Debugging

### Frontend Console (F12)

You should now see detailed logs:
```
[Login] Attempting login with: { email: '...', hasPassword: true }
[Login] Response status: 200
[AuthContext] Storing tokens
[AuthContext] Token decoded successfully
```

### Backend Console

Watch for authentication attempts:
```
POST /api/auth/login/ 200 OK
```

### Common Issues

**"No users found"**
- Run `create_test_users.py` script
- Or create users via Django admin

**"Authentication failed"**
- Check password is correct
- Verify user is active
- Check database connection

**"2FA required"**
- Disable 2FA for testing:
  ```python
  user = User.objects.get(email='admin@school.edu')
  user.two_factor_enabled = False
  user.save()
  ```

## 📝 What Was Fixed

1. **Added console logging** to track authentication flow
2. **Improved error handling** in login and 2FA verification
3. **Created diagnostic scripts** to check user accounts
4. **Added user creation scripts** for quick setup

## 🎯 Next Steps

After successful login:

1. ✅ Navigate to your role-specific dashboard
2. ✅ Create additional users via Admin Dashboard
3. ✅ Set up 2FA if needed (optional)
4. ✅ Start using the system!

## 📚 Full Documentation

For detailed troubleshooting, see:
- `AUTH_TROUBLESHOOTING.md` - Complete troubleshooting guide
- `check_users.py` - User diagnostic script
- `create_test_users.py` - Quick user creation

## 💡 Tips

- **Password Requirements:** 8+ chars, uppercase, lowercase, digit, special char
- **2FA:** Optional, can be enabled in user settings
- **Roles:** Admin (full access), Teacher (attendance), Form Master (classroom management)

## ❓ Still Having Issues?

1. Check both frontend and backend console logs
2. Run the diagnostic script: `python manage.py shell < check_users.py`
3. Verify MySQL is running
4. Check migrations: `python manage.py migrate`
5. Review `AUTH_TROUBLESHOOTING.md` for detailed help

---

**Quick Test:**
```bash
# Backend
cd school_support_backend
python manage.py shell < create_test_users.py
python manage.py runserver

# Frontend (new terminal)
cd school_support_frontend  
npm run dev

# Browser
# Go to http://localhost:5173/login
# Login with: admin@school.edu / Admin@123
```

✅ You should now be able to login successfully!
