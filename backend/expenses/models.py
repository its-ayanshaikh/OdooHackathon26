from django.db import models
from vehicles.models import Vehicle


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    liters = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=12, decimal_places=2)
    odometer = models.PositiveIntegerField(null=True, blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.vehicle.reg_number} - {self.liters}L'


class Expense(models.Model):
    class Category(models.TextChoices):
        TOLL = 'Toll', 'Toll'
        PARKING = 'Parking', 'Parking'
        FINE = 'Fine', 'Fine'
        INSURANCE = 'Insurance', 'Insurance'
        MISC = 'Misc', 'Misc'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.MISC)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.vehicle.reg_number} - {self.category} {self.amount}'
