# FERPA COMPLIANCE DOCUMENTATION
## School Early Warning Support System

**Last Updated**: February 2025  
**Version**: 1.0

---

## 1. OVERVIEW

This system complies with the Family Educational Rights and Privacy Act (FERPA) (20 U.S.C. § 1232g; 34 CFR Part 99), which protects the privacy of student education records.

---

## 2. DATA CLASSIFICATION

### Personally Identifiable Information (PII) Stored:
- Student full name
- Student ID number
- Attendance records
- Academic risk indicators
- Intervention case notes
- Teacher/counselor observations

### Data NOT Stored:
- Social Security Numbers
- Home addresses
- Parent contact information (stored separately)
- Medical records
- Financial information

---

## 3. ACCESS CONTROLS

### Role-Based Access:
| Role | Access Level | Permissions |
|------|--------------|-------------|
| **Teacher** | Limited | View own classroom students, record attendance |
| **Form Master** | Moderate | View assigned students, manage intervention cases |
| **Administrator** | Full | View all students, manage users, export reports |

### Authentication:
- JWT-based authentication with 30-minute session timeout
- Password requirements: Minimum 8 characters, complexity enforced
- Failed login attempts: Account locked after 5 attempts

---

## 4. DATA SECURITY MEASURES

### Encryption:
- ✅ Data in transit: HTTPS/TLS 1.3
- ✅ Data at rest: AES-256 encryption for sensitive fields
- ✅ Database: MySQL with encrypted connections
- ✅ Audit logs: Encrypted in localStorage (frontend) and database (backend)

### Access Logging:
- All data access logged with:
  - User ID
  - Timestamp
  - Action performed
  - IP address
  - Resource accessed

---

## 5. DATA RETENTION POLICY

### Active Records:
- Student records: Retained while student is enrolled
- Attendance data: Retained for current academic year + 3 years
- Intervention cases: Retained for 5 years after case closure
- Audit logs: Retained for 7 years

### Deletion Process:
- Student graduation/transfer: Records archived after 90 days
- Inactive accounts: Deleted after 1 year of inactivity
- Audit logs: Automatically purged after 7 years

---

## 6. PARENTAL RIGHTS

### Right to Inspect:
Parents/guardians may request to view their child's records by contacting the school administrator.

### Right to Amend:
Parents may request corrections to inaccurate records through formal written request.

### Right to Consent:
Written consent required before disclosing PII to third parties (except as permitted by FERPA).

---

## 7. DISCLOSURE LIMITATIONS

### Permitted Disclosures (No Consent Required):
- School officials with legitimate educational interest
- Other schools to which student is transferring
- Authorized representatives for audit/evaluation
- Financial aid determination
- Compliance with judicial order/subpoena

### Prohibited Disclosures:
- Third-party vendors without signed agreement
- Marketing companies
- Unauthorized personnel
- Public disclosure without consent

---

## 8. INCIDENT RESPONSE

### Data Breach Protocol:
1. **Detection**: Immediate notification to IT administrator
2. **Containment**: Affected systems isolated within 1 hour
3. **Assessment**: Determine scope of breach within 24 hours
4. **Notification**: Affected parties notified within 72 hours
5. **Remediation**: Security measures updated within 1 week
6. **Documentation**: Full incident report filed

### Reporting:
- Internal: IT Director and School Principal
- External: Department of Education (if required)
- Affected Families: Written notification

---

## 9. TRAINING REQUIREMENTS

### Mandatory Training:
- All users: FERPA basics (annually)
- Administrators: Advanced data privacy (annually)
- IT Staff: Security best practices (quarterly)

### Training Topics:
- What constitutes PII
- Proper handling of student records
- Password security
- Recognizing phishing attempts
- Incident reporting procedures

---

## 10. AUDIT & MONITORING

### Regular Audits:
- Access logs reviewed: Weekly
- Permission audits: Monthly
- Security assessments: Quarterly
- FERPA compliance review: Annually

### Monitoring:
- Real-time alerts for:
  - Unauthorized access attempts
  - Bulk data exports
  - After-hours access
  - Failed login attempts

---

## 11. VENDOR MANAGEMENT

### Third-Party Services:
All vendors with access to student data must:
- Sign Data Processing Agreement (DPA)
- Comply with FERPA requirements
- Undergo annual security audit
- Provide breach notification within 24 hours

### Current Vendors:
- Cloud Hosting: [Provider Name] - DPA signed [Date]
- Database: MySQL (self-hosted)
- Authentication: JWT (self-managed)

---

## 12. COMPLIANCE CHECKLIST

- [x] Access controls implemented
- [x] Encryption enabled (transit and rest)
- [x] Audit logging active
- [x] Session timeout enforced
- [x] Role-based permissions
- [x] Data retention policy defined
- [x] Incident response plan documented
- [x] User training program established
- [x] Regular audits scheduled
- [x] Parental rights procedures documented

---

## 13. CONTACT INFORMATION

**FERPA Compliance Officer**:  
Name: [School Administrator Name]  
Email: [compliance@school.edu]  
Phone: [XXX-XXX-XXXX]

**IT Security Officer**:  
Name: [IT Director Name]  
Email: [security@school.edu]  
Phone: [XXX-XXX-XXXX]

---

## 14. DOCUMENT HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 2025 | Initial document | System Administrator |

---

**Certification**: I certify that this system has been reviewed for FERPA compliance and meets all requirements as of the date above.

**Signature**: _________________________  
**Name**: [School Administrator]  
**Date**: _________________________
