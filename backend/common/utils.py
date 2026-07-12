"""Shared helpers for consistent API responses and error handling."""
import functools
import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def error_response(message, code=status.HTTP_400_BAD_REQUEST, extra=None):
    payload = {'detail': message}
    if extra:
        payload.update(extra)
    return Response(payload, status=code)


def handle_exceptions(view_func):
    """
    Decorator that wraps a view in a try/except and returns clean JSON errors.
    Keeps individual views focused on the happy path.
    """

    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        except (DRFValidationError, DjangoValidationError) as exc:
            detail = getattr(exc, 'message_dict', None) or getattr(exc, 'detail', str(exc))
            return error_response(detail, status.HTTP_400_BAD_REQUEST)
        except PermissionError as exc:
            return error_response(str(exc) or 'Permission denied.', status.HTTP_403_FORBIDDEN)
        except Exception as exc:  # noqa: BLE001 - last-resort safety net
            logger.exception('Unhandled error in %s', view_func.__name__)
            return error_response(
                f'Something went wrong: {exc}', status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return wrapper
