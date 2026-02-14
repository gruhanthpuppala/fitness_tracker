from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Object-level permission that only allows the owner of an object to access it.
    Expects the object to have a `user` attribute pointing to the owning user.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsOnboarded(BasePermission):
    """
    Allows access only to users who have completed the onboarding process.
    Returns 403 Forbidden if the user has not been onboarded.
    """

    message = "You must complete onboarding before accessing this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_onboarded
        )


class IsEmailVerified(BasePermission):
    """
    Allows access only to users who have verified their email address.
    Returns 403 Forbidden if the user's email is not verified.
    """

    message = "You must verify your email address before accessing this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_email_verified
        )
