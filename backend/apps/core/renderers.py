from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    """
    Custom renderer that wraps all API responses in a standard envelope format:

    {
        "status": "success" | "error",
        "data": <response data on success>,
        "message": <optional human-readable message>,
        "warning": <optional warning message>,
        "errors": <error details on failure>,
        "meta": <optional metadata such as pagination info>
    }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response") if renderer_context else None

        if response is None:
            return super().render(data, accepted_media_type, renderer_context)

        status_code = response.status_code
        is_success = 200 <= status_code < 300

        if is_success:
            envelope = {
                "status": "success",
                "data": data,
                "message": None,
                "warning": None,
                "errors": None,
                "meta": None,
            }

            # If the response data is a dict, extract envelope-level keys if present
            if isinstance(data, dict):
                envelope["message"] = data.pop("message", None)
                envelope["warning"] = data.pop("warning", None)
                envelope["meta"] = data.pop("meta", None)

                # If data is now empty after extracting envelope keys, set to None
                if not data:
                    envelope["data"] = None
        else:
            envelope = {
                "status": "error",
                "data": None,
                "message": None,
                "warning": None,
                "errors": data,
                "meta": None,
            }

            # If errors is a dict with a detail key, promote it to message
            if isinstance(data, dict) and "detail" in data:
                envelope["message"] = data.get("detail")

        return super().render(envelope, accepted_media_type, renderer_context)
