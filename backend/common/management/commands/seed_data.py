from django.core.management.base import BaseCommand
from django.db import transaction

from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip
from maintenance.models import MaintenanceLog
from expenses.models import FuelLog, Expense

VEHICLES = [
    ('MH-01-AB-1234', 'Tata Ace Gold', 'Van', 750, 48200, 650000, 'West', 'Available'),
    ('MH-02-CD-5678', 'Ashok Leyland Dost', 'Van', 1250, 91500, 890000, 'West', 'On Trip'),
    ('DL-03-EF-9012', 'Eicher Pro 2049', 'Truck', 5000, 132000, 1850000, 'North', 'Available'),
    ('KA-04-GH-3456', 'BharatBenz 1617R', 'Truck', 9000, 205400, 3200000, 'South', 'In Shop'),
    ('TN-05-IJ-7890', 'Mahindra Bolero Pik-Up', 'Pickup', 1500, 67800, 920000, 'South', 'Available'),
    ('GJ-06-KL-2345', 'Tata Prima 5530', 'Trailer', 25000, 310000, 5400000, 'West', 'On Trip'),
    ('UP-07-MN-6789', 'Force Traveller', 'Bus', 2000, 88900, 1650000, 'Central', 'Available'),
    ('RJ-08-OP-1122', 'Tata 407', 'Truck', 2500, 178000, 1100000, 'North', 'Retired'),
]

DRIVERS = [
    ('Alex Fernandes', 'MH1420110012345', 'HMV', '2027-08-15', '+91 98200 11223', 92, 'Available'),
    ('Ravi Kumar', 'DL0320090054321', 'HGV', '2026-11-30', '+91 99100 44556', 88, 'On Trip'),
    ('Suresh Patel', 'GJ0620150098765', 'HMV', '2026-03-10', '+91 97250 77889', 75, 'Available'),
    ('Mohammed Iqbal', 'KA0420120033445', 'HGV', '2028-01-20', '+91 96860 22110', 95, 'On Trip'),
    ('Deepak Sharma', 'UP0720180066778', 'LMV', '2026-06-05', '+91 94150 99001', 61, 'Suspended'),
    ('Vijay Singh', 'RJ0820100011224', 'HMV', '2027-12-01', '+91 93140 55667', 84, 'Available'),
    ('Anil More', 'MH0220160044556', 'PSV', '2026-09-18', '+91 90040 33445', 79, 'Off Duty'),
]


class Command(BaseCommand):
    help = 'Seed demo fleet data (vehicles, drivers, trips, maintenance, fuel, expenses).'

    def add_arguments(self, parser):
        parser.add_argument('--fresh', action='store_true', help='Delete existing data first.')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['fresh']:
            Trip.objects.all().delete()
            MaintenanceLog.objects.all().delete()
            FuelLog.objects.all().delete()
            Expense.objects.all().delete()
            Driver.objects.all().delete()
            Vehicle.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared existing fleet data.'))

        v = {}
        for reg, name, vtype, cap, odo, cost, region, st in VEHICLES:
            obj, _ = Vehicle.objects.get_or_create(
                reg_number=reg,
                defaults=dict(name=name, type=vtype, max_capacity=cap, odometer=odo,
                              acquisition_cost=cost, region=region, status=st),
            )
            v[reg] = obj

        d = {}
        for name, lic, cat, exp, contact, score, st in DRIVERS:
            obj, _ = Driver.objects.get_or_create(
                license_number=lic,
                defaults=dict(name=name, license_category=cat, license_expiry=exp,
                              contact=contact, safety_score=score, status=st),
            )
            d[lic] = obj

        # A couple of completed + active trips (only if none exist)
        if not Trip.objects.exists():
            Trip.objects.create(
                source='Delhi', destination='Jaipur', vehicle=v['DL-03-EF-9012'],
                driver=d['RJ0820100011224'], cargo_weight=4200, planned_distance=280,
                revenue=41000, status='Completed', start_odometer=131500,
                end_odometer=131782, fuel_consumed=38,
            )
            Trip.objects.create(
                source='Mumbai', destination='Nashik', vehicle=v['MH-01-AB-1234'],
                driver=d['MH1420110012345'], cargo_weight=600, planned_distance=170,
                revenue=15000, status='Draft',
            )

        if not MaintenanceLog.objects.exists():
            MaintenanceLog.objects.create(
                vehicle=v['KA-04-GH-3456'], type='Engine Overhaul',
                description='Full engine service and turbo replacement', cost=85000,
                date='2026-07-08', status='Active',
            )
            MaintenanceLog.objects.create(
                vehicle=v['DL-03-EF-9012'], type='Oil Change',
                description='Routine oil and filter change', cost=4500,
                date='2026-06-20', status='Closed',
            )

        if not FuelLog.objects.exists():
            FuelLog.objects.create(vehicle=v['DL-03-EF-9012'], liters=38, cost=3610, odometer=131782, date='2026-07-02')
            FuelLog.objects.create(vehicle=v['GJ-06-KL-2345'], liters=120, cost=11400, odometer=309500, date='2026-06-22')

        if not Expense.objects.exists():
            Expense.objects.create(vehicle=v['GJ-06-KL-2345'], category='Toll', amount=1240, date='2026-07-11', note='NH-48 tolls')
            Expense.objects.create(vehicle=v['TN-05-IJ-7890'], category='Fine', amount=2000, date='2026-06-28', note='Overspeeding')

        self.stdout.write(self.style.SUCCESS('Demo fleet data seeded.'))
