from rest_framework import serializers
from vehicles.models import Vehicle
from drivers.models import Driver
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    # Read-only friendly labels for the frontend
    vehicle_reg = serializers.CharField(source='vehicle.reg_number', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id',
            'source',
            'destination',
            'vehicle',
            'driver',
            'vehicle_reg',
            'driver_name',
            'cargo_weight',
            'planned_distance',
            'revenue',
            'status',
            'start_odometer',
            'end_odometer',
            'fuel_consumed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'start_odometer',
            'end_odometer',
            'fuel_consumed',
            'vehicle_reg',
            'driver_name',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        vehicle = attrs.get('vehicle') or getattr(self.instance, 'vehicle', None)
        driver = attrs.get('driver') or getattr(self.instance, 'driver', None)
        cargo = attrs.get('cargo_weight', getattr(self.instance, 'cargo_weight', 0))

        # Cargo weight must not exceed capacity
        if vehicle and cargo and cargo > vehicle.max_capacity:
            raise serializers.ValidationError(
                {'cargo_weight': f'Cargo ({cargo} kg) exceeds capacity ({vehicle.max_capacity} kg).'}
            )

        # Only validate availability for new drafts (creation)
        if self.instance is None:
            if vehicle and vehicle.status != Vehicle.Status.AVAILABLE:
                raise serializers.ValidationError(
                    {'vehicle': 'Selected vehicle is not available.'}
                )
            if driver and driver.status != Driver.Status.AVAILABLE:
                raise serializers.ValidationError(
                    {'driver': 'Selected driver is not available.'}
                )
            if driver and driver.license_expired:
                raise serializers.ValidationError(
                    {'driver': "Driver's license has expired."}
                )
        return attrs
