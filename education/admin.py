from django.contrib import admin
from .models import *

admin.site.register(Course)
admin.site.register(Group)
admin.site.register(StudentEnroll)
admin.site.register(MentorEnroll)
admin.site.register(TimeTable)