from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.utils import handle_exceptions, error_response
from .models import Driver
from .serializers import DriverSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def driver_list(request):
    if request.method == 'GET':
        qs = Driver.objects.all()
        status_f = request.query_params.get('status')
        search = request.query_params.get('search')
        if status_f:
            qs = qs.filter(status=status_f)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(license_number__icontains=search)
        return Response(DriverSerializer(qs, many=True).data)

    serializer = DriverSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def driver_detail(request, pk):
    try:
        driver = Driver.objects.get(pk=pk)
    except Driver.DoesNotExist:
        return error_response('Driver not found.', status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DriverSerializer(driver).data)

    if request.method in ('PUT', 'PATCH'):
        serializer = DriverSerializer(
            driver, data=request.data, partial=(request.method == 'PATCH')
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if driver.status == Driver.Status.ON_TRIP:
        return error_response('Cannot delete a driver who is on a trip.')
    driver.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
