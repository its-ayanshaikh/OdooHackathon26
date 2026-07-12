from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id',
            'reg_number',
            'name',
            'type',
            'max_capacity',
            'odometer',
            'acquisition_cost',
            'region',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_reg_number(self, value):
        value = value.strip()
        qs = Vehicle.objects.filter(reg_number__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Registration number must be unique.')
        return value
