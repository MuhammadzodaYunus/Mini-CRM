from django.urls import path

from .views import (
    ActivityListCreateView,
    ActivityDetailView,
    GradeListCreateView,
    GradeDetailView,
    ExamGradeListCreateView,
    ExamGradeDetailView,
)

urlpatterns = [
    path(
        "activities/",
        ActivityListCreateView.as_view(),
        name="activity-list-create",
    ),
    path(
        "activities/<int:pk>/",
        ActivityDetailView.as_view(),
        name="activity-detail",
    ),
    path(
        "grades/",
        GradeListCreateView.as_view(),
        name="grade-list-create",
    ),
    path(
        "grades/<int:pk>/",
        GradeDetailView.as_view(),
        name="grade-detail",
    ),
    path(
        "exam-grades/",
        ExamGradeListCreateView.as_view(),
        name="exam-grade-list-create",
    ),
    path(
        "exam-grades/<int:pk>/",
        ExamGradeDetailView.as_view(),
        name="exam-grade-detail",
    ),
]
