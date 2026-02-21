# BACKEND IMPLEMENTATION GUIDE
## How to Apply All Changes

---

## STEP 1: Add Version Control to Models

### 1.1 Update Models
```python
# In interventions/models.py
from core.mixins import OptimisticLockMixin

class InterventionCase(OptimisticLockMixin, models.Model):
    # ... existing fields ...
    # version field added automatically by mixin
    pass

class Alert(OptimisticLockMixin, models.Model):
    # ... existing fields ...
    pass
```

### 1.2 Run Migration
```bash
cd school_support_backend
python manage.py makemigrations
python manage.py migrate
```

---

## STEP 2: Add Permission Checks to Views

### 2.1 Update Existing Views
```python
# In interventions/views.py
from core.permissions import require_role, validate_resource_ownership

# Add decorators to existing views
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@require_role('form_master', 'admin')
@validate_resource_ownership(InterventionCase, id_param='pk')
def update_case(request, pk):
    # ... existing code ...
    pass
```

### 2.2 Add Version Check
```python
def update_case(request, pk):
    case = InterventionCase.objects.get(pk=pk)
    
    # Check version
    client_version = request.data.get('version')
    if client_version and case.version != client_version:
        return Response({
            'error': 'Case was modified by another user',
            'current_version': case.version
        }, status=409)
    
    # Update case
    case.progress_status = request.data.get('progress_status')
    case.save()  # Version auto-increments
    
    return Response({'success': True, 'version': case.version})
```

---

## STEP 3: Set Up Audit Logging

### 3.1 Create Audit Log Table
```bash
python manage.py makemigrations core
python manage.py migrate core
```

### 3.2 Add to Main URLs
```python
# In school_support_backend/urls.py
from django.urls import path, include

urlpatterns = [
    # ... existing patterns ...
    path('api/', include('core.urls')),
]
```

### 3.3 Update Frontend to Send Audit Logs
```javascript
// In auditTrail.js
export const logAuditTrail = async (action, details) => {
  try {
    await api.post('/api/audit/', {
      action,
      details,
      sessionId: sessionStorage.getItem('sessionId')
    });
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
};
```

---

## STEP 4: Add Automated Cleanup

### 4.1 Create Management Command
```python
# In core/management/commands/cleanup_old_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import AuditLog

class Command(BaseCommand):
    help = 'Clean up old data based on retention policy'

    def handle(self, *args, **kwargs):
        # Delete audit logs older than 7 years
        seven_years_ago = timezone.now() - timedelta(days=7*365)
        deleted_count = AuditLog.objects.filter(
            timestamp__lt=seven_years_ago
        ).delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {deleted_count} old audit logs')
        )
```

### 4.2 Set Up Cron Job
```bash
# Add to crontab
0 2 * * * cd /path/to/project && python manage.py cleanup_old_data
```

---

## STEP 5: Update API Responses

### 5.1 Include Version in Responses
```python
# In serializers.py
class InterventionCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionCase
        fields = ['case_id', 'student', 'status', 'version', ...]  # Add version
```

### 5.2 Update Frontend to Track Versions
```javascript
// In DashboardClean.jsx
const handleUpdateProgress = async (caseId, formData) => {
  const currentCase = dashboardData.pending_cases.find(c => c.case_id === caseId);
  
  try {
    await api.patch(`/interventions/cases/${caseId}/`, {
      ...formData,
      version: currentCase.version  // Send current version
    });
  } catch (err) {
    if (err.response?.status === 409) {
      showToast.error('Case was modified by another user. Refreshing...');
      loadDashboard();
    }
  }
};
```

---

## STEP 6: Testing

### 6.1 Test Version Control
```python
# Test race condition prevention
def test_concurrent_updates():
    case = InterventionCase.objects.create(...)
    
    # Simulate two users updating same case
    case1 = InterventionCase.objects.get(pk=case.pk)
    case2 = InterventionCase.objects.get(pk=case.pk)
    
    case1.status = 'in_progress'
    case1.save()  # Success
    
    case2.status = 'resolved'
    with pytest.raises(ValidationError):
        case2.save()  # Should fail - version mismatch
```

### 6.2 Test Permissions
```python
def test_unauthorized_access():
    client = APIClient()
    client.force_authenticate(user=teacher_user)
    
    # Try to access another teacher's alert
    response = client.patch(f'/api/alerts/{other_alert_id}/', {...})
    assert response.status_code == 403
```

### 6.3 Test Audit Logging
```python
def test_audit_log_creation():
    client.post('/api/audit/', {
        'action': 'CASE_UPDATED',
        'details': {'case_id': 123}
    })
    
    assert AuditLog.objects.filter(action='CASE_UPDATED').exists()
```

---

## STEP 7: Deployment Checklist

- [ ] Run all migrations
- [ ] Update environment variables
- [ ] Test version control in staging
- [ ] Test permission checks
- [ ] Verify audit logging works
- [ ] Set up automated cleanup cron job
- [ ] Update API documentation
- [ ] Train staff on new features
- [ ] Monitor error logs for 1 week

---

## STEP 8: Rollback Plan

If issues occur:

```bash
# Rollback migrations
python manage.py migrate interventions 0001_initial
python manage.py migrate core zero

# Restore from backup
mysql -u user -p database < backup.sql

# Revert code changes
git revert <commit-hash>
```

---

## TROUBLESHOOTING

### Issue: Version mismatch errors
**Solution**: Ensure frontend sends version field in all PATCH requests

### Issue: Permission denied errors
**Solution**: Check user roles in database, verify decorators applied

### Issue: Audit logs not created
**Solution**: Check API endpoint is included in urls.py

---

## SUPPORT

For implementation help:
- Email: dev-support@school.edu
- Slack: #backend-support
- Documentation: /docs/api/

---

**Implementation Time Estimate**: 4-6 hours  
**Testing Time**: 2-3 hours  
**Total**: 1 business day
