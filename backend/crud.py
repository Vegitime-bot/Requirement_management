from typing import List, Optional
from sqlmodel import Session, select
from models import (
    User, ProductGroup, Product, ProductMembership, 
    Requirement, RequirementAction
)

# User CRUD
def create_user(session: Session, email: str, name: str, sso_id: Optional[str] = None) -> User:
    user = User(email=email, name=name, sso_id=sso_id)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()

def get_user(session: Session, user_id: str) -> Optional[User]:
    return session.get(User, user_id)

# Product Group CRUD
def create_product_group(
    session: Session, 
    name: str, 
    description: Optional[str], 
    created_by: str
) -> ProductGroup:
    group = ProductGroup(
        name=name,
        description=description,
        created_by=created_by,
        owner_ids=[created_by]
    )
    session.add(group)
    session.commit()
    session.refresh(group)
    return group

def get_product_group(session: Session, group_id: str) -> Optional[ProductGroup]:
    return session.get(ProductGroup, group_id)

def list_user_product_groups(session: Session, user_id: str) -> List[ProductGroup]:
    """List groups where user is approved member."""
    memberships = session.exec(
        select(ProductMembership).where(
            ProductMembership.user_id == user_id,
            ProductMembership.status == "approved"
        )
    ).all()
    
    group_ids = [m.group_id for m in memberships]
    if not group_ids:
        return []
    
    return session.exec(
        select(ProductGroup).where(ProductGroup.id.in_(group_ids))
    ).all()

# Product Membership CRUD
def create_membership_request(
    session: Session,
    group_id: str,
    user_id: str
) -> ProductMembership:
    membership = ProductMembership(
        group_id=group_id,
        user_id=user_id,
        role="member",
        status="pending"
    )
    session.add(membership)
    session.commit()
    session.refresh(membership)
    return membership

def approve_membership(
    session: Session,
    membership_id: str,
    approved_by: str
) -> Optional[ProductMembership]:
    membership = session.get(ProductMembership, membership_id)
    if not membership:
        return None
    
    membership.status = "approved"
    membership.approved_by = approved_by
    from datetime import datetime
    membership.approved_at = datetime.utcnow()
    session.add(membership)
    session.commit()
    session.refresh(membership)
    return membership

def get_pending_memberships(session: Session, group_id: str) -> List[ProductMembership]:
    return session.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.status == "pending"
        )
    ).all()

# Requirement CRUD
def create_requirement(
    session: Session,
    product_id: Optional[str],
    variant_id: Optional[str],
    title: str,
    content: str,
    created_by: str,
    **kwargs
) -> Requirement:
    req = Requirement(
        product_id=product_id,
        variant_id=variant_id,
        title=title,
        content=content,
        created_by=created_by,
        requester_id=created_by,
        **kwargs
    )
    session.add(req)
    session.commit()
    session.refresh(req)
    return req

def get_requirement(session: Session, req_id: str) -> Optional[Requirement]:
    return session.get(Requirement, req_id)

def list_product_requirements(
    session: Session, 
    product_id: str,
    status: Optional[str] = None
) -> List[Requirement]:
    query = select(Requirement).where(
        Requirement.product_id == product_id,
        Requirement.variant_id == None,
        Requirement.is_deleted == False
    )
    if status:
        query = query.where(Requirement.status == status)
    return session.exec(query).all()

def list_variant_requirements(
    session: Session,
    variant_id: str,
    status: Optional[str] = None
) -> List[Requirement]:
    """Get variant requirements including inherited from product."""
    # Get variant's product_id
    variant = session.get(Product, variant_id)
    if not variant:
        return []
    
    # Get product requirements
    product_reqs = session.exec(
        select(Requirement).where(
            Requirement.product_id == variant.product_id,
            Requirement.variant_id == None,
            Requirement.is_deleted == False
        )
    ).all()
    
    # Get variant-specific requirements (overrides)
    variant_reqs = session.exec(
        select(Requirement).where(
            Requirement.variant_id == variant_id,
            Requirement.is_deleted == False
        )
    ).all()
    
    # Merge: variant overrides product
    req_map = {r.id: r for r in product_reqs}
    for vr in variant_reqs:
        if vr.duplicate_of_id and vr.duplicate_of_id in req_map:
            req_map[vr.duplicate_of_id] = vr  # override
        else:
            req_map[vr.id] = vr  # new variant req
    
    return list(req_map.values())

# Requirement Action CRUD
def create_action(
    session: Session,
    requirement_id: str,
    action_type: str,
    field_name: Optional[str],
    new_value: Optional[str],
    changed_by: str,
    variant_id: Optional[str] = None
) -> RequirementAction:
    action = RequirementAction(
        requirement_id=requirement_id,
        variant_id=variant_id,
        action_type=action_type,
        field_name=field_name,
        new_value=new_value,
        changed_by=changed_by
    )
    session.add(action)
    session.commit()
    session.refresh(action)
    return action

def approve_action(
    session: Session,
    action_id: str,
    reviewed_by: str
) -> Optional[RequirementAction]:
    action = session.get(RequirementAction, action_id)
    if not action:
        return None
    
    action.review_status = "approved"
    action.reviewed_by = reviewed_by
    from datetime import datetime
    action.reviewed_at = datetime.utcnow()
    session.add(action)
    session.commit()
    session.refresh(action)
    return action
