from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, Student, Mentor


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "Маълумоти иловагӣ",
            {
                "fields": ("phone_number",),
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Маълумоти иловагӣ",
            {
                "fields": ("phone_number",),
            },
        ),
    )

    list_display = (
        "id",
        "username",
        "phone_number",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "phone_number",
        "email",
    )

    ordering = ("id",)


admin.site.register(Student)
admin.site.register(Mentor)
