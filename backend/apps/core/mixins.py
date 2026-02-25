class OwnerQuerySetMixin:
    """
    Mixin that filters querysets to only return objects owned by the requesting user.

    By default, it filters on the `user` field. Override `owner_field` on the
    view to filter on a different field (e.g. owner_field = 'owner').
    """

    owner_field = "user"

    def get_queryset(self):
        queryset = super().get_queryset()
        if getattr(self, "swagger_fake_view", False):
            return queryset.none()
        lookup = {self.owner_field: self.request.user}
        return queryset.filter(**lookup)
