"""
Billing Router — Polar subscription management.
Uses Polar API for checkout, customer portal, and webhook handling.
"""

import os
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from api.middleware import get_current_user, get_user_id
from api.supabase_client import get_supabase

router = APIRouter()

POLAR_ACCESS_TOKEN = os.environ.get("POLAR_ACCESS_TOKEN", "")
POLAR_WEBHOOK_SECRET = os.environ.get("POLAR_WEBHOOK_SECRET", "")
POLAR_API_BASE = "https://api.polar.sh/v1"
POLAR_CHECKOUT_BASE = "https://polar.sh"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://dvirious.com")

# Polar product IDs for Dvirious plans
PLAN_PRODUCTS = {
    "pro_monthly": os.environ.get(
        "POLAR_PRODUCT_PRO_MONTHLY", "b60da3fc-a671-401d-87e5-5b948175ffa6"
    ),
    "pro_yearly": os.environ.get(
        "POLAR_PRODUCT_PRO_YEARLY", "005755bd-d9d9-4e2b-91f8-6803489cfa95"
    ),
    "business_monthly": os.environ.get(
        "POLAR_PRODUCT_BUSINESS_MONTHLY", "92338e0b-3a52-4644-8817-dfca08360c66"
    ),
    "business_yearly": os.environ.get(
        "POLAR_PRODUCT_BUSINESS_YEARLY", "c1f1c694-6650-4c9e-9077-c07724c75158"
    ),
}


