# DATA RETENTION POLICY
## School Early Warning Support System

**Effective Date**: February 2025  
**Review Date**: February 2026

---

## 1. PURPOSE

This policy establishes guidelines for the retention and disposal of student data in compliance with FERPA, state regulations, and educational best practices.

---

## 2. RETENTION SCHEDULES

### Student Records

| Data Type | Retention Period | Disposal Method |
|-----------|------------------|-----------------|
| **Active Student Records** | Duration of enrollment | N/A |
| **Graduated/Transferred Students** | 5 years after departure | Secure deletion |
| **Attendance Records** | Current year + 3 years | Secure deletion |
| **Intervention Cases** | 5 years after case closure | Secure deletion |
| **Risk Assessments** | 3 years | Secure deletion |
| **Teacher Notes** | 2 years | Secure deletion |

### System Logs

| Log Type | Retention Period | Disposal Method |
|----------|------------------|-----------------|
| **Audit Logs** | 7 years | Automated purge |
| **Access Logs** | 3 years | Automated purge |
| **Error Logs** | 1 year | Automated purge |
| **Performance Logs** | 90 days | Automated purge |

### User Accounts

| Account Type | Retention Period | Disposal Method |
|--------------|------------------|-----------------|
| **Active Staff** | Duration of employment | N/A |
| **Inactive Staff** | 1 year after last login | Account deletion |
| **Student Accounts** | 90 days after graduation | Account deletion |

---

## 3. AUTOMATED RETENTION

### Daily Tasks:
```python
# Pseudocode for automated cleanup
def daily_cleanup():
    # Delete error logs older than 1 year
    ErrorLog.objects.filter(created_at__lt=one_year_ago).delete()
    
    # Delete performance logs older than 90 days
    PerformanceLog.objects.filter(created_at__lt=ninety_days_ago).delete()
```

### Monthly Tasks:
```python
def monthly_cleanup():
    # Archive graduated students after 90 days
    graduated_students = Student.objects.filter(
        status='graduated',
        graduation_date__lt=ninety_days_ago
    )
    for student in graduated_students:
        archive_student(student)
        student.delete()
    
    # Delete inactive user accounts after 1 year
    inactive_users = User.objects.filter(
        last_login__lt=one_year_ago,
        is_active=False
    )
    inactive_users.delete()
```

### Annual Tasks:
```python
def annual_cleanup():
    # Delete old attendance records (3+ years)
    Attendance.objects.filter(date__lt=three_years_ago).delete()
    
    # Delete closed intervention cases (5+ years)
    InterventionCase.objects.filter(
        status='resolved',
        closed_date__lt=five_years_ago
    ).delete()
    
    # Purge old audit logs (7+ years)
    AuditLog.objects.filter(timestamp__lt=seven_years_ago).delete()
```

---

## 4. ARCHIVAL PROCESS

### Before Deletion:
1. **Export to Archive**: Create encrypted backup
2. **Verify Integrity**: Confirm backup is complete
3. **Document**: Log archival in audit trail
4. **Secure Storage**: Store in offline encrypted storage

### Archive Location:
- **Physical**: Encrypted external drive in secure location
- **Digital**: Encrypted cloud backup (if approved)
- **Access**: Restricted to IT Director and Principal

---

## 5. LEGAL HOLDS

### When to Suspend Deletion:
- Active litigation involving student
- Pending investigation
- Formal records request
- Regulatory audit

### Legal Hold Process:
1. IT Director notified of legal hold
2. Automated deletion suspended for affected records
3. Records flagged in system
4. Hold released only by legal counsel

---

## 6. DATA DISPOSAL METHODS

### Secure Deletion:
- **Database Records**: Overwrite with random data 3 times
- **File Storage**: Use secure deletion tools (e.g., shred)
- **Backups**: Physically destroy media or crypto-erase

### Verification:
- Deletion logs maintained for 1 year
- Random audits to verify compliance
- Certificate of destruction for physical media

---

## 7. EXCEPTIONS

### Extended Retention:
Records may be retained longer than policy if:
- Required by law
- Subject to legal hold
- Approved by school board
- Part of historical archive

### Early Deletion:
Records may be deleted earlier if:
- Parent/guardian requests (with verification)
- Court order requires
- Data breach necessitates

---

## 8. RESPONSIBILITIES

| Role | Responsibility |
|------|----------------|
| **IT Director** | Implement automated retention, manage archives |
| **School Administrator** | Approve exceptions, handle legal holds |
| **Database Administrator** | Execute deletion scripts, verify backups |
| **Compliance Officer** | Audit retention compliance, update policy |

---

## 9. MONITORING & COMPLIANCE

### Monthly Reports:
- Records deleted this month
- Records archived this month
- Storage usage trends
- Compliance exceptions

### Annual Review:
- Policy effectiveness
- Retention schedule updates
- Legal requirement changes
- Technology updates

---

## 10. POLICY UPDATES

This policy will be reviewed annually and updated as needed to reflect:
- Changes in federal/state law
- New technology capabilities
- Audit findings
- Best practice evolution

---

**Approved By**:  
Name: [School Board President]  
Signature: _________________________  
Date: _________________________

**Next Review Date**: February 2026
