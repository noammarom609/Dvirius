"""Auth middleware — validates JWT from Supabase on every protected request."""

import os
import json
import base64
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

_raw_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")

# Supabase JWT secrets may be base64-encoded; pre-compute both forms
_SECRETS = [_raw_secret]
try:
    _decoded = base64.b64decode(_raw_secret)
    if _decoded != _raw_secret.encode():
        _SECRETS.append(_decoded)
except Exception:
    pass


def _get_token_header(token: str) -> dict:
    """Decode JWT header without verification."""
    try:
        header_b64 = token.split('.')[0]
        padding = 4 - len(header_b64) % 4
        if padding != 4:
            header_b64 += '=' * padding
        return json.loads(base64.urlsafe_b64decode(header_b64))
    except Exception:
        return {}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Extracts and validates the JWT from the Authorization header.
    Returns the decoded user payload (sub, email, etc.).
    """
    token = credentials.credentials
    header = _get_token_header(token)
    token_alg = header.get("alg", "unknown")

    # Use the algorithm from the token header if it's an HMAC variant
    allowed_algs = ["HS256", "HS384", "HS512"]
    if token_alg not in allowed_algs:
        print(f"[Auth Middleware] Token uses unexpected alg: {token_alg}, header: {header}")
        # Still try — maybe it works with our secret
        allowed_algs.append(token_alg)

    last_error = None
    for secret in _SECRETS:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=allowed_algs,
                audience="authenticated",
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            return payload
        except JWTError as e:
            last_error = e
            continue

    print(f"[Auth Middleware] JWT decode failed: {last_error}")
    print(f"[Auth Middleware] Token alg: {token_alg}, tried {len(_SECRETS)} secrets, raw len: {len(_raw_secret)}")
    print(f"[Auth Middleware] Token preview: {token[:20]}...{token[-10:]}")
    raise HTTPException(status_code=401, detail=f"Invalid token: {str(last_error)}")


async def get_user_id(user: dict = Depends(get_current_user)) -> str:
    """Convenience dependency — returns just the user ID string."""
    return user["sub"]
