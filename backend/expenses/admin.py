from django.contrib import admin
from .models import FuelLog, Expense


@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'liters', 'cost', 'odometer', 'date')
    search_fields = ('vehicle__reg_number',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'category', 'amount', 'date')
    list_filter = ('category',)
    search_fields = ('vehicle__reg_number',)
