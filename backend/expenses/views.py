from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.utils import handle_exceptions, error_response
from .models import FuelLog, Expense
from .serializers import FuelLogSerializer, ExpenseSerializer


# ---------------- Fuel logs ----------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def fuel_list(request):
    if request.method == 'GET':
        qs = FuelLog.objects.select_related('vehicle').all()
        vehicle_f = request.query_params.get('vehicle')
        if vehicle_f:
            qs = qs.filter(vehicle_id=vehicle_f)
        return Response(FuelLogSerializer(qs, many=True).data)

    serializer = FuelLogSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def fuel_detail(request, pk):
    try:
        log = FuelLog.objects.get(pk=pk)
    except FuelLog.DoesNotExist:
        return error_response('Fuel log not found.', status.HTTP_404_NOT_FOUND)
    log.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------- Expenses ----------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def expense_list(request):
    if request.method == 'GET':
        qs = Expense.objects.select_related('vehicle').all()
        vehicle_f = request.query_params.get('vehicle')
        if vehicle_f:
            qs = qs.filter(vehicle_id=vehicle_f)
        return Response(ExpenseSerializer(qs, many=True).data)

    serializer = ExpenseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@handle_exceptions
def expense_detail(request, pk):
    try:
        expense = Expense.objects.get(pk=pk)
    except Expense.DoesNotExist:
        return error_response('Expense not found.', status.HTTP_404_NOT_FOUND)
    expense.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
