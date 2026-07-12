from django.db import models


class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'Available', 'Available'
        ON_TRIP = 'On Trip', 'On Trip'
        IN_SHOP = 'In Shop', 'In Shop'
        RETIRED = 'Retired', 'Retired'

    class Type(models.TextChoices):
        VAN = 'Van', 'Van'
        TRUCK = 'Truck', 'Truck'
        TRAILER = 'Trailer', 'Trailer'
        PICKUP = 'Pickup', 'Pickup'
        BUS = 'Bus', 'Bus'

    reg_number = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.VAN)
    max_capacity = models.PositiveIntegerField(help_text='Max load in kg')
    odometer = models.PositiveIntegerField(default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    region = models.CharField(max_length=40, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['reg_number']

    def __str__(self):
        return f'{self.reg_number} - {self.name}'

    @property
    def is_dispatchable(self):
        return self.status == self.Status.AVAILABLE
