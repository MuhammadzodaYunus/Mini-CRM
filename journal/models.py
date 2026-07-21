from django.db import models
from accounts.models import Student
from education.models import TimeTable, Group


class Activity(models.Model):

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="activities"
    )
    timetable = models.ForeignKey(
        TimeTable, on_delete=models.CASCADE, related_name="activities"
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.timetable}"


class Grade(models.Model):

    class GradeValue(models.IntegerChoices):
        ONE = 1, "1"
        TWO = 2, "2"
        THREE = 3, "3"
        FOUR = 4, "4"
        FIVE = 5, "5"

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="grades"
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="grades")
    grade = models.PositiveSmallIntegerField(choices=GradeValue.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.grade}"


class ExamGrade(models.Model):

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="exam_grades"
    )
    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name="exam_grades"
    )
    timetable = models.ForeignKey(
        TimeTable, on_delete=models.CASCADE, related_name="exam_grades"
    )
    
    grade = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.grade}"
