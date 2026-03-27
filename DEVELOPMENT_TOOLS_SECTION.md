# 3.7 Development Tools

This section outlines the software tools and technologies used in the design, development, and deployment of the School Early Warning Support System.

## 3.7.1 Frontend Technologies

The user interface was developed using **React 19.2.0**, a modern component-based JavaScript library for building dynamic and interactive web applications. **Tailwind CSS 4.1.18** was used to ensure a responsive and user-friendly interface across all devices, including login screens, role-based dashboards, attendance forms, risk profiles, intervention records, and reporting interfaces. **Vite 7.2.5** served as the frontend build tool, enabling fast development and optimized production builds.

Additional frontend libraries include:

- **React Router DOM 7.13.0** for client-side routing and navigation
- **Axios 1.13.4** for HTTP requests and API communication
- **React Hook Form 7.51.0** with **Zod 3.22.4** for form validation
- **Recharts 3.7.0** for data visualization and analytics dashboards
- **Lucide React 0.575.0** for consistent iconography
- **DOMPurify 3.3.1** for XSS protection through input sanitization
- **JWT Decode 4.0.0** for client-side token parsing
- **React Hot Toast 2.4.1** for user notifications

## 3.7.2 Backend Technologies

The backend was implemented using **Python 3.11** with the **Django 5.1.4** web framework. **Django REST Framework (DRF)** provided RESTful API services to enable secure communication between frontend and backend components. The backend handles user authentication, attendance processing, automated risk calculation, alert generation, intervention management, messaging, and reporting functionalities.

Key backend packages include:

- **djangorestframework-simplejwt** for JWT-based authentication
- **django-cors-headers** for Cross-Origin Resource Sharing (CORS) configuration
- **django-ratelimit** for API rate limiting and brute-force protection
- **pyotp** for Two-Factor Authentication (2FA) using Time-based One-Time Passwords (TOTP)
- **qrcode** for generating 2FA QR codes
- **cryptography** for secure encryption operations
- **Pillow** for image processing (profile pictures)

## 3.7.3 Database Management System

**MySQL 8.0** serves as the relational database management system for storing user accounts, student records, classroom data, attendance sessions, risk profiles, alerts, intervention cases, and messages. MySQL ensures data integrity, consistency, and reliability through foreign key constraints, indexes, and transaction support. **mysqlclient** and **mysql-connector-python** libraries facilitate database connectivity.

## 3.7.4 Caching and Performance

**Redis** was integrated with **django-redis** to provide caching capabilities for frequently accessed data, reducing database load and improving response times. Redis caches dashboard statistics, risk calculations, and session data.

## 3.7.5 Security Technologies

Security was implemented using multiple layers:

- **JSON Web Tokens (JWT)** with httpOnly cookies for stateless authentication
- **PyOTP** for Two-Factor Authentication (2FA) using TOTP algorithm
- **Django's built-in password hashing** using PBKDF2 algorithm
- **django-ratelimit** for preventing brute-force attacks (10 attempts per 15 minutes)
- **CORS headers** for controlling cross-origin requests
- **DOMPurify** on frontend for XSS prevention
- **Django ORM** for SQL injection protection

## 3.7.6 API Documentation

**drf-spectacular** was used to generate interactive API documentation following the OpenAPI 3.0 specification. This provides Swagger UI and ReDoc interfaces for testing and documenting all API endpoints.

## 3.7.7 Export and Reporting

The system supports data export functionality using:

- **openpyxl** for Excel spreadsheet generation
- **reportlab** for PDF report generation
- **python-docx** for Word document generation

## 3.7.8 Monitoring and Error Tracking

**Sentry SDK** was integrated for real-time error tracking, performance monitoring, and crash reporting in production environments.

## 3.7.9 Database Design Tools

**MySQL Workbench** was used to design and visualize the database schema, including entity relationships, foreign key constraints, and indexes. This ensured alignment between system requirements and database implementation.

## 3.7.10 Development Environment

**Visual Studio Code** served as the integrated development environment (IDE) for managing both frontend and backend source code. Extensions for Python, JavaScript, React, and Django enhanced development productivity.

## 3.7.11 Production Deployment

The system was deployed to production using:

- **Gunicorn** as the WSGI HTTP server for serving Django applications
- **WhiteNoise** for serving static files efficiently
- **Nginx** as reverse proxy and web server
- **SSL/TLS certificates** via Let's Encrypt for HTTPS encryption
- **Docker** for containerization (optional deployment method)

## 3.7.12 Version Control and Collaboration

**Git** was used for version control, enabling structured development, code collaboration, and traceability of system changes. The project repository is hosted on **GitHub** at: https://github.com/Khaalid245/somali-early-warning-system-school

## 3.7.14 Environment Management

**python-dotenv** was used to manage environment variables securely, separating configuration from code. This includes database credentials, secret keys, API keys, and deployment settings.

---

## Summary of Technology Stack

| Category            | Technologies                                     |
| ------------------- | ------------------------------------------------ |
| **Frontend**        | React 19.2.0, Tailwind CSS 4.1.18, Vite 7.2.5    |
| **Backend**         | Python 3.11, Django 5.1.4, Django REST Framework |
| **Database**        | MySQL 8.0                                        |
| **Caching**         | Redis                                            |
| **Authentication**  | JWT, PyOTP (2FA)                                 |
| **Security**        | Rate Limiting, CORS, DOMPurify, Cryptography     |
| **API Docs**        | drf-spectacular (OpenAPI 3.0)                    |
| **Deployment**      | Gunicorn, Nginx, WhiteNoise, Docker              |
| **Monitoring**      | Sentry SDK                                       |
| **Version Control** | Git, GitHub                                      |
| **IDE**             | Visual Studio Code                               |
| **Testing**         | Django Test Framework, Coverage.py               |

This comprehensive technology stack ensures the system is secure, scalable, maintainable, and production-ready.
