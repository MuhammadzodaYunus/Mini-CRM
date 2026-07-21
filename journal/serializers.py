from rest_framework import serializers

from accounts.models import Student
from accounts.serializers import StudentShortSerializer

from education.models import (
    Group,
    StudentEnroll,
    TimeTable,
)
from education.serializers import (
    GroupShortSerializer,
    TimeTableShortSerializer,
)

from .models import (
    Activity,
    ExamGrade,
    Grade,
)


class ActivitySerializer(serializers.ModelSerializer):
    student = StudentShortSerializer(
        read_only=True,
    )

    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source="student",
        write_only=True,
    )

    timetable = TimeTableShortSerializer(
        read_only=True,
    )

    timetable_id = serializers.PrimaryKeyRelatedField(
        queryset=TimeTable.objects.all(),
        source="timetable",
        write_only=True,
    )

    class Meta:
        model = Activity

        fields = [
            "id",
            "student",
            "student_id",
            "timetable",
            "timetable_id",
            "comment",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate(self, attrs):
        student = attrs.get("student")
        timetable = attrs.get("timetable")

        if self.instance is not None:
            if student is None:
                student = self.instance.student

            if timetable is None:
                timetable = self.instance.timetable

        enrollment = StudentEnroll.objects.filter(
            student=student,
            group=timetable.group,
            status="active",
        )

        if not enrollment.exists():
            raise serializers.ValidationError(
                "The student is not actively enrolled in this timetable group."
            )

        return attrs


class GradeSerializer(serializers.ModelSerializer):
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
        model = Grade

        fields = [
            "id",
            "student",
            "student_id",
            "group",
            "group_id",
            "grade",
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

        enrollment = StudentEnroll.objects.filter(
            student=student,
            group=group,
            status="active",
        )

        if not enrollment.exists():
            raise serializers.ValidationError(
                "The student is not actively enrolled in the selected group."
            )

        return attrs


class ExamGradeSerializer(serializers.ModelSerializer):
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

    timetable = TimeTableShortSerializer(
        read_only=True,
    )

    timetable_id = serializers.PrimaryKeyRelatedField(
        queryset=TimeTable.objects.all(),
        source="timetable",
        write_only=True,
    )

    class Meta:
        model = ExamGrade

        fields = [
            "id",
            "student",
            "student_id",
            "group",
            "group_id",
            "timetable",
            "timetable_id",
            "grade",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_grade(self, value):
        if value <= 0:
            raise serializers.ValidationError("Grade must be greater than zero.")

        return value

    def validate(self, attrs):
        student = attrs.get("student")
        group = attrs.get("group")
        timetable = attrs.get("timetable")

        if self.instance is not None:
            if student is None:
                student = self.instance.student

            if group is None:
                group = self.instance.group

            if timetable is None:
                timetable = self.instance.timetable

        enrollment = StudentEnroll.objects.filter(
            student=student,
            group=group,
            status="active",
        )

        if not enrollment.exists():
            raise serializers.ValidationError(
                "The student is not actively enrolled in the selected group."
            )

        if timetable.group != group:
            raise serializers.ValidationError(
                "The selected timetable does not belong to the selected group."
            )

        if timetable.is_exam is False:
            raise serializers.ValidationError(
                "The selected timetable is not marked as an exam day."
            )

        return attrs
