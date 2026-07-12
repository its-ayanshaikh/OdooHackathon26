from datetime import date
from django.db import models


class Driver(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'Available', 'Available'
        ON_TRIP = 'On Trip', 'On Trip'
        OFF_DUTY = 'Off Duty', 'Off Duty'
        SUSPENDED = 'Suspended', 'Suspended'

    class License(models.TextChoices):
        LMV = 'LMV', 'LMV'
        HMV = 'HMV', 'HMV'
        HGV = 'HGV', 'HGV'
        PSV = 'PSV', 'PSV'

    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    license_number = models.CharField(max_length=40, unique=True)
    license_category = models.CharField(max_length=8, choices=License.choices, default=License.LMV)
    license_expiry = models.DateField()
    contact = models.CharField(max_length=32, blank=True)
    safety_score = models.PositiveSmallIntegerField(default=80)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.license_number})'

    @property
    def license_expired(self):
        return self.license_expiry < date.today()

    @property
    def is_assignable(self):
        return self.status == self.Status.AVAILABLE and not self.license_expired
