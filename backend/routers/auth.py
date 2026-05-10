from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# Mock current user (replace with actual SSO integration)
def get_current_user() -> User:
    """Mock: Returns a test user. Replace with actual SSO validation."""
    # TODO: Implement actual SSO token validation
    return User(
        id="test-user-id",
        sso_id="test-sso-id",
        email="test@example.com",
        name="Test User"
    )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/login")
def mock_login():
    """Mock login endpoint."""
    return {"token": "mock-token", "user": get_current_user()}

@router.post("/logout")
def mock_logout():
    return {"message": "Logged out"}
