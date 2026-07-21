from rest_framework import serializers

from education.models import MentorEnroll

from .models import CustomUser, Mentor, Student


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "username",
            "password",
            "phone_number",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        username = validated_data.get("username")
        password = validated_data.get("password")
        phone_number = validated_data.get("phone_number")

        user = CustomUser.objects.create_user(
            username=username,
            password=password,
            phone_number=phone_number,
        )

        return user


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        read_only_fields = ["id"]


class StudentShortSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "birth_date",
            "address",
        ]


class MentorShortSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = Mentor
        fields = [
            "id",
            "user",
            "birth_date",
            "address",
            "level",
        ]


class StudentSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source="user",
        write_only=True,
    )
    active_group = serializers.SerializerMethodField()
    education_history = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "user_id",
            "user",
            "birth_date",
            "address",
            "active_group",
            "education_history",
        ]
        read_only_fields = ["id", "active_group", "education_history"]

    def get_active_group(self, obj):
        enrollments = obj.enrollments.select_related(
            "group__course",
        )

        active_enrollments = enrollments.filter(
            status="active",
        )

        enrollment = active_enrollments.first()

        if enrollment is None:
            return None

        group = enrollment.group
        course = group.course

        return {
            "enrollment_id": enrollment.id,
            "group_id": group.id,
            "group_title": group.title,
            "branch": group.branch,
            "group_status": group.status,
            "group_start_date": group.start_date,
            "group_end_date": group.end_date,
            "course_id": course.id,
            "course_title": course.title,
            "course_price": course.price,
            "enrollment_status": enrollment.status,
        }

    def get_education_history(self, obj):
        enrollments = obj.enrollments.select_related("group__course").order_by(
            "-created_at"
        )

        history = []

        for enrollment in enrollments:

            enrollment_data = {
                "enrollment_id": enrollment.id,
                "group_id": enrollment.group.id,
                "group_title": enrollment.group.title,
                "branch": enrollment.group.branch,
                "group_status": enrollment.group.status,
                "group_start_date": enrollment.group.start_date,
                "group_end_date": enrollment.group.end_date,
                "course_id": enrollment.group.course.id,
                "course_title": enrollment.group.course.title,
                "course_price": enrollment.group.course.price,
                "status": enrollment.status,
                "created_at": enrollment.created_at,
            }

            history.append(enrollment_data)
        return history


class MentorSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source="user",
        write_only=True,
    )
    groups = serializers.SerializerMethodField()

    class Meta:
        model = Mentor
        fields = [
            "id",
            "user_id",
            "user",
            "birth_date",
            "address",
            "level",
            "groups",
        ]
        read_only_fields = ["id", "groups"]

    def get_groups(self, obj):
        enrollments = (
            MentorEnroll.objects.filter(mentor=obj)
            .select_related("group__course")
            .order_by("-created_at")
        )

        groups = []

        for enrollment in enrollments:

            group_data = {
                "mentor_enrollment_id": enrollment.id,
                "group_id": enrollment.group.id,
                "group_title": enrollment.group.title,
                "group_status": enrollment.group.status,
                "branch": enrollment.group.branch,
                "start_date": enrollment.group.start_date,
                "end_date": enrollment.group.end_date,
                "course_id": enrollment.group.course.id,
                "course_title": enrollment.group.course.title,
                "course_price": enrollment.group.course.price,
                "created_at": enrollment.created_at,
            }

            groups.append(group_data)

        return groups