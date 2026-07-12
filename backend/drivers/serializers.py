from rest_framework import serializers
from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    license_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id',
            'name',
            'email',
            'license_number',
            'license_category',
            'license_expiry',
            'contact',
            'safety_score',
            'status',
            'license_expired',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'license_expired', 'created_at', 'updated_at']

    def validate_license_number(self, value):
        value = value.strip()
        qs = Driver.objects.filter(license_number__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('License number already exists.')
        return value

    def validate_email(self, value):
        # Email is required so the driver gets a login account.
        if not (value or '').strip():
            raise serializers.ValidationError('Email is required to create a driver login.')
        return value.strip().lower()

    def validate_contact(self, value):
        # Contact is required and used as the driver's initial password.
        if not (value or '').strip():
            raise serializers.ValidationError('Contact number is required (used as initial password).')
        return value.strip()

    def validate_safety_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Safety score must be between 0 and 100.')
        return value
