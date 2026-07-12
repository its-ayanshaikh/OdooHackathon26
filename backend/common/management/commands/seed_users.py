from django.core.management.base import BaseCommand
from common.models import User

DEMO_USERS = [
    ('admin@transitops.com', 'Riya Kapoor', 'Admin', True),
    ('fleet@transitops.com', 'Priya Menon', 'Fleet Manager', False),
    ('driver@transitops.com', 'Arjun Rao', 'Driver', False),
    ('safety@transitops.com', 'Neha Gupta', 'Safety Officer', False),
    ('finance@transitops.com', 'Karan Shah', 'Financial Analyst', False),
]

DEMO_PASSWORD = 'demo1234'


class Command(BaseCommand):
    help = 'Seed demo users for each role (password: demo1234).'

    def handle(self, *args, **options):
        for email, name, role, is_admin in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'role': role,
                    'is_staff': is_admin,
                    'is_superuser': is_admin,
                },
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created {email} ({role})'))
            else:
                self.stdout.write(f'Exists  {email} ({role})')

        self.stdout.write(self.style.SUCCESS('\nDemo users ready. Password: demo1234'))
