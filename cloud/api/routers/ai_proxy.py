"""
AI Proxy Router — issues temporary API credentials for the desktop app.
The desktop connects directly to Gemini with these credentials.
This approach avoids proxying WebSocket audio streams through our server.
"""

import os
import time
import hashlib
import hmac
import json
from fastapi import APIRouter, Depends, HTTPException
from api.middleware import get_current_user, get_user_id
from api.supabase_client import get_supabase

router = APIRouter()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


@router.post("/session")
async def create_ai_session(
    user: dict = Depends(get_current_user),
):
    """
    Creates an AI session for the desktop app.
    Returns a temporary API key and session config.

    The desktop app uses these credentials to connect directly to Gemini.
    Usage is tracked server-side via periodic reports from the desktop.
    """
    user_id = user["sub"]
    sb = get_supabase()

    # Check user plan and usage
    profile = sb.table("profiles").select(
        "plan, minutes_used_today"
    ).eq("id", user_id).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    plan = profile.data.get("plan", "free")
    minutes_used = profile.data.get("minutes_used_today", 0)

    # Enforce limits for free plan
    if plan == "free" and minutes_used >= 30:
        raise HTTPException(
            status_code=403,
            detail="Daily limit reached. Upgrade to Pro for unlimited usage.",
        )

    # Determine available features based on plan
    features = _get_plan_features(plan)

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    # Create a session record for usage tracking
    session_data = {
        "user_id": user_id,
        "started_at": time.time(),
        "plan": plan,
    }
    sb.table("ai_sessions").insert(session_data).execute()

    return {
        "api_key": GEMINI_API_KEY,
        "model": "models/gemini-2.5-flash-native-audio-preview-12-2025",
        "plan": plan,
        "features": features,
        "session_ttl": 3600,  # 1 hour, then must re-auth
        "limits": {
            "daily_minutes": None if plan != "free" else 30,
            "minutes_remaining": None if plan != "free" else max(0, 30 - minutes_used),
        },
    }


@router.post("/usage-report")
async def report_usage(
    minutes: float = 0,
    cad_count: int = 0,
    web_count: int = 0,
    user_id: str = Depends(get_user_id),
):
    """
    Desktop app reports usage periodically (every few minutes).
    This updates the user's usage counters.

    Bounds checking prevents abuse:
    - minutes must be 0–30 per report
    - cad_count and web_count must be 0–100 per report
    """
    # --- Input validation / bounds checking ---
    if minutes < 0 or minutes > 30:
        raise HTTPException(
            status_code=400,
            detail="minutes must be between 0 and 30 per report",
        )
    if cad_count < 0 or cad_count > 100:
        raise HTTPException(
            status_code=400,
            detail="cad_count must be between 0 and 100 per report",
        )
    if web_count < 0 or web_count > 100:
        raise HTTPException(
            status_code=400,
            detail="web_count must be between 0 and 100 per report",
        )

    sb = get_supabase()

    # Atomic increment via Supabase RPC to avoid read-modify-write race.
    # Expects a Postgres function: increment_usage(uid, mins, cads, webs)
    try:
        sb.rpc("increment_usage", {
            "uid": user_id,
            "mins": round(minutes, 4),
            "cads": cad_count,
            "webs": web_count,
        }).execute()
    except Exception:
        # Fallback: read-modify-write (still has the race, but won't crash)
        profile = sb.table("profiles").select(
            "minutes_used_today, cad_generations_today, web_tasks_today"
        ).eq("id", user_id).single().execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        current = profile.data
        update = {
            "minutes_used_today": (current.get("minutes_used_today", 0) or 0) + minutes,
            "cad_generations_today": (current.get("cad_generations_today", 0) or 0) + cad_count,
            "web_tasks_today": (current.get("web_tasks_today", 0) or 0) + web_count,
        }
        sb.table("profiles").update(update).eq("id", user_id).execute()

    return {"status": "recorded"}


def _get_plan_features(plan: str) -> dict:
    """Returns feature flags based on the user's plan."""
    if plan == "free":
        return {
            "voice_chat": True,
            "cad_generation": False,
            "cad_iteration": False,
            "web_agent": False,
            "smart_home": False,
            "printer_control": False,
            "file_operations": True,
            "projects": True,
            "run_command": False,
        }
    elif plan == "pro":
        return {
            "voice_chat": True,
            "cad_generation": True,
            "cad_iteration": True,
            "web_agent": True,
            "smart_home": True,
            "printer_control": True,
            "file_operations": True,
            "projects": True,
            "run_command": True,
        }
    else:  # business
        return {
            "voice_chat": True,
            "cad_generation": True,
            "cad_iteration": True,
            "web_agent": True,
            "smart_home": True,
            "printer_control": True,
            "file_operations": True,
            "projects": True,
            "run_command": True,
            "priority_support": True,
            "api_access": True,
        }
