from django.contrib import admin
from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('source', 'destination', 'vehicle', 'driver', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('source', 'destination')
