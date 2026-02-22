"""
Test query performance with and without optimizations
"""
import pytest
import time
from django.db import connection, reset_queries
from django.db.models import Count
from interventions.models import InterventionCase
from alerts.models import Alert

@pytest.mark.django_db
def test_query_performance():
    print("\n" + "="*60)
    print("Testing Query Performance")
    print("="*60 + "\n")
    
    # Test 1: Intervention Cases (N+1 problem)
    print("Test 1: Loading 20 intervention cases with student data")
    reset_queries()
    
    start = time.time()
    # Without optimization (N+1 queries)
    cases = list(InterventionCase.objects.all()[:20])
    for case in cases:
        _ = case.student.full_name  # Triggers additional query per case
    duration_without = (time.time() - start) * 1000
    queries_without = len(connection.queries)
    
    print(f"  WITHOUT select_related:")
    print(f"    Queries: {queries_without}")
    print(f"    Time: {duration_without:.0f}ms")
    
    reset_queries()
    start = time.time()
    # With optimization
    cases = list(InterventionCase.objects.select_related('student', 'assigned_to')[:20])
    for case in cases:
        _ = case.student.full_name  # No additional query
    duration_with = (time.time() - start) * 1000
    queries_with = len(connection.queries)
    
    print(f"  WITH select_related:")
    print(f"    Queries: {queries_with}")
    print(f"    Time: {duration_with:.0f}ms")
    
    if queries_with < queries_without:
        improvement = ((queries_without - queries_with) / queries_without) * 100
        print(f"  ✓ IMPROVEMENT: {improvement:.0f}% fewer queries")
    else:
        print(f"  ✗ WARNING: No improvement detected")
    
    # Test 2: Dashboard aggregation
    print("\nTest 2: Dashboard statistics aggregation")
    reset_queries()
    
    start = time.time()
    stats = InterventionCase.objects.filter(
        assigned_to__role='form_master'
    ).select_related('student', 'assigned_to').values(
        'status'
    ).annotate(
        count=Count('case_id')
    )
    list(stats)  # Force evaluation
    duration = (time.time() - start) * 1000
    queries = len(connection.queries)
    
    print(f"  Queries: {queries}")
    print(f"  Time: {duration:.0f}ms")
    
    if queries <= 2:
        print(f"  ✓ PASS: Efficient aggregation")
    else:
        print(f"  ✗ WARNING: Too many queries for aggregation")
    
    print("\n" + "="*60)
    print("Performance Test Complete")
    print("="*60 + "\n")
