from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveDestroyAPIView,
)

from accounts.permissions import IsAdminOrMentorOrReadOnly
from education.models import MentorEnroll

from .models import Activity, ExamGrade, Grade
from .serializers import (
    ActivitySerializer,
    ExamGradeSerializer,
    GradeSerializer,
)


class ActivityListCreateView(ListCreateAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        activities = Activity.objects.all()

        if user.is_staff:
            return activities

        if hasattr(user, "mentor"):
            activities = activities.filter(
                timetable__group__mentor_enrollments__mentor=user.mentor,
            )

            return activities

        if hasattr(user, "student"):
            return activities.filter(
                student=user.student,
            )

        return activities.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_staff:
            serializer.save()
            return

        timetable = serializer.validated_data.get(
            "timetable",
        )

        group = timetable.group
        mentor = user.mentor

        mentor_enrollments = MentorEnroll.objects.filter(
            mentor=mentor,
            group=group,
        )

        if not mentor_enrollments.exists():
            raise PermissionDenied("You are not assigned to this group.")

        serializer.save()


class ActivityDetailView(RetrieveDestroyAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        activities = Activity.objects.all()

        if user.is_staff:
            return activities

        if hasattr(user, "mentor"):
            activities = activities.filter(
                timetable__group__mentor_enrollments__mentor=user.mentor,
            )

            return activities

        if hasattr(user, "student"):
            return activities.filter(
                student=user.student,
            )

        return activities.none()


class GradeListCreateView(ListCreateAPIView):
    serializer_class = GradeSerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        grades = Grade.objects.all()

        if user.is_staff:
            return grades

        if hasattr(user, "mentor"):
            grades = grades.filter(
                group__mentor_enrollments__mentor=user.mentor,
            )

            return grades

        if hasattr(user, "student"):
            return grades.filter(
                student=user.student,
            )

        return grades.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_staff:
            serializer.save()
            return

        group = serializer.validated_data.get(
            "group",
        )

        mentor = user.mentor

        mentor_enrollments = MentorEnroll.objects.filter(
            mentor=mentor,
            group=group,
        )

        if not mentor_enrollments.exists():
            raise PermissionDenied("You are not assigned to this group.")

        serializer.save()


class GradeDetailView(RetrieveDestroyAPIView):
    serializer_class = GradeSerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        grades = Grade.objects.all()

        if user.is_staff:
            return grades

        if hasattr(user, "mentor"):
            grades = grades.filter(
                group__mentor_enrollments__mentor=user.mentor,
            )

            return grades

        if hasattr(user, "student"):
            return grades.filter(
                student=user.student,
            )

        return grades.none()


class ExamGradeListCreateView(ListCreateAPIView):
    serializer_class = ExamGradeSerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        exam_grades = ExamGrade.objects.all()

        if user.is_staff:
            return exam_grades

        if hasattr(user, "mentor"):
            exam_grades = exam_grades.filter(
                group__mentor_enrollments__mentor=user.mentor,
            )

            return exam_grades

        if hasattr(user, "student"):
            return exam_grades.filter(
                student=user.student,
            )

        return exam_grades.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_staff:
            serializer.save()
            return

        group = serializer.validated_data.get(
            "group",
        )

        mentor = user.mentor

        mentor_enrollments = MentorEnroll.objects.filter(
            mentor=mentor,
            group=group,
        )

        if not mentor_enrollments.exists():
            raise PermissionDenied("You are not assigned to this group.")

        serializer.save()


class ExamGradeDetailView(RetrieveDestroyAPIView):
    serializer_class = ExamGradeSerializer
    permission_classes = [IsAdminOrMentorOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        exam_grades = ExamGrade.objects.all()

        if user.is_staff:
            return exam_grades

        if hasattr(user, "mentor"):
            exam_grades = exam_grades.filter(
                group__mentor_enrollments__mentor=user.mentor,
            )

            return exam_grades

        if hasattr(user, "student"):
            return exam_grades.filter(
                student=user.student,
            )

        return exam_grades.none()
