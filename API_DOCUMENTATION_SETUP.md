# Step 4: API Documentation Setup

## Installation

```bash
cd school_support_backend
pip install drf-spectacular
```

## Access API Documentation

After starting the Django server:

```bash
python manage.py runserver
```

### 1. Swagger UI (Interactive)
**URL:** http://127.0.0.1:8000/api/docs/

**Features:**
- Interactive API testing
- Try out endpoints directly
- See request/response examples
- Authentication support

### 2. ReDoc (Clean Documentation)
**URL:** http://127.0.0.1:8000/api/redoc/

**Features:**
- Clean, readable documentation
- Search functionality
- Code examples
- Better for reading/reference

### 3. OpenAPI Schema (JSON)
**URL:** http://127.0.0.1:8000/api/schema/

**Features:**
- Raw OpenAPI 3.0 schema
- Import into Postman/Insomnia
- Generate client SDKs

## What You'll See

### Swagger UI Screenshot:
```
┌─────────────────────────────────────────────────┐
│ School Early Warning Support System API        │
│ Version 1.0.0                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📁 Authentication                               │
│   POST /api/auth/login/                         │
│   POST /api/auth/refresh/                       │
│                                                 │
│ 📁 Dashboard                                    │
│   GET /api/dashboard/                           │
│                                                 │
│ 📁 Students                                     │
│   GET /api/students/                            │
│   POST /api/students/                           │
│                                                 │
│ 📁 Attendance                                   │
│   GET /api/attendance/                          │
│   POST /api/attendance/                         │
│                                                 │
│ 📁 Alerts                                       │
│   GET /api/alerts/                              │
│   POST /api/alerts/                             │
│                                                 │
│ 📁 Interventions                                │
│   GET /api/interventions/                       │
│   POST /api/interventions/                      │
└─────────────────────────────────────────────────┘
```

## Testing an Endpoint

### Example: Test Login Endpoint

1. Go to http://127.0.0.1:8000/api/docs/
2. Find "Authentication" section
3. Click "POST /api/auth/login/"
4. Click "Try it out"
5. Enter test data:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
6. Click "Execute"
7. See response with JWT tokens

## Benefits

### For Developers:
- ✅ See all available endpoints
- ✅ Test APIs without Postman
- ✅ See request/response formats
- ✅ Understand authentication
- ✅ Copy code examples

### For Frontend Developers:
- ✅ Know exact API structure
- ✅ See all query parameters
- ✅ Understand error responses
- ✅ Test before implementing

### For Documentation:
- ✅ Auto-generated (always up-to-date)
- ✅ Interactive examples
- ✅ Professional appearance
- ✅ Export to PDF/Postman

## Files Modified

1. `requirements.txt` - Added drf-spectacular
2. `settings.py` - Added configuration
3. `urls.py` - Added documentation URLs
4. `dashboard/views.py` - Added API documentation decorators

## Next Steps

1. Install drf-spectacular: `pip install drf-spectacular`
2. Start server: `python manage.py runserver`
3. Visit: http://127.0.0.1:8000/api/docs/
4. Explore and test your APIs!

## Optional: Add More Documentation

To document other views, add decorators:

```python
from drf_spectacular.utils import extend_schema

class MyView(APIView):
    @extend_schema(
        tags=['MyTag'],
        summary='Short description',
        description='Detailed description',
    )
    def get(self, request):
        # Your code
        pass
```

This is industry standard used by:
- Google APIs
- Stripe API
- GitHub API
- All major SaaS platforms