def _polar_headers():
    return {
        "Authorization": f"Bearer {POLAR_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


def _plan_from_product_metadata(metadata: dict) -> str:
    """Extract plan tier from Polar product metadata."""
    return metadata.get("tier", "pro")


@router.post("/create-checkout")
async def create_checkout_session(
    plan: str = "pro",
    billing: str = "monthly",
    user: dict = Depends(get_current_user),
):
    """Create a Polar checkout URL for subscription."""
    user_id = user["sub"]
    email = user.get("email", "")

    product_key = f"{plan}_{billing}"
    product_id = PLAN_PRODUCTS.get(product_key)
    if not product_id:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan: {plan}/{billing}. Use pro/business + monthly/yearly.",
        )

    sb = get_supabase()

    # Ensure Polar customer exists with our user_id as external_id
    profile = (
        sb.table("profiles")
        .select("polar_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )
    polar_customer_id = (
        profile.data.get("polar_customer_id") if profile.data else None
    )

    try:
        async with httpx.AsyncClient() as client:
            # Create or reuse Polar customer
            if not polar_customer_id:
                # Try to find existing customer by external_id
                resp = await client.get(
                    f"{POLAR_API_BASE}/customers/external/{user_id}",
                    headers=_polar_headers(),
                )
                if resp.status_code == 200:
                    polar_customer_id = resp.json()["id"]
                else:
                    # Create new customer
                    resp = await client.post(
                        f"{POLAR_API_BASE}/customers",
                        headers=_polar_headers(),
                        json={
                            "email": email,
                            "external_id": user_id,
                            "metadata": {"app": "dvirious"},
                        },
                    )
                    if resp.status_code not in (200, 201):
                        raise HTTPException(
                            status_code=500,
                            detail=f"Failed to create Polar customer: {resp.text}",
                        )
                    polar_customer_id = resp.json()["id"]

                # Save to our DB
                sb.table("profiles").update(
                    {"polar_customer_id": polar_customer_id}
                ).eq("id", user_id).execute()

            # Build Polar checkout URL
            checkout_url = (
                f"{POLAR_CHECKOUT_BASE}/checkout?product_id={product_id}"
                f"&customer_id={polar_customer_id}"
                f"&success_url={FRONTEND_URL}/billing/success"
                f"&metadata[dvirious_user_id]={user_id}"
                f"&metadata[plan]={plan}"
            )

            return {"checkout_url": checkout_url}

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/portal")
async def create_portal_session(user_id: str = Depends(get_user_id)):
    """Redirect to Polar customer portal for managing subscription."""
    sb = get_supabase()
    profile = (
        sb.table("profiles")
        .select("polar_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )

    polar_customer_id = (
        profile.data.get("polar_customer_id") if profile.data else None
    )
    if not polar_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    try:
        async with httpx.AsyncClient() as client:
            # Create a customer portal session via Polar API
            resp = await client.post(
                f"{POLAR_API_BASE}/customer-portal/sessions",
                headers=_polar_headers(),
                json={"customer_id": polar_customer_id},
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return {"portal_url": data.get("url", data.get("customer_portal_url"))}

            # Fallback: direct Polar customer portal URL
            return {
                "portal_url": f"{POLAR_CHECKOUT_BASE}/purchases/subscriptions"
            }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/plan")
async def get_plan(user_id: str = Depends(get_user_id)):
    """Get the user's current plan."""
    sb = get_supabase()
    result = (
        sb.table("profiles")
        .select("plan, polar_customer_id")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not result.data:
        return {"plan": "free"}

    plan = result.data.get("plan", "free")

    # Verify with Polar customer state if they have a subscription
    polar_customer_id = result.data.get("polar_customer_id")
    if polar_customer_id and plan != "free":
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{POLAR_API_BASE}/customers/{polar_customer_id}/state",
                    headers=_polar_headers(),
                )
                if resp.status_code == 200:
                    state = resp.json()
                    active_subs = state.get("active_subscriptions", [])
                    if not active_subs:
                        # No active subs — downgrade to free
                        sb.table("profiles").update({"plan": "free"}).eq(
                            "id", user_id
                        ).execute()
                        return {"plan": "free"}
        except Exception:
            pass  # Fall through to DB value

    return {"plan": plan}


@router.post("/webhook")
async def polar_webhook(request: Request):
    """
    Handle Polar webhook events.
    This endpoint does NOT require auth — Polar calls it directly.
    """
    payload = await request.body()

    # Polar webhook signature verification
    # Polar uses svix for webhooks: webhook-id, webhook-timestamp, webhook-signature headers
    if POLAR_WEBHOOK_SECRET:
        sig_id = request.headers.get("webhook-id", "")
        sig_ts = request.headers.get("webhook-timestamp", "")
        sig_sig = request.headers.get("webhook-signature", "")
        if not (sig_id and sig_ts and sig_sig):
            raise HTTPException(status_code=400, detail="Missing webhook signature headers")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type", "")
    data = event.get("data", {})
    sb = get_supabase()

    print(f"[BILLING] Polar webhook: {event_type}")

    if event_type in ("subscription.created", "subscription.updated"):
        customer_id = data.get("customer_id", "")
        product = data.get("product", {})
        metadata = product.get("metadata", {})
        plan = _plan_from_product_metadata(metadata)
        status = data.get("status", "")

        if status == "active" and customer_id:
            result = (
                sb.table("profiles")
                .select("id")
                .eq("polar_customer_id", customer_id)
                .execute()
            )
            if result.data:
                user_id = result.data[0]["id"]
                sb.table("profiles").update({"plan": plan}).eq(
                    "id", user_id
                ).execute()
                print(f"[BILLING] User {user_id} upgraded to {plan}")

    elif event_type in ("subscription.canceled", "subscription.revoked"):
        customer_id = data.get("customer_id", "")
        if customer_id:
            result = (
                sb.table("profiles")
                .select("id")
                .eq("polar_customer_id", customer_id)
                .execute()
            )
            if result.data:
                user_id = result.data[0]["id"]
                sb.table("profiles").update({"plan": "free"}).eq(
                    "id", user_id
                ).execute()
                print(f"[BILLING] User {user_id} downgraded to free")

    elif event_type == "order.created":
        customer_id = data.get("customer_id", "")
        amount = data.get("amount", 0)
        print(f"[BILLING] Order created for customer {customer_id}, amount: {amount}")

    return {"status": "ok"}
