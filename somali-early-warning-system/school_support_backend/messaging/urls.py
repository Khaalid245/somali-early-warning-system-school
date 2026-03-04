from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, FormMasterListView

router = DefaultRouter()
router.register(r'', MessageViewSet, basename='message')

urlpatterns = [
    path('form-masters/', FormMasterListView.as_view(), name='form-masters'),
    path('', include(router.urls)),
]
