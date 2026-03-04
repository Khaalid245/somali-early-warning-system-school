from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class DashboardPagination(PageNumberPagination):
    """Custom pagination for dashboard lists (alerts, students, etc.)"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data
        })

def paginate_queryset(queryset, request, page_size=10):
    """Helper function to paginate any queryset"""
    paginator = DashboardPagination()
    paginator.page_size = page_size
    return paginator.paginate_queryset(queryset, request)

def get_paginated_data(queryset, request, page_size=10):
    """Get paginated data with metadata"""
    paginator = DashboardPagination()
    paginator.page_size = page_size
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        return {
            'results': list(page),
            'count': paginator.page.paginator.count,
            'total_pages': paginator.page.paginator.num_pages,
            'current_page': paginator.page.number,
            'has_next': paginator.page.has_next(),
            'has_previous': paginator.page.has_previous()
        }
    
    return {
        'results': list(queryset),
        'count': queryset.count() if hasattr(queryset, 'count') else len(queryset),
        'total_pages': 1,
        'current_page': 1,
        'has_next': False,
        'has_previous': False
    }
