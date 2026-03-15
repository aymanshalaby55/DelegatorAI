from app.integrations.base import IntegrationProvider

_registry: dict[str, type[IntegrationProvider]] = {}


def register_provider(name: str):
    """
    Class decorator that registers an IntegrationProvider under a given name.

    Usage:
        @register_provider("github")
        class GitHubProvider(IntegrationProvider):
            ...

    Adding a new provider requires ZERO changes to IntegrationManager or the router.
    Just decorate the class and import the module somewhere in app startup.
    """

    def decorator(cls: type[IntegrationProvider]) -> type[IntegrationProvider]:
        if name in _registry:
            raise ValueError(
                f"Provider '{name}' is already registered by {_registry[name].__name__}. "
                "Each provider name must be unique."
            )
        _registry[name] = cls
        return cls

    return decorator


def get_registry() -> dict[str, type[IntegrationProvider]]:
    """Return a snapshot of all registered providers."""
    return dict(_registry)


def get_provider_class(name: str) -> type[IntegrationProvider]:
    """
    Look up a provider class by name.
    Raises ValueError for unknown providers.
    """
    cls = _registry.get(name)
    if not cls:
        registered = ", ".join(sorted(_registry.keys())) or "none"
        raise ValueError(
            f"Unknown integration provider: '{name}'. "
            f"Registered providers: {registered}"
        )
    return cls
