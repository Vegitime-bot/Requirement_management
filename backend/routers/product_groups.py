from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from sqlmodel import Session

from ..models import ProductGroup, ProductMembership, User
from ..database import get_db
from ..crud import (
    create_product_group, get_product_group, list_user_product_groups,
    create_membership_request, approve_membership, get_pending_memberships
)

router = APIRouter(prefix="/product-groups", tags=["product-groups"])

# Mock current user for POC
def get_current_user() -> User:
    return User(id="test-user-id", email="test@example.com", name="Test User")

class ProductGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProductGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_ids: List[str]
    created_by: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

class MembershipResponse(BaseModel):
    id: str
    user_id: str
    role: str
    status: str
    requested_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductGroupResponse])
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List groups where user is approved member."""
    return list_user_product_groups(db, current_user.id)

@router.post("/", response_model=ProductGroupResponse)
def create_group(
    group: ProductGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new product group. Creator becomes owner."""
    db_group = create_product_group(
        session=db,
        name=group.name,
        description=group.description,
        created_by=current_user.id
    )
    # Auto-create approved membership for creator as owner
    membership = ProductMembership(
        group_id=db_group.id,
        user_id=current_user.id,
        role="owner",
        status="approved"
    )
    db.add(membership)
    db.commit()
    return db_group

@router.get("/{group_id}", response_model=ProductGroupResponse)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get group details."""
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.post("/{group_id}/join-request", response_model=MembershipResponse)
def request_join(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request membership."""
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if already member
    existing = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.user_id == current_user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already requested or member")
    
    return create_membership_request(db, group_id, current_user.id)

from sqlmodel import select

@router.get("/{group_id}/pending-requests", response_model=List[MembershipResponse])
def list_pending_requests(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List pending membership requests (owner only)."""
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if current user is owner
    if current_user.id not in group.owner_ids:
        raise HTTPException(status_code=403, detail="Only owners can view pending requests")
    
    return get_pending_memberships(db, group_id)

@router.post("/{group_id}/requests/{membership_id}/approve", response_model=MembershipResponse)
def approve_request(
    group_id: str,
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve membership request (owner only)."""
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if current user is owner
    if current_user.id not in group.owner_ids:
        raise HTTPException(status_code=403, detail="Only owners can approve")
    
    membership = approve_membership(db, membership_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=404, detail="Membership request not found")
    
    return membership

@router.post("/{group_id}/requests/{membership_id}/reject")
def reject_request(
    group_id: str,
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject membership request (owner only)."""
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group.owner_ids:
        raise HTTPException(status_code=403, detail="Only owners can reject")
    
    membership = db.get(ProductMembership, membership_id)
    if not membership:
        raise HTTPException(status_code=404, detail="Membership request not found")
    
    membership.status = "rejected"
    db.add(membership)
    db.commit()
    return {"message": "Membership rejected"}
