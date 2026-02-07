"""
URL configuration for school_support_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # AUTH
    path('api/auth/', include('users.urls_auth')),

    # USERS
    path('api/users/', include('users.urls')),

    # CLASSROOMS & STUDENTS
    path('api/classrooms/', include('students.urls_classrooms')),
    path('api/students/', include('students.urls')),

    # ATTENDANCE
    path('api/attendance/', include('attendance.urls')),

    # RISK
    path('api/risk/', include('risk.urls')),

    # ALERTS
    path('api/alerts/', include('alerts.urls')),

    # COUNSELLING
    path('api/counselling/', include('counselling.urls')),

    # INTERVENTIONS
    path('api/interventions/', include('interventions.urls')),

    #academics
    path("api/", include("academics.urls")),

]
