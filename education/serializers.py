from rest_framework import serializers

from accounts.models import Mentor, Student
from accounts.serializers import (
    MentorShortSerializer,
    StudentShortSerializer,
)

from .models import (
    Course,
    Group,
    MentorEnroll,
    StudentEnroll,
    TimeTable,
)


class CourseShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "price",
        ]


class GroupCourseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "title",
            "branch",
            "status",
            "start_date",
            "end_date",
        ]


class GroupShortSerializer(serializers.ModelSerializer):
    course = CourseShortSerializer(
        read_only=True,
    )

    class Meta:
        model = Group
        fields = [
            "id",
            "title",
            "course",
            "branch",
            "status",
            "start_date",
            "end_date",
        ]


class TimeTableShortSerializer(serializers.ModelSerializer):
    group = GroupShortSerializer(
        read_only=True,
    )

    class Meta:
        model = TimeTable
        fields = [
            "id",
            "group",
            "start_time",
            "end_time",
            "week_day",
            "is_exam",
        ]


class CourseSerializer(serializers.ModelSerializer):
    groups = GroupCourseItemSerializer(
        many=True,
        read_only=True,
    )

    groups_count = serializers.SerializerMethodField()
    active_groups_count = serializers.SerializerMethodField()

    class Meta:
        model = Course

        fields = [
            "id",
            "title",
            "description",
            "price",
            "groups_count",
            "active_groups_count",
            "groups",
        ]

        read_only_fields = [
            "id",
            "groups_count",
            "active_groups_count",
            "groups",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")

        return value

    def get_groups_count(self, obj):
        groups = obj.groups.all()

        count = groups.count()

        return count

    def get_active_groups_count(self, obj):
        active_groups = obj.groups.filter(
            status="active",
        )

        count = active_groups.count()

        return count


class GroupSerializer(serializers.ModelSerializer):
    course = CourseShortSerializer(
        read_only=True,
    )

    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source="course",
        write_only=True,
    )

    students_count = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()

    mentors_count = serializers.SerializerMethodField()
    mentors = serializers.SerializerMethodField()

    timetables = serializers.SerializerMethodField()

    class Meta:
        model = Group

        fields = [
            "id",
            "title",
            "description",
            "course",
            "course_id",
            "start_date",
            "end_date",
            "branch",
            "status",
            "students_count",
            "students",
            "mentors_count",
            "mentors",
            "timetables",
        ]

        read_only_fields = [
            "id",
            "students_count",
            "students",
            "mentors_count",
            "mentors",
            "timetables",
        ]

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if self.instance is not None:
            if start_date is None:
                start_date = self.instance.start_date

            if end_date is None:
                end_date = self.instance.end_date

        if start_date is not None and end_date is not None:
            if end_date <= start_date:
                raise serializers.ValidationError(
                    "End date must be after the start date."
                )

        return attrs

    def get_students_count(self, obj):
        active_enrollments = obj.student_enrollments.filter(
            status="active",
        )

        count = active_enrollments.count()

        return count

    def get_students(self, obj):
        enrollments = obj.student_enrollments.filter(
            status="active",
        )

        students_data = []

        for enrollment in enrollments:
            student = enrollment.student
            user = student.user

            full_name = user.get_full_name()

            if not full_name:
                full_name = user.username

            student_data = {
                "enrollment_id": enrollment.id,
                "student_id": student.id,
                "username": user.username,
                "full_name": full_name,
                "phone_number": user.phone_number,
                "birth_date": student.birth_date,
                "address": student.address,
                "status": enrollment.status,
            }

            students_data.append(
                student_data,
            )

        return students_data

    def get_mentors_count(self, obj):
        enrollments = obj.mentor_enrollments.all()

        count = enrollments.count()

        return count

    def get_mentors(self, obj):
        enrollments = obj.mentor_enrollments.all()

        mentors_data = []

        for enrollment in enrollments:
            mentor = enrollment.mentor
            user = mentor.user

            full_name = user.get_full_name()

            if not full_name:
                full_name = user.username

            mentor_data = {
                "mentor_enrollment_id": enrollment.id,
                "mentor_id": mentor.id,
                "username": user.username,
                "full_name": full_name,
                "phone_number": user.phone_number,
                "level": mentor.level,
            }

            mentors_data.append(
                mentor_data,
            )

        return mentors_data

    def get_timetables(self, obj):
        timetables = obj.timetables.order_by(
            "week_day",
            "start_time",
        )

        timetables_data = []

        for timetable in timetables:
            timetable_data = {
                "id": timetable.id,
                "week_day": timetable.week_day,
                "start_time": timetable.start_time,
                "end_time": timetable.end_time,
                "is_exam": timetable.is_exam,
            }

            timetables_data.append(
                timetable_data,
            )

        return timetables_data


