# 🚀 Quick Reference Card

## Installation (One Command)
```bash
setup.bat
```

## Development
```bash
# Backend
cd somali-early-warning-system\school_support_backend
python manage.py runserver

# Frontend
cd somali-early-warning-system\school_support_frontend
npm run dev
```

## Production (Docker)
```bash
docker-compose up --build
```

## Essential Commands

### Backend
```bash
pip install -r requirements.txt          # Install dependencies
python manage.py migrate                 # Run migrations
python manage.py test                    # Run tests
python manage.py createsuperuser         # Create admin
```

### Frontend
```bash
npm install                              # Install dependencies
npm run dev                              # Development server
npm run build                            # Production build
npm run lint                             # Lint code
```

### Docker
```bash
docker-compose up                        # Start services
docker-compose down                      # Stop services
docker-compose logs -f backend           # View logs
docker-compose exec backend python manage.py migrate  # Run migrations in container
```

## New Features Quick Use

### Toast Notifications
```javascript
import { showToast } from '../utils/toast';
showToast.success('Success!');
showToast.error('Error!');
```

### Confirmation Dialog
```javascript
import ConfirmDialog from '../components/ConfirmDialog';
const [show, setShow] = useState(false);
<ConfirmDialog isOpen={show} onConfirm={handleConfirm} onCancel={() => setShow(false)} />
```

### Loading Skeleton
```javascript
import { CardSkeleton } from '../components/LoadingSkeleton';
{loading ? <CardSkeleton /> : <Content />}
```

### Empty State
```javascript
import EmptyState from '../components/EmptyState';
<EmptyState title="No data" message="Add items to get started" />
```

## Important URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin
- Health: http://localhost:8000/health/
- API Docs: http://localhost:8000/api/

## Environment Variables

Required in `.env`:
```env
SECRET_KEY=generate-new-key
DB_PASSWORD=your-password
DEBUG=False
```

Generate SECRET_KEY:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Constants (No Magic Numbers!)

Located in `core/constants.py`:
- `ABSENCE_THRESHOLD_SUBJECT = 7`
- `ABSENCE_THRESHOLD_FULL_DAY = 5`
- `RISK_SCORE_HIGH = 55`
- `RISK_SCORE_CRITICAL = 75`

## Health Check

```bash
curl http://localhost:8000/health/
```

## Logs

- Application: `logs/django.log`
- Docker: `docker-compose logs -f`

## Testing

```bash
python manage.py test                    # All tests
python manage.py test risk.tests         # Specific app
```

## Security Checklist

- [ ] Update SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable SSL
- [ ] Set up backups

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | `pip install -r requirements.txt` |
| DB connection error | Check `.env` and MySQL |
| Port already in use | Change port or kill process |
| Docker build fails | `docker-compose down -v && docker system prune -a` |

## File Structure

```
school_support_backend/
├── .env                    # Environment variables (create from .env.example)
├── core/
│   ├── constants.py        # Constants
│   ├── exceptions.py       # Custom exceptions
│   ├── middleware.py       # Audit logging
│   └── health.py          # Health check
├── attendance/
│   └── export_service.py  # Export functionality
└── logs/                  # Application logs

school_support_frontend/
├── src/
│   ├── utils/
│   │   └── toast.js       # Toast notifications
│   └── components/
│       ├── ErrorBoundary.jsx
│       ├── ConfirmDialog.jsx
│       ├── LoadingSkeleton.jsx
│       └── EmptyState.jsx
```

## CI/CD

GitHub Actions automatically:
- Runs tests on push/PR
- Builds Docker images
- Deploys (if configured)

## Documentation

- `IMPROVEMENTS_SUMMARY.md` - Complete summary
- `PRODUCTION_IMPROVEMENTS.md` - Detailed guide
- `README.md` - Project overview

---

**Keep this card handy for quick reference!** 📌
