from functools import lru_cache

import jwt
import requests
from fastapi import HTTPException, status


@lru_cache(maxsize=10)
def fetch_jwks(supabase_url: str) -> dict:
    """Fetch and cache JWKS from Supabase — only called once"""
    response = requests.get(f"{supabase_url}/auth/v1/.well-known/jwks.json")
    response.raise_for_status()
    return response.json()


def get_public_key(kid: str, supabase_url: str):
    """Get the public key matching the token's kid"""
    jwks = fetch_jwks(supabase_url)

    for key in jwks["keys"]:
        if key["kid"] == kid:
            return jwt.algorithms.ECAlgorithm.from_jwk(key)

    # Key not found — maybe rotated, clear cache and retry
    fetch_jwks.cache_clear()
    jwks = fetch_jwks(supabase_url)

    for key in jwks["keys"]:
        if key["kid"] == kid:
            return jwt.algorithms.ECAlgorithm.from_jwk(key)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Public key not found",
    )
