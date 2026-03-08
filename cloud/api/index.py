"""
Dvirious Cloud Backend — FastAPI on Vercel
Handles: Auth, AI proxy, billing, usage tracking
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routers import auth, billing, ai_proxy, users

app = FastAPI(
    title="Dvirious Cloud API",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(ai_proxy.router, prefix="/ai", tags=["ai"])


@app.get("/")
async def root():
    return {"service": "Dvirious Cloud API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
