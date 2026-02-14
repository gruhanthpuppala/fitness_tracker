from rest_framework.throttling import UserRateThrottle


class AuthRateThrottle(UserRateThrottle):
    """
    Throttle for authentication-related endpoints (login, register, password reset).
    Limit: 5 requests per minute.
    """

    scope = "auth"
    rate = "5/min"


class WriteRateThrottle(UserRateThrottle):
    """
    Throttle for write operations (POST, PUT, PATCH, DELETE).
    Limit: 30 requests per minute.
    """

    scope = "write"
    rate = "30/min"


class ReadRateThrottle(UserRateThrottle):
    """
    Throttle for read operations (GET, HEAD, OPTIONS).
    Limit: 120 requests per minute.
    """

    scope = "read"
    rate = "120/min"
