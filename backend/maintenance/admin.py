from django.contrib import admin
from .models import MaintenanceLog


@admin.register(MaintenanceLog)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'type', 'status', 'cost', 'date')
    list_filter = ('status',)
    search_fields = ('vehicle__reg_number', 'type')
