from django.db import models
from accounts.models import Student, Mentor


class Course(models.Model):

    title = models.CharField(max_length=50)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.title


class Group(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("finished", "Finished"),
    ]

    title = models.CharField(max_length=50)
    description = models.TextField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="groups")
    start_date = models.DateField()
    end_date = models.DateField()
    branch = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")

    def __str__(self):
        return self.title


class StudentEnroll(models.Model):

    STATUS_CHOICES = [
        ("active", "Active"),
        ("finished", "Finished"),
    ]

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="enrollments"
    )
    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name="student_enrollments"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.group.title}"


class MentorEnroll(models.Model):

    mentor = models.ForeignKey(
        Mentor, on_delete=models.CASCADE, related_name="enrollments"
    )
    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name="mentor_enrollments"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mentor.user.username} - {self.group.title}"


class TimeTable(models.Model):

    WEEK_CHOICES = [
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
        ("saturday", "Saturday"),
        ("sunday", "Sunday"),
    ]

    group = models.ForeignKey(
        Group, on_delete=models.CASCADE, related_name="timetables"
    )

    start_time = models.TimeField()
    end_time = models.TimeField()
    week_day = models.CharField(max_length=10, choices=WEEK_CHOICES)
    is_exam = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.group.title} - {self.week_day} - {self.start_time}"