from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=20, unique=True)

    REQUIRED_FIELDS = ["phone_number"]


class Student(models.Model):

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    birth_date = models.DateField()
    address = models.CharField(max_length=50)

    def __str__(self):
        return self.user.username


class Mentor(models.Model):

    LEVEL_CHOICES = [
        ("junior", "Junior"),
        ("middle", "Middle"),
        ("senior", "Senior"),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    birth_date = models.DateField()
    address = models.CharField(max_length=50)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default="junior")

    def __str__(self):
        return self.user.username
