from rest_framework.generics import (
    CreateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Mentor, Student
from .permissions import IsAdminOrReadOnly
from .serializers import (
    CustomUserSerializer,
    MentorSerializer,
    RegisterSerializer,
    StudentSerializer,
)


def get_students_for_user(user):
    students = Student.objects.all()

    if user.is_staff:
        return students

    if hasattr(user, "mentor"):
        students = students.filter(
            enrollments__status="active",
            enrollments__group__mentor_enrollments__mentor=user.mentor,
        )

        return students

    if hasattr(user, "student"):
        return students.filter(
            user=user,
        )

    return students.none()


def get_mentors_for_user(user):
    mentors = Mentor.objects.all()

    if user.is_staff:
        return mentors

    if hasattr(user, "mentor"):
        return mentors.filter(
            user=user,
        )

    if hasattr(user, "student"):
        mentors = mentors.filter(
            enrollments__group__student_enrollments__student=user.student,
            enrollments__group__student_enrollments__status="active",
        )

        return mentors

    return mentors.none()


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        role = "user"
        profile = None

        if user.is_staff:
            role = "admin"

        elif hasattr(user, "mentor"):
            role = "mentor"
            profile = MentorSerializer(
                user.mentor,
            ).data

        elif hasattr(user, "student"):
            role = "student"
            profile = StudentSerializer(
                user.student,
            ).data

        data = {
            "role": role,
            "user": CustomUserSerializer(user).data,
            "profile": profile,
        }

        return Response(data)

    def patch(self, request):
        user = request.user

        user_serializer = CustomUserSerializer(
            user,
            data=request.data,
            partial=True,
        )

        user_serializer.is_valid(
            raise_exception=True,
        )

        user_serializer.save()

        if hasattr(user, "mentor"):
            mentor_serializer = MentorSerializer(
                user.mentor,
                data=request.data,
                partial=True,
            )

            mentor_serializer.is_valid(
                raise_exception=True,
            )

            mentor_serializer.save()

        elif hasattr(user, "student"):
            student_serializer = StudentSerializer(
                user.student,
                data=request.data,
                partial=True,
            )

            student_serializer.is_valid(
                raise_exception=True,
            )

            student_serializer.save()

        return self.get(request)


class StudentListCreateView(ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_students_for_user(user)


class StudentDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_students_for_user(user)


class MentorListCreateView(ListCreateAPIView):
    serializer_class = MentorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_mentors_for_user(user)


class MentorDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = MentorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        return get_mentors_for_user(user)
