from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from accounts.permissions import (
    IsAdmin,
    IsAdminOrReadOnly,
)

from .models import (
    Course,
    Group,
    MentorEnroll,
    StudentEnroll,
    TimeTable,
)

from .serializers import (
    CourseSerializer,
    GroupSerializer,
    MentorEnrollSerializer,
    StudentEnrollSerializer,
    TimeTableSerializer,
)


def get_courses(user):
    courses = Course.objects.all()

    if user.is_staff:
        return courses

    if hasattr(user, "mentor"):
        courses = courses.filter(
            groups__mentor_enrollments__mentor=user.mentor,
        )

        return courses

    if hasattr(user, "student"):
        courses = courses.filter(
            groups__student_enrollments__student=user.student,
            groups__student_enrollments__status="active",
        )

        return courses

    return courses.none()


def get_groups(user):
    groups = Group.objects.all()

    if user.is_staff:
        return groups

    if hasattr(user, "mentor"):
        groups = groups.filter(
            mentor_enrollments__mentor=user.mentor,
        )

        return groups

    if hasattr(user, "student"):
        groups = groups.filter(
            student_enrollments__student=user.student,
            student_enrollments__status="active",
        )

        return groups

    return groups.none()


def get_timetables(user):
    timetables = TimeTable.objects.all()

    if user.is_staff:
        return timetables

    if hasattr(user, "mentor"):
        timetables = timetables.filter(
            group__mentor_enrollments__mentor=user.mentor,
        )

        return timetables

    if hasattr(user, "student"):
        timetables = timetables.filter(
            group__student_enrollments__student=user.student,
            group__student_enrollments__status="active",
        )

        return timetables

    return timetables.none()


class CourseListCreateView(ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_courses(user)


class CourseDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_courses(user)


class GroupListCreateView(ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_groups(user)


class GroupDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_groups(user)


class TimeTableListCreateView(ListCreateAPIView):
    serializer_class = TimeTableSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_timetables(user)


class TimeTableDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = TimeTableSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_timetables(user)


class StudentEnrollListCreateView(ListCreateAPIView):
    serializer_class = StudentEnrollSerializer
    permission_classes = [IsAdmin]

    queryset = StudentEnroll.objects.all()


class StudentEnrollDetailView(RetrieveUpdateAPIView):
    serializer_class = StudentEnrollSerializer
    permission_classes = [IsAdmin]

    queryset = StudentEnroll.objects.all()


class MentorEnrollListCreateView(ListCreateAPIView):
    serializer_class = MentorEnrollSerializer
    permission_classes = [IsAdmin]

    queryset = MentorEnroll.objects.all()


class MentorEnrollDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = MentorEnrollSerializer
    permission_classes = [IsAdmin]

    queryset = MentorEnroll.objects.all()
