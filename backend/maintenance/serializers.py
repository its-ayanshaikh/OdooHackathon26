from rest_framework import serializers
from .models import MaintenanceLog


class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source='vehicle.reg_number', read_only=True)

    class Meta:
        model = MaintenanceLog
        fields = [
            'id',
            'vehicle',
            'vehicle_reg',
            'type',
            'description',
            'cost',
            'date',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'vehicle_reg', 'created_at', 'updated_at']
