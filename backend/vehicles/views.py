from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.utils import handle_exceptions, error_response
from .models import Vehicle
from .serializers import VehicleSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def vehicle_list(request):
    if request.method == 'GET':
        qs = Vehicle.objects.all()

        # Optional filters
        status_f = request.query_params.get('status')
        type_f = request.query_params.get('type')
        region_f = request.query_params.get('region')
        search = request.query_params.get('search')
        if status_f:
            qs = qs.filter(status=status_f)
        if type_f:
            qs = qs.filter(type=type_f)
        if region_f:
            qs = qs.filter(region=region_f)
        if search:
            qs = qs.filter(reg_number__icontains=search) | qs.filter(name__icontains=search)

        return Response(VehicleSerializer(qs, many=True).data)

    serializer = VehicleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def vehicle_detail(request, pk):
    try:
        vehicle = Vehicle.objects.get(pk=pk)
    except Vehicle.DoesNotExist:
        return error_response('Vehicle not found.', status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(VehicleSerializer(vehicle).data)

    if request.method in ('PUT', 'PATCH'):
        serializer = VehicleSerializer(
            vehicle, data=request.data, partial=(request.method == 'PATCH')
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # DELETE
    if vehicle.status == Vehicle.Status.ON_TRIP:
        return error_response('Cannot delete a vehicle that is on a trip.')
    vehicle.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
