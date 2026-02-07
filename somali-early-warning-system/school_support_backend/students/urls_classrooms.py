from django.urls import path
from .views_classrooms import ClassroomListCreateView

urlpatterns = [
    path('', ClassroomListCreateView.as_view(), name='classroom-list-create'),
]
