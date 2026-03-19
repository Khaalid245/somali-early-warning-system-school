# VALIDATION TESTING GUIDE
# How to Verify Validation is Working (For Screenshots)

## 🧪 AUTOMATED VALIDATION TEST

### Run the Test Script:
```bash
cd school_support_backend
python test_validation.py
```

**Expected Output:**
- ✅ Password validation results (5 tests)
- ✅ XSS sanitization results (6 tests)
- ✅ Email validation results (5 tests)
- ✅ Field length validation results (4 tests)

**Screenshot this output for your report!**

---

## 🖱️ MANUAL VALIDATION TESTING (Frontend)

### Test 1: Password Validation (Login/Registration)

**Steps:**
1. Go to user registration page (Admin dashboard → Create User)
2. Try these passwords:

| Password | Expected Result |
|----------|----------------|
| `weak` | ❌ Error: "Password must be at least 8 characters" |
| `password` | ❌ Error: "Password must contain uppercase/digit/special" |
| `Password1` | ❌ Error: "Password must contain special character" |
| `Pass123!` | ✅ Accepted |

**Screenshot:** Error messages showing validation

---

### Test 2: Email Validation

**Steps:**
1. Go to user creation form
2. Try these emails:

| Email | Expected Result |
|-------|----------------|
| `invalid-email` | ❌ Error: "Enter a valid email" |
| `test@` | ❌ Error: "Enter a valid email" |
| `valid@email.com` | ✅ Accepted |
| `UPPER@EMAIL.COM` | ✅ Accepted (normalized to lowercase) |

**Screenshot:** Email validation errors

---

### Test 3: XSS Prevention

**Steps:**
1. Go to any text input field (e.g., student name, remarks)
2. Try entering: `<script>alert('XSS')</script>`
3. Submit the form
4. Check the saved data - script tags should be removed

**Expected:** Text is sanitized, no script execution

**Screenshot:** Before/after sanitization

---

### Test 4: Field Length Validation

**Steps:**
1. Go to student creation form
2. Try entering:
   - Name with 1 character: ❌ Error
   - Name with 2 characters: ✅ Accepted
   - Name with 101 characters: ❌ Error

**Screenshot:** Length validation errors

---

### Test 5: Rate Limiting

**Steps:**
1. Go to login page
2. Enter wrong password 10 times
3. On 11th attempt, you should see: "Too many login attempts. Try again in 15 minutes"

**Screenshot:** Rate limit error message

---

## 🔍 BACKEND VALIDATION TESTING (API)

### Using Postman/Thunder Client:

#### Test 1: Password Validation
```bash
POST http://127.0.0.1:8000/api/users/
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@email.com",
  "role": "teacher",
  "password": "weak"
}
```

**Expected Response:**
```json
{
  "password": [
    "Password must be at least 8 characters long."
  ]
}
```

#### Test 2: Email Validation
```bash
POST http://127.0.0.1:8000/api/users/
Content-Type: application/json

{
  "name": "Test User",
  "email": "invalid-email",
  "role": "teacher",
  "password": "ValidPass123!"
}
```

**Expected Response:**
```json
{
  "email": [
    "Enter a valid email address."
  ]
}
```

#### Test 3: XSS Sanitization
```bash
POST http://127.0.0.1:8000/api/users/
Content-Type: application/json

{
  "name": "<script>alert('XSS')</script>",
  "email": "test@email.com",
  "role": "teacher",
  "password": "ValidPass123!"
}
```

**Expected:** Name is sanitized (script tags removed)

---

## 📸 SCREENSHOTS TO TAKE FOR REPORT

1. **Automated Test Output** - Run `python test_validation.py`
2. **Password Validation Error** - Frontend form showing password requirements
3. **Email Validation Error** - Frontend form showing invalid email
4. **XSS Prevention** - Before/after sanitization
5. **Rate Limiting** - Login page showing "too many attempts" message
6. **API Validation Response** - Postman showing validation error JSON

---

## ✅ VALIDATION CHECKLIST

- [ ] Password strength validation working
- [ ] Email format validation working
- [ ] XSS sanitization working
- [ ] Field length validation working
- [ ] Rate limiting working
- [ ] Database constraints working
- [ ] API returns proper error messages
- [ ] Frontend shows user-friendly errors

---

## 🎯 FOR YOUR DEFENSE

**When asked "How do you know validation is working?"**

Answer:
1. "I ran automated validation tests (show test_validation.py output)"
2. "I manually tested with invalid inputs (show screenshots)"
3. "I tested XSS attacks and they were blocked (show sanitization)"
4. "I tested rate limiting by attempting multiple logins (show error)"
5. "All validation errors return user-friendly messages"

**Key Point:** "Validation happens at 3 layers: Frontend (user experience), Backend (security), and Database (data integrity)"
