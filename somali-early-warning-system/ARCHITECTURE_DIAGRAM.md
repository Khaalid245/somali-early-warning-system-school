# Settings Page Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              SettingsPage.jsx Component                    │  │
│  │                                                             │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Profile   │  │   Profile    │  │     Change      │  │  │
│  │  │    Image    │  │ Information  │  │    Password     │  │  │
│  │  │   Upload    │  │     Form     │  │      Form       │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────┐  ┌──────────────┐                        │  │
│  │  │Notification │  │   Account    │                        │  │
│  │  │ Preferences │  │   Actions    │                        │  │
│  │  └─────────────┘  └──────────────┘                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Uses                              │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  AuthContext.jsx                           │  │
│  │                                                             │  │
│  │  • user (state)                                            │  │
│  │  • login(access, refresh)                                  │  │
│  │  • logout()                                                │  │
│  │  • updateUser(userData)  ← NEW!                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ API Calls                         │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    apiClient.js                            │  │
│  │                                                             │  │
│  │  • Axios instance with JWT interceptor                     │  │
│  │  • Automatic token refresh                                 │  │
│  │  • Error handling                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTP Requests
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Django)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                           │  │
│  │                                                             │  │
│  │  PATCH /api/users/{id}/                                    │  │
│  │  ├─ Update profile (name, email, phone, image)            │  │
│  │  └─ Permission: IsAuthenticated + IsOwner                 │  │
│  │                                                             │  │
│  │  POST /api/auth/change-password/                           │  │
│  │  ├─ Change user password                                   │  │
│  │  └─ Permission: IsAuthenticated                           │  │
│  │                                                             │  │
│  │  POST /api/auth/logout/                                    │  │
│  │  └─ Blacklist refresh token                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Uses                              │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        Views                               │  │
│  │                                                             │  │
│  │  UserDetailView (generics.RetrieveUpdateDestroyAPIView)   │  │
│  │  ├─ GET: Retrieve user                                     │  │
│  │  ├─ PATCH: Update user (uses UserUpdateSerializer)        │  │
│  │  └─ DELETE: Delete user (admin only)                      │  │
│  │                                                             │  │
│  │  ChangePasswordView (APIView)                              │  │
│  │  └─ POST: Change password (uses ChangePasswordSerializer) │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Uses                              │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Serializers                            │  │
│  │                                                             │  │
│  │  UserSerializer                                            │  │
│  │  ├─ Fields: id, name, email, role, phone, profile_image   │  │
│  │  └─ Used for: User creation, retrieval                    │  │
│  │                                                             │  │
│  │  UserUpdateSerializer  ← NEW!                             │  │
│  │  ├─ Fields: id, name, email, phone, profile_image         │  │
│  │  └─ Used for: Profile updates                             │  │
│  │                                                             │  │
│  │  ChangePasswordSerializer  ← NEW!                         │  │
│  │  ├─ Fields: current_password, new_password                │  │
│  │  └─ Used for: Password changes                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Validates & Saves                 │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      User Model                            │  │
│  │                                                             │  │
│  │  Fields:                                                   │  │
│  │  • id (AutoField)                                          │  │
│  │  • name (CharField)                                        │  │
│  │  • email (EmailField, unique)                             │  │
│  │  • role (CharField)                                        │  │
│  │  • phone (CharField, optional)  ← NEW!                    │  │
│  │  • profile_image (ImageField, optional)  ← NEW!           │  │
│  │  • password (CharField, hashed)                            │  │
│  │  • is_staff (BooleanField)                                │  │
│  │  • is_active (BooleanField)                               │  │
│  │  • date_joined (DateTimeField)                            │  │
│  │  • updated_at (DateTimeField)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Persists to                       │
│                              ▼                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                      DATABASE (MySQL)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    users_user Table                        │  │
│  │                                                             │  │
│  │  Columns:                                                  │  │
│  │  • id (INT, PRIMARY KEY)                                   │  │
│  │  • name (VARCHAR(120))                                     │  │
│  │  • email (VARCHAR(254), UNIQUE)                           │  │
│  │  • role (VARCHAR(20))                                      │  │
│  │  • phone (VARCHAR(20), NULL)  ← NEW!                      │  │
│  │  • profile_image (VARCHAR(100), NULL)  ← NEW!             │  │
│  │  • password (VARCHAR(128))                                 │  │
│  │  • is_staff (BOOLEAN)                                      │  │
│  │  • is_active (BOOLEAN)                                     │  │
│  │  • date_joined (DATETIME)                                  │  │
│  │  • updated_at (DATETIME)                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FILE SYSTEM (Media Storage)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  media/                                                          │
│  └── profile_images/                                             │
│      ├── user_1_profile.jpg                                      │
│      ├── user_2_profile.png                                      │
│      └── user_3_profile.jpg                                      │
│                                                                   │
│  Served via: /media/profile_images/{filename}                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Profile Image Upload Flow

