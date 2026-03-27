#!/bin/bash

# Production Deployment Verification Script
# Run this on your new server after deployment

echo "=========================================="
echo "School Support System - Deployment Check"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Docker Compose file exists
echo "1. Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml found"
else
    echo -e "${RED}✗${NC} docker-compose.yml not found"
    exit 1
fi

# Check 2: DEBUG=False
echo ""
echo "2. Checking DEBUG setting..."
if grep -q "DEBUG=False" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} DEBUG=False (correct)"
else
    echo -e "${RED}✗${NC} DEBUG=True found (DANGEROUS!)"
fi

# Check 3: SECRET_KEY is not default
echo ""
echo "3. Checking SECRET_KEY..."
if grep -q "docker-dev-secret-key" docker-compose.yml; then
    echo -e "${RED}✗${NC} Using default SECRET_KEY (INSECURE!)"
else
    echo -e "${GREEN}✓${NC} Custom SECRET_KEY configured"
fi

# Check 4: ALLOWED_HOSTS includes domain
echo ""
echo "4. Checking ALLOWED_HOSTS..."
if grep -q "alifmonitor.com" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} Domain added to ALLOWED_HOSTS"
else
    echo -e "${RED}✗${NC} Domain missing from ALLOWED_HOSTS"
fi

# Check 5: CORS_ALLOWED_ORIGINS set
echo ""
echo "5. Checking CORS_ALLOWED_ORIGINS..."
if grep -q "CORS_ALLOWED_ORIGINS" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} CORS_ALLOWED_ORIGINS configured"
else
    echo -e "${RED}✗${NC} CORS_ALLOWED_ORIGINS not set"
fi

# Check 6: FRONTEND_URL set
echo ""
echo "6. Checking FRONTEND_URL..."
if grep -q "FRONTEND_URL" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} FRONTEND_URL configured"
else
    echo -e "${RED}✗${NC} FRONTEND_URL not set"
fi

# Check 7: Email settings
echo ""
echo "7. Checking Email configuration..."
if grep -q "EMAIL_HOST_USER=your-email" docker-compose.yml; then
    echo -e "${YELLOW}⚠${NC} Email credentials not configured (TODO)"
elif grep -q "EMAIL_HOST_USER" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} Email settings configured"
else
    echo -e "${RED}✗${NC} Email settings missing"
fi

# Check 8: Containers running
echo ""
echo "8. Checking Docker containers..."
if command -v docker-compose &> /dev/null; then
    RUNNING=$(docker-compose ps --services --filter "status=running" | wc -l)
    TOTAL=$(docker-compose ps --services | wc -l)
    
    if [ "$RUNNING" -eq "$TOTAL" ] && [ "$RUNNING" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} All $RUNNING containers running"
    else
        echo -e "${YELLOW}⚠${NC} $RUNNING/$TOTAL containers running"
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker not running or not installed"
fi

# Check 9: Backend health
echo ""
echo "9. Checking Backend health..."
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/ 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Backend responding (HTTP 200)"
    else
        echo -e "${YELLOW}⚠${NC} Backend not responding or not started yet"
    fi
else
    echo -e "${YELLOW}⚠${NC} curl not installed, skipping health check"
fi

# Check 10: Frontend accessible
echo ""
echo "10. Checking Frontend..."
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Frontend responding (HTTP 200)"
    else
        echo -e "${YELLOW}⚠${NC} Frontend not responding or not started yet"
    fi
else
    echo -e "${YELLOW}⚠${NC} curl not installed, skipping frontend check"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Fix any ${RED}✗ RED${NC} issues above"
echo "2. Configure ${YELLOW}⚠ YELLOW${NC} items (email credentials)"
echo "3. Run: docker-compose up --build -d"
echo "4. Check logs: docker-compose logs -f backend"
echo ""
