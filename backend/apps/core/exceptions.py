from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException


def custom_exception_handler(exc, context):
    """
    Extends DRF's default exception handler to return responses in the
    standard envelope format with status="error".

    Non-DRF exceptions (e.g. unhandled server errors) are left to Django's
    default 500 handling unless they are wrapped in an APIException.
    """

    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "status": "error",
            "data": None,
            "message": None,
            "warning": None,
            "errors": None,
            "meta": None,
        }

        # Extract a human-readable message
        if isinstance(response.data, dict) and "detail" in response.data:
            error_payload["message"] = str(response.data["detail"])
            error_payload["errors"] = response.data
        elif isinstance(response.data, list):
            error_payload["message"] = str(response.data[0]) if response.data else None
            error_payload["errors"] = response.data
        elif isinstance(response.data, dict):
            # Validation errors: dict of field -> [errors]
            error_payload["message"] = "Validation failed."
            error_payload["errors"] = response.data
        else:
            error_payload["message"] = str(response.data)
            error_payload["errors"] = response.data

        error_payload["errors"] = error_payload.get("errors") or {}

        response.data = error_payload

    return response
