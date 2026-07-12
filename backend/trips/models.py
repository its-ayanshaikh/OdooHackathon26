from django.db import models
from vehicles.models import Vehicle
from drivers.models import Driver


class Trip(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        DISPATCHED = 'Dispatched', 'Dispatched'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    source = models.CharField(max_length=120)
    destination = models.CharField(max_length=120)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name='trips')
    cargo_weight = models.PositiveIntegerField(help_text='kg')
    planned_distance = models.PositiveIntegerField(help_text='km')
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    start_odometer = models.PositiveIntegerField(null=True, blank=True)
    end_odometer = models.PositiveIntegerField(null=True, blank=True)
    fuel_consumed = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.source} -> {self.destination} ({self.status})'
