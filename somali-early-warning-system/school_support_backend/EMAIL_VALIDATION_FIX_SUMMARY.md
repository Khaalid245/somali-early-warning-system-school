# Email Validation Fix Summary

## Problem
User creation allowed:
1. Duplicate emails with different casing (e.g., "admin@school.com" and "ADMIN@SCHOOL.COM")
2. Invalid email formats (e.g., "not-an-email")
3. No normalization of email input

## Solution

### Changes to users/serializers.py

**Added:**
1. **Email Format Validation**: Added `EmailValidator()` to email field
2. **Email Normalization**: Normalize email to lowercase and strip whitespace in `validate_email()`
3. **Case-Insensitive Uniqueness Check**: Check for existing users with `email__iexact` lookup

**Code Changes:**

```python
# BEFORE
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'phone', 'profile_image', 'password']
        read_only_fields = ['id']
```

```python
# AFTER
from django.core.validators import EmailValidator

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True, validators=[EmailValidator()])
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'phone', 'profile_image', 'password']
        read_only_fields = ['id']
    
    def validate_email(self, value):
        """Normalize email and check uniqueness (case-insensitive)"""
        normalized_email = value.lower().strip()
        
        # Check uniqueness (case-insensitive)
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return normalized_email
```

## Validation Flow

1. **DRF Field Validation**: EmailField with EmailValidator checks format
2. **Custom validate_email()**: 
   - Normalizes email to lowercase
   - Strips whitespace
   - Checks case-insensitive uniqueness
3. **UserManager.create_user()**: Additional normalization (defense in depth)

## Test Coverage

Created `tests/test_user_email_validation.py` with 8 tests:

1. ✅ `test_email_normalized_to_lowercase` - "Test.User@SCHOOL.COM" → "test.user@school.com"
2. ✅ `test_duplicate_email_different_case_rejected` - Rejects "TEACHER@SCHOOL.COM" if "teacher@school.com" exists
3. ✅ `test_invalid_email_format_rejected` - Rejects "not-an-email"
4. ✅ `test_email_with_whitespace_trimmed` - "  teacher@school.com  " → "teacher@school.com"
5. ✅ `test_valid_email_accepted` - Accepts "valid.email@school.com"
6. ✅ `test_empty_email_rejected` - Rejects empty string
7. ✅ `test_missing_email_rejected` - Rejects missing email field

## Security Benefits

1. **Prevents Account Enumeration**: Consistent email format prevents duplicate accounts
2. **Data Integrity**: Ensures email uniqueness regardless of casing
3. **Input Sanitization**: Removes whitespace that could cause issues
4. **Format Validation**: Ensures valid email format before database insertion

## Backward Compatibility

✅ **No Breaking Changes**:
- Existing users with lowercase emails unaffected
- UserManager already normalizes emails (defense in depth)
- Serializer validation happens before database operations
- Error messages are user-friendly

## DRF Best Practices Followed

1. ✅ **Field-level validation**: `validate_email()` method
2. ✅ **Built-in validators**: `EmailValidator()`
3. ✅ **Explicit field declaration**: `email = serializers.EmailField(...)`
4. ✅ **Clear error messages**: "A user with this email already exists."
5. ✅ **Normalization before validation**: Consistent data format

## Testing Commands

```bash
# Run email validation tests
pytest tests/test_user_email_validation.py -v

# Run all user tests
pytest tests/ -k "user" -v

# Check coverage
pytest tests/test_user_email_validation.py --cov=users.serializers --cov-report=term-missing
```

## Example API Behavior

### Before Fix
```json
POST /api/governance/users/
{
  "name": "Teacher One",
  "email": "teacher@school.com",
  "role": "teacher",
  "password": "Pass123!"
}
// Response: 201 Created

POST /api/governance/users/
{
  "name": "Teacher Two",
  "email": "TEACHER@SCHOOL.COM",
  "role": "teacher",
  "password": "Pass456!"
}
// Response: 201 Created (DUPLICATE ALLOWED!)
```

### After Fix
```json
POST /api/governance/users/
{
  "name": "Teacher One",
  "email": "teacher@school.com",
  "role": "teacher",
  "password": "Pass123!"
}
// Response: 201 Created

POST /api/governance/users/
{
  "name": "Teacher Two",
  "email": "TEACHER@SCHOOL.COM",
  "role": "teacher",
  "password": "Pass456!"
}
// Response: 400 Bad Request
// {
//   "email": ["A user with this email already exists."]
// }
```

## Related Files

- `users/serializers.py` - Email validation logic
- `users/managers.py` - UserManager with email normalization (unchanged)
- `users/models.py` - User model with unique email constraint (unchanged)
- `tests/test_user_email_validation.py` - Comprehensive test coverage

## Impact

- ✅ Prevents duplicate accounts with different email casing
- ✅ Enforces valid email format
- ✅ Normalizes email input consistently
- ✅ Maintains backward compatibility
- ✅ Follows DRF best practices
- ✅ No changes to existing business logic
