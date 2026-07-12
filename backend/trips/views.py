from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.utils import handle_exceptions, error_response
from vehicles.models import Vehicle
from drivers.models import Driver
from .models import Trip
from .serializers import TripSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def trip_list(request):
    if request.method == 'GET':
        qs = Trip.objects.select_related('vehicle', 'driver').all()
        status_f = request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return Response(TripSerializer(qs, many=True).data)

    serializer = TripSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(status=Trip.Status.DRAFT)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def trip_detail(request, pk):
    try:
        trip = Trip.objects.select_related('vehicle', 'driver').get(pk=pk)
    except Trip.DoesNotExist:
        return error_response('Trip not found.', status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TripSerializer(trip).data)

    if request.method in ('PUT', 'PATCH'):
        if trip.status != Trip.Status.DRAFT:
            return error_response('Only draft trips can be edited.')
        serializer = TripSerializer(trip, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # DELETE
    if trip.status == Trip.Status.DISPATCHED:
        return error_response('Cancel the trip before deleting it.')
    trip.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def trip_dispatch(request, pk):
    try:
        trip = Trip.objects.select_related('vehicle', 'driver').get(pk=pk)
    except Trip.DoesNotExist:
        return error_response('Trip not found.', status.HTTP_404_NOT_FOUND)

    if trip.status != Trip.Status.DRAFT:
        return error_response('Only draft trips can be dispatched.')

    vehicle, driver = trip.vehicle, trip.driver

    if vehicle.status != Vehicle.Status.AVAILABLE:
        return error_response('Vehicle is no longer available for dispatch.')
    if driver.status != Driver.Status.AVAILABLE:
        return error_response('Driver is no longer available for dispatch.')
    if driver.license_expired:
        return error_response("Driver's license has expired.")
    if trip.cargo_weight > vehicle.max_capacity:
        return error_response('Cargo weight exceeds vehicle capacity.')

    with transaction.atomic():
        trip.start_odometer = vehicle.odometer
        trip.status = Trip.Status.DISPATCHED
        trip.save()
        vehicle.status = Vehicle.Status.ON_TRIP
        vehicle.save(update_fields=['status'])
        driver.status = Driver.Status.ON_TRIP
        driver.save(update_fields=['status'])

    return Response(TripSerializer(trip).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def trip_complete(request, pk):
    try:
        trip = Trip.objects.select_related('vehicle', 'driver').get(pk=pk)
    except Trip.DoesNotExist:
        return error_response('Trip not found.', status.HTTP_404_NOT_FOUND)

    if trip.status != Trip.Status.DISPATCHED:
        return error_response('Only dispatched trips can be completed.')

    end_odometer = request.data.get('end_odometer')
    fuel_consumed = request.data.get('fuel_consumed')

    if end_odometer in (None, ''):
        return error_response('Final odometer reading is required.')
    try:
        end_odometer = int(end_odometer)
        fuel_consumed = float(fuel_consumed) if fuel_consumed not in (None, '') else 0
    except (TypeError, ValueError):
        return error_response('Odometer and fuel must be numeric.')

    vehicle, driver = trip.vehicle, trip.driver
    if end_odometer < vehicle.odometer:
        return error_response('Final odometer cannot be less than current reading.')

    with transaction.atomic():
        trip.end_odometer = end_odometer
        trip.fuel_consumed = fuel_consumed
        trip.status = Trip.Status.COMPLETED
        trip.save()

        vehicle.odometer = end_odometer
        vehicle.status = Vehicle.Status.AVAILABLE
        vehicle.save(update_fields=['odometer', 'status'])

        driver.status = Driver.Status.AVAILABLE
        driver.save(update_fields=['status'])

        # Auto-log fuel for the completed trip
        if fuel_consumed:
            from expenses.models import FuelLog

            FuelLog.objects.create(
                vehicle=vehicle,
                liters=fuel_consumed,
                cost=round(fuel_consumed * 95, 2),
                odometer=end_odometer,
                date=timezone.now().date(),
            )

    return Response(TripSerializer(trip).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def trip_cancel(request, pk):
    try:
        trip = Trip.objects.select_related('vehicle', 'driver').get(pk=pk)
    except Trip.DoesNotExist:
        return error_response('Trip not found.', status.HTTP_404_NOT_FOUND)

    if trip.status in (Trip.Status.COMPLETED, Trip.Status.CANCELLED):
        return error_response('This trip can no longer be cancelled.')

    was_dispatched = trip.status == Trip.Status.DISPATCHED

    with transaction.atomic():
        trip.status = Trip.Status.CANCELLED
        trip.save(update_fields=['status'])

        if was_dispatched:
            vehicle, driver = trip.vehicle, trip.driver
            if vehicle.status == Vehicle.Status.ON_TRIP:
                vehicle.status = Vehicle.Status.AVAILABLE
                vehicle.save(update_fields=['status'])
            if driver.status == Driver.Status.ON_TRIP:
                driver.status = Driver.Status.AVAILABLE
                driver.save(update_fields=['status'])

    return Response(TripSerializer(trip).data)
