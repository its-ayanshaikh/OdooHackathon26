from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'is_staff', 'is_superuser', 'first_time_login')
        read_only_fields = fields


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'password')

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_role(self, value):
        if value not in User.Role.values:
            raise serializers.ValidationError('Invalid role.')
        if value == User.Role.DRIVER:
            raise serializers.ValidationError(
                'Driver accounts are created from the Drivers section, not here.'
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        is_admin = validated_data.get('role') == User.Role.ADMIN
        user = User(
            **validated_data,
            is_staff=is_admin,
            is_superuser=is_admin,
            first_time_login=True,
        )
        user.set_password(password)
        user.save()
        return user
