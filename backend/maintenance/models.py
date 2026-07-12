from django.db import models
from vehicles.models import Vehicle


class MaintenanceLog(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        CLOSED = 'Closed', 'Closed'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_logs')
    type = models.CharField(max_length=60)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.vehicle.reg_number} - {self.type} ({self.status})'
