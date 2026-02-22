# Email Validation - Quick Reference

## What Changed

### users/serializers.py - UserSerializer

**Added 3 Security Features:**

1. **Email Format Validation**
   ```python
   email = serializers.EmailField(required=True, validators=[EmailValidator()])
   ```

2. **Email Normalization**
   ```python
   normalized_email = value.lower().strip()
   ```

3. **Case-Insensitive Uniqueness**
   ```python
   if User.objects.filter(email__iexact=normalized_email).exists():
       raise serializers.ValidationError("A user with this email already exists.")
   ```

## Test It

```bash
# Run email validation tests
pytest tests/test_user_email_validation.py -v

# Expected: 8 tests pass
```

## Examples

| Input Email | Normalized To | Status |
|------------|---------------|--------|
| `Test@SCHOOL.com` | `test@school.com` | ✅ Accepted |
| `  admin@school.com  ` | `admin@school.com` | ✅ Accepted |
| `ADMIN@SCHOOL.COM` (if admin@school.com exists) | - | ❌ Rejected (duplicate) |
| `not-an-email` | - | ❌ Rejected (invalid format) |
| `` (empty) | - | ❌ Rejected (required) |

## Files Modified

- ✅ `users/serializers.py` - Added validation
- ✅ `tests/test_user_email_validation.py` - Added tests (8 tests)
- ✅ `EMAIL_VALIDATION_FIX_SUMMARY.md` - Full documentation

## No Breaking Changes

- Existing users unaffected
- UserManager already normalizes (defense in depth)
- Backward compatible
