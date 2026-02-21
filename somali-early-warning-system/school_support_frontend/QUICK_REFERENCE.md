# Quick Reference - Industry Improvements

## 🚨 Error Handling
```jsx
// Wrap your app
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## ⏳ Loading States
```jsx
const { setLoading, isLoading } = useActionLoading();

// Set loading
setLoading('my-action', true);

// Check loading
if (isLoading('my-action')) { /* show spinner */ }

// Clear loading
setLoading('my-action', false);
```

## ✅ Data Validation
```jsx
import { sanitizeDashboardData } from './utils/dataValidation';

const safeData = sanitizeDashboardData(apiResponse);
// Always returns valid structure with empty arrays as defaults
```

## 🔒 Memory Leak Prevention
```jsx
const isMountedRef = useRef(true);

useEffect(() => {
  fetchData();
  return () => {
    isMountedRef.current = false; // Cleanup
  };
}, []);

const fetchData = async () => {
  const data = await api.get('/data');
  if (isMountedRef.current) {
    setState(data); // Only if still mounted
  }
};
```

## 📝 Audit Trail
```jsx
import { logAuditTrail, getAuditLog } from '../utils/auditTrail';

// Log action
logAuditTrail('USER_ACTION', { details: 'something happened' });

// View logs
const logs = getAuditLog();
console.log(logs);
```

## 🔄 Real-time Polling
```jsx
import { usePolling } from '../hooks/usePolling';

// Poll every 30 seconds
usePolling(fetchData, 30000, enabled);

// Stop polling by setting enabled=false
```

## 🌍 Internationalization
```jsx
import { t, setLanguage } from '../utils/i18n';

// Use translation
<h1>{t('dashboard.title')}</h1>

// Change language
setLanguage('so'); // Somali
```

## ⚡ Performance Monitoring
```jsx
import { performanceMonitor } from '../utils/performance';

// Measure sync function
performanceMonitor.start('operation');
doSomething();
performanceMonitor.end('operation');

// Measure async function
await performanceMonitor.measureAsync('api-call', async () => {
  return await api.get('/data');
});
```

## ♿ Accessibility
```jsx
// Always add aria-label to buttons
<button 
  aria-label="Delete student record"
  onClick={handleDelete}
>
  Delete
</button>

// Add role to sections
<div role="region" aria-label="Student list">
  {/* content */}
</div>
```

## 🎯 Conditional Rendering
```jsx
// Only render if data exists
{data?.items?.length > 0 && (
  <Table items={data.items} />
)}

// With fallback
{data?.items?.length > 0 ? (
  <Table items={data.items} />
) : (
  <EmptyState />
)}
```

## 🔍 Debugging Tips

### Check Audit Logs
```javascript
// Browser console
JSON.parse(localStorage.getItem('auditLog'))
```

### Check Performance
```javascript
// Automatically logged to console
// Look for: [PERFORMANCE] operation took Xms
```

### Clear All Data
```javascript
localStorage.clear();
sessionStorage.clear();
```

## 📦 Import Paths

```javascript
// Hooks
import { useActionLoading } from '../hooks/useActionLoading';
import { usePolling } from '../hooks/usePolling';

// Utils
import { logAuditTrail } from '../utils/auditTrail';
import { t, setLanguage } from '../utils/i18n';
import { performanceMonitor } from '../utils/performance';
import { sanitizeDashboardData } from './utils/dataValidation';

// Components
import { ErrorBoundary } from '../components/ErrorBoundary';
```

## 🚀 Production Checklist

- [ ] Error boundary wraps root component
- [ ] All API calls have loading states
- [ ] All API responses are validated
- [ ] All useEffect hooks have cleanup
- [ ] All buttons have aria-labels
- [ ] Critical actions are logged to audit trail
- [ ] Performance monitoring is enabled
- [ ] Conditional rendering for optional data
- [ ] i18n keys used instead of hardcoded strings
- [ ] Polling enabled for real-time updates

---

**Need Help?** Check `INDUSTRY_IMPROVEMENTS.md` for detailed documentation.