```
User Action                Frontend                Backend                Database
    │                         │                       │                      │
    │  Click camera icon      │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │  Select image file      │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │                         │ Preview image         │                      │
    │                         │ (local URL)           │                      │
    │                         │                       │                      │
    │  Click "Update Profile" │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │                         │ PATCH /api/users/{id}/│                      │
    │                         │ (multipart/form-data) │                      │
    │                         ├──────────────────────>│                      │
    │                         │                       │                      │
    │                         │                       │ Validate JWT         │
    │                         │                       │ Check permissions    │
    │                         │                       │                      │
    │                         │                       │ Save image to disk   │
    │                         │                       │ (media/profile_images/)
    │                         │                       │                      │
    │                         │                       │ Update user record   │
    │                         │                       ├─────────────────────>│
    │                         │                       │                      │
    │                         │                       │ Save profile_image   │
    │                         │                       │ path to database     │
    │                         │                       │                      │
    │                         │   Response (200 OK)   │                      │
    │                         │<──────────────────────┤                      │
    │                         │                       │                      │
    │                         │ updateUser(data)      │                      │
    │                         │ Update context        │                      │
    │                         │                       │                      │
    │  Success message        │                       │                      │
    │<────────────────────────┤                       │                      │
    │                         │                       │                      │
    │  Image shows in navbar  │                       │                      │
    │<────────────────────────┤                       │                      │
```

### 2. Password Change Flow

```
User Action                Frontend                Backend                Database
    │                         │                       │                      │
    │  Enter passwords        │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │  Click "Change Password"│                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │                         │ Validate:             │                      │
    │                         │ • Passwords match     │                      │
    │                         │ • Min 8 characters    │                      │
    │                         │                       │                      │
    │                         │ POST /api/auth/       │                      │
    │                         │ change-password/      │                      │
    │                         ├──────────────────────>│                      │
    │                         │                       │                      │
    │                         │                       │ Validate JWT         │
    │                         │                       │                      │
    │                         │                       │ Check current        │
    │                         │                       │ password             │
    │                         │                       │                      │
    │                         │                       │ Hash new password    │
    │                         │                       │                      │
    │                         │                       │ Update password      │
    │                         │                       ├─────────────────────>│
    │                         │                       │                      │
    │                         │   Response (200 OK)   │                      │
    │                         │<──────────────────────┤                      │
    │                         │                       │                      │
    │                         │ Clear password fields │                      │
    │                         │                       │                      │
    │  Success message        │                       │                      │
    │<────────────────────────┤                       │                      │
```

### 3. Profile Information Update Flow

