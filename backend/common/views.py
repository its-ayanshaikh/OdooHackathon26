from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, AdminUserCreateSerializer


def _set_auth_cookies(response, access, refresh=None):
    """Attach access (and optionally refresh) tokens as httpOnly cookies."""
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=str(access),
        httponly=settings.AUTH_COOKIE_HTTP_ONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path=settings.AUTH_COOKIE_PATH,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
    )
    if refresh is not None:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value=str(refresh),
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            path=settings.AUTH_COOKIE_PATH,
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        )
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate with email + password and set JWT cookies."""
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not email or not password:
        return Response(
            {'detail': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response(
            {'detail': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not user.is_active:
        return Response(
            {'detail': 'This account is disabled.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)
    response = Response(
        {'user': UserSerializer(user).data},
        status=status.HTTP_200_OK,
    )
    return _set_auth_cookies(response, refresh.access_token, refresh)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    """Issue a new access token from the refresh cookie."""
    refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
    if not refresh_token:
        return Response(
            {'detail': 'No refresh token provided.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        refresh = RefreshToken(refresh_token)
    except TokenError:
        return Response(
            {'detail': 'Refresh token is invalid or expired.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access = refresh.access_token
    response = Response({'detail': 'Token refreshed.'}, status=status.HTTP_200_OK)
    return _set_auth_cookies(response, access)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Clear the auth cookies."""
    response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path=settings.AUTH_COOKIE_PATH)
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path=settings.AUTH_COOKIE_PATH)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return the currently authenticated user."""
    return Response({'user': UserSerializer(request.user).data})


def _is_admin(user):
    return bool(user and (user.is_superuser or getattr(user, 'role', None) == 'Admin'))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change the current user's own password (requires the old password)."""
    old_password = request.data.get('old_password') or ''
    new_password = request.data.get('new_password') or ''

    if not old_password or not new_password:
        return Response(
            {'detail': 'Both old and new passwords are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not request.user.check_password(old_password):
        return Response(
            {'detail': 'Current password is incorrect.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(new_password) < 6:
        return Response(
            {'detail': 'New password must be at least 6 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    user.set_password(new_password)
    user.first_time_login = False
    user.save(update_fields=['password', 'first_time_login'])
    return Response({'detail': 'Password changed successfully.'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_users_view(request):
    """Admin: list all users or create a user of any role."""
    if not _is_admin(request.user):
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        from .models import User

        users = User.objects.all().order_by('role', 'email')
        return Response({'users': UserSerializer(users, many=True).data})

    serializer = AdminUserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reset_password_view(request):
    """Admin: set any user's password without needing the old one."""
    if not _is_admin(request.user):
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    from .models import User

    user_id = request.data.get('user_id')
    new_password = request.data.get('new_password') or ''
    if not user_id or not new_password:
        return Response(
            {'detail': 'user_id and new_password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(new_password) < 6:
        return Response(
            {'detail': 'New password must be at least 6 characters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    target.set_password(new_password)
    # Force the target to change it on next login.
    target.first_time_login = bool(request.data.get('force_change', True))
    target.save(update_fields=['password', 'first_time_login'])
    return Response({'detail': f"Password reset for {target.email}."})