class TimeTableSerializer(serializers.ModelSerializer):
    group = GroupShortSerializer(
        read_only=True,
    )

    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source="group",
        write_only=True,
    )

    class Meta:
        model = TimeTable

        fields = [
            "id",
            "group",
            "group_id",
            "start_time",
            "end_time",
            "week_day",
            "is_exam",
        ]

        read_only_fields = [
            "id",
        ]

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")

        if self.instance is not None:
            if start_time is None:
                start_time = self.instance.start_time

            if end_time is None:
                end_time = self.instance.end_time

        if start_time is not None and end_time is not None:
            if end_time <= start_time:
                raise serializers.ValidationError(
                    "End time must be after the start time."
                )

        return attrs


class StudentEnrollSerializer(serializers.ModelSerializer):
    student = StudentShortSerializer(
        read_only=True,
    )

    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source="student",
        write_only=True,
    )

    group = GroupShortSerializer(
        read_only=True,
    )

    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source="group",
        write_only=True,
    )

    class Meta:
        model = StudentEnroll

        fields = [
            "id",
            "student",
            "student_id",
            "group",
            "group_id",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate(self, attrs):
        student = attrs.get("student")
        group = attrs.get("group")

        if self.instance is not None:
            if student is None:
                student = self.instance.student

            if group is None:
                group = self.instance.group

        if student is None or group is None:
            raise serializers.ValidationError("Student and group are required.")

        same_course_enrollments = StudentEnroll.objects.filter(
            student=student,
            group__course=group.course,
        )

        if self.instance is not None:
            same_course_enrollments = same_course_enrollments.exclude(
                id=self.instance.id,
            )

        if same_course_enrollments.exists():
            raise serializers.ValidationError(
                "The student is already enrolled in this course."
            )

        return attrs

    def create(self, validated_data):
        student = validated_data.get("student")
        group = validated_data.get("group")

        active_enrollments = StudentEnroll.objects.filter(
            student=student,
            status="active",
        )

        active_enrollments.update(
            status="finished",
        )

        enrollment = StudentEnroll.objects.create(
            student=student,
            group=group,
            status="active",
        )

        return enrollment


class MentorEnrollSerializer(serializers.ModelSerializer):
    mentor = MentorShortSerializer(
        read_only=True,
    )

    mentor_id = serializers.PrimaryKeyRelatedField(
        queryset=Mentor.objects.all(),
        source="mentor",
        write_only=True,
    )

    group = GroupShortSerializer(
        read_only=True,
    )

    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source="group",
        write_only=True,
    )

    class Meta:
        model = MentorEnroll

        fields = [
            "id",
            "mentor",
            "mentor_id",
            "group",
            "group_id",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate(self, attrs):
        mentor = attrs.get("mentor")
        group = attrs.get("group")

        if self.instance is not None:
            if mentor is None:
                mentor = self.instance.mentor

            if group is None:
                group = self.instance.group

        duplicate_enrollments = MentorEnroll.objects.filter(
            mentor=mentor,
            group=group,
        )

        if self.instance is not None:
            duplicate_enrollments = duplicate_enrollments.exclude(
                id=self.instance.id,
            )

        if duplicate_enrollments.exists():
            raise serializers.ValidationError(
                "This mentor is already assigned to the selected group."
            )

        return attrs
