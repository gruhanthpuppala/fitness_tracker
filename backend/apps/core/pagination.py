from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Standard pagination class used across all API endpoints.

    - Default page size: 20
    - Maximum page size: 100
    - Clients can request a custom page size via the `page_size` query parameter.
      Values exceeding the maximum are silently capped to 100.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
