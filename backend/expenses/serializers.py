from rest_framework import serializers
from .models import FuelLog, Expense


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source='vehicle.reg_number', read_only=True)

    class Meta:
        model = FuelLog
        fields = ['id', 'vehicle', 'vehicle_reg', 'liters', 'cost', 'odometer', 'date', 'created_at']
        read_only_fields = ['id', 'vehicle_reg', 'created_at']

    def validate_liters(self, value):
        if value <= 0:
            raise serializers.ValidationError('Liters must be greater than zero.')
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_reg = serializers.CharField(source='vehicle.reg_number', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'vehicle', 'vehicle_reg', 'category', 'amount', 'date', 'note', 'created_at']
        read_only_fields = ['id', 'vehicle_reg', 'created_at']

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('Amount cannot be negative.')
        return value
