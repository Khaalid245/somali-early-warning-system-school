# Alert Retention Policy

## Overview
This document explains how long alerts remain visible in the system based on their status.

## Alert Lifecycle & Retention

### Active Alerts
- **Status**: `active`, `under_review`, `escalated`
- **Visibility**: Always visible in Alert Management
- **Retention**: Indefinite until status changes
- **Purpose**: Requires immediate action from form masters/admins

### Resolved Alerts
- **Status**: `resolved`
- **Visibility**: Visible in Alert Management (can be filtered)
- **Retention**: Permanent (for audit trail and compliance)
- **Purpose**: Historical record of interventions and outcomes
- **Compliance**: FERPA requires 7-year retention of educational records

### Dismissed Alerts
- **Status**: `dismissed`
- **Visibility**: Visible in Alert Management (can be filtered)
- **Retention**: Permanent (for audit trail)
- **Purpose**: Track false positives and system improvements

## Filtering Behavior

### Default View
- Shows ALL alerts regardless of status
- Use status filter to view specific categories

### Filter by Status
- **Active**: Current alerts requiring action
- **Under Review**: Alerts being investigated by form masters
- **Escalated**: Alerts escalated to administrators
- **Resolved**: Successfully addressed alerts
- **Dismissed**: Alerts marked as false positives

## Best Practices for Schools

### Weekly Review
- Form masters should review `active` and `under_review` alerts weekly
- Update status to `resolved` when intervention is successful
- Escalate to admin if additional support needed

### Monthly Audit
- Administrators should review `resolved` alerts monthly
- Verify intervention effectiveness
- Identify patterns requiring policy changes

### Annual Compliance
- Export all alerts for annual compliance reporting
- Review retention policy with legal counsel
- Archive alerts older than 7 years (if required by local law)

## Technical Implementation

### Database
- Alerts are NEVER deleted from the database
- Soft deletion not implemented (hard retention)
- All status changes are logged in audit trail

### Performance
- Indexed by `status`, `risk_level`, `student`, `assigned_to`
- Efficient filtering even with thousands of alerts
- Pagination prevents performance issues

## Recommendations

1. **Keep Resolved Alerts**: They provide valuable historical context
2. **Use Filters**: Don't delete - filter by status instead
3. **Export Regularly**: Use CSV export for reporting and compliance
4. **Review Patterns**: Analyze resolved alerts to improve prevention

## Future Enhancements

- Auto-archive alerts older than 7 years
- Advanced analytics on resolved alerts
- Predictive modeling based on historical patterns
