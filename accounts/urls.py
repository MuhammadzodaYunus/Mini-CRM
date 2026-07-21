from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    RegisterView,
    MeView,
    StudentListCreateView,
    StudentDetailView,
    MentorListCreateView,
    MentorDetailView,
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
    path(
        "students/",
        StudentListCreateView.as_view(),
        name="student-list-create",
    ),
    path(
        "students/<int:pk>/",
        StudentDetailView.as_view(),
        name="student-detail",
    ),
    path(
        "mentors/",
        MentorListCreateView.as_view(),
        name="mentor-list-create",
    ),
    path(
        "mentors/<int:pk>/",
        MentorDetailView.as_view(),
        name="mentor-detail",
    ),
]
