"""
Quick Scalability Verification Script
Run: python CHECK_SCALABILITY.py
"""
import os
import sys

print("\n" + "="*70)
print("SCALABILITY IMPROVEMENTS VERIFICATION")
print("="*70 + "\n")

checks_passed = 0
checks_failed = 0

# Check 1: Database indexes migration file
print("1. Checking database indexes migration...")
index_file = "school_support_backend/core/migrations/0002_add_performance_indexes.py"
if os.path.exists(index_file):
    print(f"   ✓ FOUND: {index_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {index_file}")
    checks_failed += 1

# Check 2: Connection pooling config
print("\n2. Checking connection pooling configuration...")
pooling_file = "school_support_backend/DATABASE_SCALING_CONFIG.py"
if os.path.exists(pooling_file):
    print(f"   ✓ FOUND: {pooling_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {pooling_file}")
    checks_failed += 1

# Check 3: Optimized queries
print("\n3. Checking query optimization...")
queries_file = "school_support_backend/OPTIMIZED_QUERIES.py"
if os.path.exists(queries_file):
    print(f"   ✓ FOUND: {queries_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {queries_file}")
    checks_failed += 1

# Check 4: Audit log partitioning
print("\n4. Checking audit log partitioning...")
partition_file = "school_support_backend/AUDIT_LOG_PARTITIONING.py"
if os.path.exists(partition_file):
    print(f"   ✓ FOUND: {partition_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {partition_file}")
    checks_failed += 1

# Check 5: Load testing script
print("\n5. Checking load testing script...")
load_test_file = "load-test.js"
if os.path.exists(load_test_file):
    print(f"   ✓ FOUND: {load_test_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {load_test_file}")
    checks_failed += 1

# Check 6: Frontend pagination hook
print("\n6. Checking frontend pagination...")
pagination_file = "school_support_frontend/src/hooks/usePagination.js"
if os.path.exists(pagination_file):
    print(f"   ✓ FOUND: {pagination_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {pagination_file}")
    checks_failed += 1

# Check 7: Smart polling hook
print("\n7. Checking smart polling...")
polling_file = "school_support_frontend/src/hooks/useSmartPolling.js"
if os.path.exists(polling_file):
    print(f"   ✓ FOUND: {polling_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {polling_file}")
    checks_failed += 1

# Check 8: Reliability utilities
print("\n8. Checking reliability utilities...")
reliability_file = "school_support_frontend/src/utils/reliability.js"
if os.path.exists(reliability_file):
    print(f"   ✓ FOUND: {reliability_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {reliability_file}")
    checks_failed += 1

# Check 9: Documentation
print("\n9. Checking scalability documentation...")
doc_file = "SCALABILITY_ANSWERS.md"
if os.path.exists(doc_file):
    print(f"   ✓ FOUND: {doc_file}")
    checks_passed += 1
else:
    print(f"   ✗ MISSING: {doc_file}")
    checks_failed += 1

# Summary
print("\n" + "="*70)
print(f"RESULTS: {checks_passed} passed, {checks_failed} failed")
print("="*70 + "\n")

if checks_failed == 0:
    print("✓ ALL SCALABILITY FILES PRESENT!")
    print("\nNext steps:")
    print("1. Apply migrations: cd school_support_backend && python manage.py migrate")
    print("2. Check settings.py has CONN_MAX_AGE configured")
    print("3. Run load test: k6 run load-test.js")
else:
    print("✗ SOME FILES ARE MISSING")
    print("\nFiles need to be created or conversation history needs to be reviewed.")

print("\n" + "="*70 + "\n")
