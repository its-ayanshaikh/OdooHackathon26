from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('reg_number', 'name', 'type', 'status', 'region', 'odometer')
    list_filter = ('status', 'type', 'region')
    search_fields = ('reg_number', 'name')
