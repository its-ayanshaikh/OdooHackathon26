from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.utils import handle_exceptions, error_response
from vehicles.models import Vehicle
from .models import MaintenanceLog
from .serializers import MaintenanceSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def maintenance_list(request):
    if request.method == 'GET':
        qs = MaintenanceLog.objects.select_related('vehicle').all()
        status_f = request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return Response(MaintenanceSerializer(qs, many=True).data)

    serializer = MaintenanceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    vehicle = serializer.validated_data['vehicle']

    if vehicle.status == Vehicle.Status.ON_TRIP:
        return error_response('Cannot service a vehicle that is on a trip.')
    if vehicle.status == Vehicle.Status.RETIRED:
        return error_response('Cannot service a retired vehicle.')

    with transaction.atomic():
        record = serializer.save()
        # Active maintenance -> vehicle In Shop
        if record.status == MaintenanceLog.Status.ACTIVE:
            vehicle.status = Vehicle.Status.IN_SHOP
            vehicle.save(update_fields=['status'])

    return Response(MaintenanceSerializer(record).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def maintenance_detail(request, pk):
    try:
        record = MaintenanceLog.objects.select_related('vehicle').get(pk=pk)
    except MaintenanceLog.DoesNotExist:
        return error_response('Maintenance record not found.', status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MaintenanceSerializer(record).data)

    record.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def maintenance_close(request, pk):
    try:
        record = MaintenanceLog.objects.select_related('vehicle').get(pk=pk)
    except MaintenanceLog.DoesNotExist:
        return error_response('Maintenance record not found.', status.HTTP_404_NOT_FOUND)

    if record.status == MaintenanceLog.Status.CLOSED:
        return error_response('This maintenance record is already closed.')

    vehicle = record.vehicle

    with transaction.atomic():
        record.status = MaintenanceLog.Status.CLOSED
        record.save(update_fields=['status'])

        # Restore vehicle to Available unless it's retired or has other active logs
        other_active = MaintenanceLog.objects.filter(
            vehicle=vehicle, status=MaintenanceLog.Status.ACTIVE
        ).exclude(pk=record.pk).exists()

        if (
            vehicle.status == Vehicle.Status.IN_SHOP
            and not other_active
        ):
            vehicle.status = Vehicle.Status.AVAILABLE
            vehicle.save(update_fields=['status'])

    return Response(MaintenanceSerializer(record).data)