```
User Action                Frontend                Backend                Database
    │                         │                       │                      │
    │  Edit name/phone        │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │  Click "Update Profile" │                       │                      │
    ├────────────────────────>│                       │                      │
    │                         │                       │                      │
    │                         │ PATCH /api/users/{id}/│                      │
    │                         ├──────────────────────>│                      │
    │                         │                       │                      │
    │                         │                       │ Validate JWT         │
    │                         │                       │ Check permissions    │
    │                         │                       │                      │
    │                         │                       │ Validate data        │
    │                         │                       │                      │
    │                         │                       │ Update user record   │
    │                         │                       ├─────────────────────>│
    │                         │                       │                      │
    │                         │   Response (200 OK)   │                      │
    │                         │   with updated data   │                      │
    │                         │<──────────────────────┤                      │
    │                         │                       │                      │
    │                         │ updateUser(data)      │                      │
    │                         │ Update context        │                      │
    │                         │                       │                      │
    │  Success message        │                       │                      │
    │<────────────────────────┤                       │                      │
    │                         │                       │                      │
    │  Updated info shows     │                       │                      │
    │<────────────────────────┤                       │                      │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: Authentication                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • JWT Token Required                                       │  │
│  │ • Token Validation on Every Request                       │  │
│  │ • Automatic Token Refresh                                 │  │
│  │ • Token Blacklisting on Logout                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 2: Authorization                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Users Can Only Update Own Profile                       │  │
│  │ • Admin Override Available                                │  │
│  │ • Permission Classes Enforced                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 3: Input Validation                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Client-side Validation (Immediate Feedback)             │  │
│  │ • Server-side Validation (Security Enforcement)           │  │
│  │ • Django Serializer Validation                            │  │
│  │ • Password Strength Requirements                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 4: File Upload Security                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • File Type Validation (Images Only)                      │  │
│  │ • File Size Limit (5MB Frontend, Configurable Backend)   │  │
│  │ • Secure File Storage                                     │  │
│  │ • Unique Filenames                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Layer 5: Data Protection                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Passwords Hashed (PBKDF2)                               │  │
│  │ • No Sensitive Data in URLs                               │  │
│  │ • HTTPS in Production                                     │  │
│  │ • CORS Protection                                         │  │
│  │ • XSS Protection                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
└── AuthProvider (Context)
    └── Router
        └── TeacherLayout
            └── SettingsPage
                ├── Sidebar
                ├── Navbar
                └── Settings Content
                    ├── Profile Image Section
                    │   ├── Avatar Display
                    │   ├── Camera Button
                    │   └── File Input (hidden)
                    │
                    ├── Profile Information Section
                    │   ├── Name Input
                    │   ├── Email Input
                    │   ├── Phone Input
                    │   └── Update Button
                    │
                    ├── Change Password Section
                    │   ├── Current Password Input
                    │   ├── New Password Input
                    │   ├── Confirm Password Input
                    │   └── Change Button
                    │
                    ├── Preferences Section
                    │   ├── Email Notifications Toggle
                    │   └── Dashboard Notifications Toggle
                    │
                    └── Account Actions Section
                        ├── Back to Dashboard Button
                        └── Logout Button
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      AuthContext (Global State)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State:                                                          │
│  • user: { id, name, email, role, phone, profile_image }        │
│                                                                   │
│  Methods:                                                        │
│  • login(access, refresh)                                        │
│  • logout()                                                      │
│  • updateUser(userData)  ← NEW!                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Provides to
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SettingsPage (Local State)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State:                                                          │
│  • formData: { name, email, phone, passwords }                  │
│  • profileImage: File | null                                     │
│  • imagePreview: string | null                                   │
│  • loading: boolean                                              │
│                                                                   │
│  Effects:                                                        │
│  • Initialize form with user data                                │
│                                                                   │
│  Handlers:                                                       │
│  • handleChange(e)                                               │
│  • handleImageChange(e)                                          │
│  • handleUpdateProfile(e)                                        │
│  • handleChangePassword(e)                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

This architecture provides:
✅ Clear separation of concerns
✅ Secure authentication & authorization
✅ Efficient state management
✅ Scalable component structure
✅ Comprehensive error handling
✅ Production-ready security
