from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from contextlib import contextmanager
import uuid

from sqlmodel import SQLModel, Session, create_engine, select, Field, Column
from sqlalchemy import String, Text, Boolean, Float, ForeignKey, JSON
from sqlalchemy.dialects.sqlite import TIMESTAMP

# Database setup - SQLite for POC
DATABASE_URL = "sqlite:///./rms.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

@contextmanager
def get_session():
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_db():
    with get_session() as session:
        yield session

# Models
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    sso_id: Optional[str] = None
    email: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductGroup(SQLModel, table=True):
    __tablename__ = "product_groups"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    description: Optional[str] = None
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductMembership(SQLModel, table=True):
    __tablename__ = "product_memberships"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    group_id: str = Field(foreign_key="product_groups.id")
    user_id: str = Field(foreign_key="users.id")
    role: str = Field(sa_column=Column(String(20)))
    status: str = Field(default="pending", sa_column=Column(String(20)))
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    approved_by: Optional[str] = Field(default=None, foreign_key="users.id")
    approved_at: Optional[datetime] = None

class Product(SQLModel, table=True):
    __tablename__ = "products"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    group_id: str = Field(foreign_key="product_groups.id")
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductVariant(SQLModel, table=True):
    __tablename__ = "product_variants"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Category(SQLModel, table=True):
    __tablename__ = "categories"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    name: str
    description: Optional[str] = None
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Requirement(SQLModel, table=True):
    __tablename__ = "requirements"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    category_id: Optional[str] = Field(default=None, foreign_key="categories.id")
    variant_id: Optional[str] = Field(default=None, foreign_key="product_variants.id")
    title: str
    description: Optional[str] = None
    status: str = Field(default="draft", sa_column=Column(String(20)))
    priority: str = Field(default="medium", sa_column=Column(String(20)))
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RequirementAction(SQLModel, table=True):
    __tablename__ = "requirement_actions"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    requirement_id: str = Field(foreign_key="requirements.id")
    action_type: str = Field(sa_column=Column(String(50)))  # CREATE, UPDATE, STATUS_CHANGE, etc.
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    performed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    performed_at: datetime = Field(default_factory=datetime.utcnow)

# CRUD Functions - User
def create_user(session: Session, email: str, name: str) -> User:
    user = User(email=email, name=name)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()

# CRUD Functions - Product Group
def create_product_group(session: Session, name: str, description: Optional[str], created_by: str) -> ProductGroup:
    group = ProductGroup(name=name, description=description, created_by=created_by)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group

def get_product_group(session: Session, group_id: str) -> Optional[ProductGroup]:
    return session.get(ProductGroup, group_id)

def list_user_product_groups(session: Session, user_id: str) -> List[ProductGroup]:
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

# CRUD Functions - Product Membership
def create_membership_request(session: Session, group_id: str, user_id: str) -> ProductMembership:
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

def get_pending_memberships(session: Session, group_id: str) -> List[ProductMembership]:
    return session.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.status == "pending"
        )
    ).all()

def approve_membership(session: Session, membership_id: str, approved_by: str) -> Optional[ProductMembership]:
    membership = session.get(ProductMembership, membership_id)
    if not membership:
        return None
    
    membership.status = "approved"
    membership.approved_by = approved_by
    membership.approved_at = datetime.utcnow()
    session.add(membership)
    session.commit()
    session.refresh(membership)
    return membership

# CRUD Functions - Product
def create_product(session: Session, group_id: str, name: str, description: Optional[str]) -> Product:
    product = Product(group_id=group_id, name=name, description=description)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

def get_product(session: Session, product_id: str) -> Optional[Product]:
    return session.get(Product, product_id)

def list_group_products(session: Session, group_id: str) -> List[Product]:
    return session.exec(
        select(Product).where(Product.group_id == group_id)
    ).all()

def update_product(session: Session, product_id: str, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Product]:
    product = session.get(Product, product_id)
    if not product:
        return None
    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

def delete_product(session: Session, product_id: str) -> bool:
    product = session.get(Product, product_id)
    if not product:
        return False
    session.delete(product)
    session.commit()
    return True

# CRUD Functions - Product Variant
def create_variant(session: Session, product_id: str, name: str, description: Optional[str]) -> ProductVariant:
    variant = ProductVariant(product_id=product_id, name=name, description=description)
    session.add(variant)
    session.commit()
    session.refresh(variant)
    return variant

def get_variant(session: Session, variant_id: str) -> Optional[ProductVariant]:
    return session.get(ProductVariant, variant_id)

def list_product_variants(session: Session, product_id: str) -> List[ProductVariant]:
    return session.exec(
        select(ProductVariant).where(ProductVariant.product_id == product_id)
    ).all()

def update_variant(session: Session, variant_id: str, name: Optional[str] = None, description: Optional[str] = None) -> Optional[ProductVariant]:
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        return None
    if name is not None:
        variant.name = name
    if description is not None:
        variant.description = description
    session.add(variant)
    session.commit()
    session.refresh(variant)
    return variant

def delete_variant(session: Session, variant_id: str) -> bool:
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        return False
    session.delete(variant)
    session.commit()
    return True

# CRUD Functions - Category
def create_category(session: Session, product_id: str, name: str, description: Optional[str], created_by: str) -> Category:
    category = Category(product_id=product_id, name=name, description=description, created_by=created_by)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

def get_category(session: Session, category_id: str) -> Optional[Category]:
    return session.get(Category, category_id)

def list_product_categories(session: Session, product_id: str) -> List[Category]:
    return session.exec(
        select(Category).where(Category.product_id == product_id)
    ).all()

def update_category(session: Session, category_id: str, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Category]:
    category = session.get(Category, category_id)
    if not category:
        return None
    if name is not None:
        category.name = name
    if description is not None:
        category.description = description
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

def delete_category(session: Session, category_id: str) -> bool:
    category = session.get(Category, category_id)
    if not category:
        return False
    session.delete(category)
    session.commit()
    return True

def init_db():
    SQLModel.metadata.create_all(engine)
    # Create test user if not exists
    with get_session() as session:
        user = get_user_by_email(session, "test@example.com")
        if not user:
            create_user(session, "test@example.com", "Test User")

# FastAPI App
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Requirements Management System",
    description="API for managing product requirements",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock current user
def get_current_user() -> User:
    return User(id="test-user-id", email="test@example.com", name="Test User")

# Auth Router
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Product Groups Router
groups_router = APIRouter(prefix="/product-groups", tags=["product-groups"])

class ProductGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProductGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_by: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class MembershipResponse(BaseModel):
    id: str
    user_id: str
    role: str
    status: str
    requested_at: datetime
    
    class Config:
        from_attributes = True

@groups_router.get("/", response_model=List[ProductGroupResponse])
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_user_product_groups(db, current_user.id)

@groups_router.post("/", response_model=ProductGroupResponse)
def create_group(
    group: ProductGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_group = create_product_group(
        session=db,
        name=group.name,
        description=group.description,
        created_by=current_user.id
    )
    # Auto-create approved membership for creator
    membership = ProductMembership(
        group_id=db_group.id,
        user_id=current_user.id,
        role="owner",
        status="approved",
        approved_by=current_user.id,
        approved_at=datetime.utcnow()
    )
    db.add(membership)
    db.commit()
    return db_group

@groups_router.get("/{group_id}", response_model=ProductGroupResponse)
def get_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@groups_router.post("/{group_id}/join-request", response_model=MembershipResponse)
def request_join(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    existing = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.user_id == current_user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already requested or member")
    
    return create_membership_request(db, group_id, current_user.id)

@groups_router.get("/{group_id}/pending-requests", response_model=List[MembershipResponse])
def list_pending_requests(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check ownership
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can view pending requests")
    
    return get_pending_memberships(db, group_id)

@groups_router.post("/{group_id}/requests/{membership_id}/approve", response_model=MembershipResponse)
def approve_request(
    group_id: str,
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can approve")
    
    result = approve_membership(db, membership_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Membership request not found")
    
    return result

@groups_router.post("/{group_id}/requests/{membership_id}/reject")
def reject_request(
    group_id: str,
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = get_product_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can reject")
    
    membership = db.get(ProductMembership, membership_id)
    if not membership:
        raise HTTPException(status_code=404, detail="Membership request not found")
    
    membership.status = "rejected"
    db.add(membership)
    db.commit()
    return {"message": "Membership rejected"}

# Products Router
products_router = APIRouter(prefix="/products", tags=["products"])

class ProductCreate(BaseModel):
    group_id: str
    name: str
    description: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    group_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductDetailResponse(BaseModel):
    id: str
    group_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    variants: List[dict]
    categories: List[dict]
    
    class Config:
        from_attributes = True

@products_router.get("/", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all products accessible by current user."""
    # Get approved memberships
    memberships = db.exec(
        select(ProductMembership).where(
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).all()
    
    group_ids = [m.group_id for m in memberships]
    if not group_ids:
        return []
    
    # Get products from those groups
    return db.exec(
        select(Product).where(Product.group_id.in_(group_ids))
    ).all()

@products_router.post("/", response_model=ProductResponse)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check group access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Check for duplicate product name in the same group
    existing = db.exec(
        select(Product).where(
            Product.group_id == product.group_id,
            Product.name == product.name
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Product '{product.name}' already exists in this group")
    
    return create_product(db, product.group_id, product.name, product.description)

@products_router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product_detail(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    variants = list_product_variants(db, product_id)
    categories = list_product_categories(db, product_id)
    
    return {
        "id": product.id,
        "group_id": product.group_id,
        "name": product.name,
        "description": product.description,
        "created_at": product.created_at,
        "variants": [{"id": v.id, "name": v.name, "description": v.description} for v in variants],
        "categories": [{"id": c.id, "name": c.name, "description": c.description} for c in categories]
    }

@products_router.patch("/{product_id}", response_model=ProductResponse)
def update_product_endpoint(
    product_id: str,
    update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access (admin or owner)
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role.in_(["owner", "admin"])
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners or admins can update")
    
    updated = update_product(db, product_id, update.name, update.description)
    return updated

@products_router.delete("/{product_id}")
def delete_product_endpoint(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can delete")
    
    success = delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete")
    
    return {"message": "Product deleted"}

# Variants Router
variants_router = APIRouter(prefix="/products/{product_id}/variants", tags=["variants"])

class VariantCreate(BaseModel):
    name: str
    description: Optional[str] = None

class VariantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class VariantResponse(BaseModel):
    id: str
    product_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

@variants_router.get("/", response_model=List[VariantResponse])
def list_variants(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return list_product_variants(db, product_id)

@variants_router.post("/", response_model=VariantResponse)
def create_new_variant(
    product_id: str,
    variant: VariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return create_variant(db, product_id, variant.name, variant.description)

@variants_router.get("/{variant_id}", response_model=VariantResponse)
def get_variant_detail(
    product_id: str,
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    variant = get_variant(db, variant_id)
    if not variant or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    return variant

@variants_router.patch("/{variant_id}", response_model=VariantResponse)
def update_variant_endpoint(
    product_id: str,
    variant_id: str,
    update: VariantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access (admin or owner)
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role.in_(["owner", "admin"])
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners or admins can update")
    
    variant = get_variant(db, variant_id)
    if not variant or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    updated = update_variant(db, variant_id, update.name, update.description)
    return updated

@variants_router.delete("/{variant_id}")
def delete_variant_endpoint(
    product_id: str,
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can delete")
    
    variant = get_variant(db, variant_id)
    if not variant or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    success = delete_variant(db, variant_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete")
    
    return {"message": "Variant deleted"}

# Categories Router
categories_router = APIRouter(prefix="/products/{product_id}/categories", tags=["categories"])

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    product_id: str
    name: str
    description: Optional[str] = None
    created_by: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

@categories_router.get("/", response_model=List[CategoryResponse])
def list_categories(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return list_product_categories(db, product_id)

@categories_router.post("/", response_model=CategoryResponse)
def create_new_category(
    product_id: str,
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return create_category(db, product_id, category.name, category.description, current_user.id)

@categories_router.get("/{category_id}", response_model=CategoryResponse)
def get_category_detail(
    product_id: str,
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    category = get_category(db, category_id)
    if not category or category.product_id != product_id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category

@categories_router.patch("/{category_id}", response_model=CategoryResponse)
def update_category_endpoint(
    product_id: str,
    category_id: str,
    update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role.in_(["owner", "admin"])
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners or admins can update")
    
    category = get_category(db, category_id)
    if not category or category.product_id != product_id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated = update_category(db, category_id, update.name, update.description)
    return updated

@categories_router.delete("/{category_id}")
def delete_category_endpoint(
    product_id: str,
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role == "owner"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners can delete")
    
    category = get_category(db, category_id)
    if not category or category.product_id != product_id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    success = delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete")
    
    return {"message": "Category deleted"}

# Requirements CRUD Functions
def create_requirement(
    session: Session,
    product_id: str,
    title: str,
    description: Optional[str],
    category_id: Optional[str],
    variant_id: Optional[str],
    priority: str,
    created_by: str
) -> Requirement:
    req = Requirement(
        product_id=product_id,
        category_id=category_id,
        variant_id=variant_id,
        title=title,
        description=description,
        priority=priority,
        created_by=created_by
    )
    session.add(req)
    session.commit()
    session.refresh(req)
    
    # Log action
    action = RequirementAction(
        requirement_id=req.id,
        action_type="CREATE",
        new_value=title,
        performed_by=created_by
    )
    session.add(action)
    session.commit()
    
    return req

def get_requirement(session: Session, req_id: str) -> Optional[Requirement]:
    return session.get(Requirement, req_id)

def list_requirements(session: Session, product_id: str) -> List[Requirement]:
    return session.exec(
        select(Requirement).where(Requirement.product_id == product_id)
    ).all()

def update_requirement(
    session: Session,
    req_id: str,
    title: Optional[str],
    description: Optional[str],
    status: Optional[str],
    priority: Optional[str],
    category_id: Optional[str],
    performed_by: str
) -> Optional[Requirement]:
    req = session.get(Requirement, req_id)
    if not req:
        return None
    
    # Log changes
    if title is not None and title != req.title:
        action = RequirementAction(
            requirement_id=req_id,
            action_type="UPDATE_TITLE",
            old_value=req.title,
            new_value=title,
            performed_by=performed_by
        )
        session.add(action)
        req.title = title
    
    if description is not None and description != req.description:
        action = RequirementAction(
            requirement_id=req_id,
            action_type="UPDATE_DESCRIPTION",
            old_value=req.description,
            new_value=description,
            performed_by=performed_by
        )
        session.add(action)
        req.description = description
    
    if status is not None and status != req.status:
        action = RequirementAction(
            requirement_id=req_id,
            action_type="STATUS_CHANGE",
            old_value=req.status,
            new_value=status,
            performed_by=performed_by
        )
        session.add(action)
        req.status = status
    
    if priority is not None and priority != req.priority:
        action = RequirementAction(
            requirement_id=req_id,
            action_type="PRIORITY_CHANGE",
            old_value=req.priority,
            new_value=priority,
            performed_by=performed_by
        )
        session.add(action)
        req.priority = priority
    
    if category_id is not None and category_id != req.category_id:
        action = RequirementAction(
            requirement_id=req_id,
            action_type="CATEGORY_CHANGE",
            old_value=req.category_id,
            new_value=category_id,
            performed_by=performed_by
        )
        session.add(action)
        req.category_id = category_id
    
    req.updated_at = datetime.utcnow()
    session.add(req)
    session.commit()
    session.refresh(req)
    return req

def get_requirement_actions(session: Session, req_id: str) -> List[RequirementAction]:
    return session.exec(
        select(RequirementAction)
        .where(RequirementAction.requirement_id == req_id)
        .order_by(RequirementAction.performed_at.desc())
    ).all()

def delete_requirement(session: Session, req_id: str) -> bool:
    req = session.get(Requirement, req_id)
    if not req:
        return False
    session.delete(req)
    session.commit()
    return True

# Requirements Router
requirements_router = APIRouter(prefix="/products/{product_id}/requirements", tags=["requirements"])

class RequirementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    variant_id: Optional[str] = None
    priority: str = "medium"

class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category_id: Optional[str] = None

class RequirementResponse(BaseModel):
    id: str
    product_id: str
    category_id: Optional[str]
    variant_id: Optional[str]
    title: str
    description: Optional[str]
    status: str
    priority: str
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RequirementActionResponse(BaseModel):
    id: str
    requirement_id: str
    action_type: str
    old_value: Optional[str]
    new_value: Optional[str]
    performed_by: Optional[str]
    performed_at: datetime
    
    class Config:
        from_attributes = True

@requirements_router.get("/", response_model=List[RequirementResponse])
def list_requirements_endpoint(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return list_requirements(db, product_id)

@requirements_router.post("/", response_model=RequirementResponse)
def create_requirement_endpoint(
    product_id: str,
    req: RequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    return create_requirement(
        db, product_id, req.title, req.description,
        req.category_id, req.variant_id, req.priority,
        current_user.id
    )

@requirements_router.get("/{req_id}", response_model=RequirementResponse)
def get_requirement_endpoint(
    product_id: str,
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    req = get_requirement(db, req_id)
    if not req or req.product_id != product_id:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    return req

@requirements_router.put("/{req_id}", response_model=RequirementResponse)
def update_requirement_endpoint(
    product_id: str,
    req_id: str,
    update: RequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    req = get_requirement(db, req_id)
    if not req or req.product_id != product_id:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    updated = update_requirement(
        db, req_id, update.title, update.description,
        update.status, update.priority, update.category_id,
        current_user.id
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update")
    
    return updated

@requirements_router.delete("/{req_id}")
def delete_requirement_endpoint(
    product_id: str,
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership for delete
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved",
            ProductMembership.role.in_(["owner", "admin"])
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Only owners or admins can delete")
    
    req = get_requirement(db, req_id)
    if not req or req.product_id != product_id:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    success = delete_requirement(db, req_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete")
    
    return {"message": "Requirement deleted"}

@requirements_router.get("/{req_id}/actions", response_model=List[RequirementActionResponse])
def get_requirement_actions_endpoint(
    product_id: str,
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    req = get_requirement(db, req_id)
    if not req or req.product_id != product_id:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    return get_requirement_actions(db, req_id)

# Context Ingestion Router
ingest_router = APIRouter(prefix="/ingest", tags=["ingest"])

class IngestRequest(BaseModel):
    product_id: str
    context_text: str
    source_type: str = "email"  # email, spec, document, meeting_notes

class ExtractedRequirement(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    confidence: float
    is_product_requirement: bool
    reason: str

class IngestResponse(BaseModel):
    extracted: List[ExtractedRequirement]
    existing_requirements: List[RequirementResponse]
    suggestions: List[dict]

class ApplyIngestRequest(BaseModel):
    product_id: str
    extracted_requirements: List[ExtractedRequirement]
    actions: List[dict]  # [{"type": "create"|"update", "extracted_index": int, "existing_id": str|null}]

@ingest_router.post("/analyze", response_model=IngestResponse)
def analyze_context(
    request: IngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze raw context and extract requirements."""
    product = get_product(db, request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # TODO: Replace with actual LLM call
    # Mock LLM analysis
    extracted = mock_llm_analysis(request.context_text)
    
    # Get existing requirements for comparison
    existing = list_requirements(db, request.product_id)
    
    # Generate suggestions
    suggestions = generate_ingest_suggestions(extracted, existing)
    
    return {
        "extracted": extracted,
        "existing_requirements": existing,
        "suggestions": suggestions
    }

def mock_llm_analysis(context_text: str) -> List[ExtractedRequirement]:
    """Mock LLM analysis - replace with actual LLM call."""
    # Simple keyword-based extraction for demo
    extracted = []
    
    lines = context_text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Detect if line looks like a requirement
        is_req = any(kw in line.lower() for kw in [
            'must', 'should', 'shall', 'need', 'requires', 
            'support', 'provide', 'implement', 'enable',
            '시스템은', '사용자는', '기능', '요구'
        ])
        
        # Detect non-requirements (dates, requests, etc.)
        is_non_req = any(kw in line.lower() for kw in [
            'deadline', '납기', 'asap', 'please fix', 'plz', '수정해주세요',
            'due date', 'by tomorrow', 'by next week', 'urgent request'
        ])
        
        if is_req and not is_non_req and len(line) > 10:
            extracted.append({
                "title": line[:60] + ('...' if len(line) > 60 else ''),
                "description": line,
                "priority": "high" if any(kw in line.lower() for kw in ['critical', 'must', 'shall']) else "medium",
                "confidence": 0.85,
                "is_product_requirement": True,
                "reason": "Contains requirement keywords"
            })
        elif is_non_req:
            extracted.append({
                "title": f"[Non-Requirement] {line[:40]}...",
                "description": line,
                "priority": "low",
                "confidence": 0.9,
                "is_product_requirement": False,
                "reason": "Contains non-requirement indicators (deadline, request, etc.)"
            })
    
    return extracted

def generate_ingest_suggestions(
    extracted: List[ExtractedRequirement],
    existing: List[Requirement]
) -> List[dict]:
    """Generate suggestions for matching extracted to existing."""
    suggestions = []
    
    for i, ext in enumerate(extracted):
        if not ext.is_product_requirement:
            suggestions.append({
                "extracted_index": i,
                "action": "skip",
                "reason": "Not a product requirement",
                "existing_id": None
            })
            continue
            
        # Simple similarity check (replace with embedding-based similarity)
        best_match = None
        best_score = 0
        for req in existing:
            # Simple word overlap similarity
            ext_words = set(ext.title.lower().split())
            req_words = set(req.title.lower().split())
            if ext_words and req_words:
                overlap = len(ext_words & req_words) / len(ext_words | req_words)
                if overlap > best_score and overlap > 0.3:
                    best_score = overlap
                    best_match = req
        
        if best_match:
            suggestions.append({
                "extracted_index": i,
                "action": "update",
                "reason": f"Similar to existing: '{best_match.title[:40]}...'",
                "existing_id": best_match.id,
                "similarity": round(best_score, 2)
            })
        else:
            suggestions.append({
                "extracted_index": i,
                "action": "create",
                "reason": "New requirement",
                "existing_id": None
            })
    
    return suggestions

@ingest_router.post("/apply")
def apply_ingest(
    request: ApplyIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply the selected ingest actions."""
    product = get_product(db, request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check access
    membership = db.exec(
        select(ProductMembership).where(
            ProductMembership.group_id == product.group_id,
            ProductMembership.user_id == current_user.id,
            ProductMembership.status == "approved"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    results = []
    
    for action in request.actions:
        idx = action.get("extracted_index")
        action_type = action.get("type")
        
        if idx is None or idx >= len(request.extracted_requirements):
            continue
            
        ext = request.extracted_requirements[idx]
        
        if not ext.is_product_requirement or action_type == "skip":
            results.append({"action": "skip", "title": ext.title})
            continue
        
        if action_type == "create":
            req = create_requirement(
                db, request.product_id, ext.title, ext.description,
                None, None, ext.priority, current_user.id
            )
            results.append({"action": "create", "id": req.id, "title": req.title})
        
        elif action_type == "update" and action.get("existing_id"):
            updated = update_requirement(
                db, action["existing_id"], ext.title, ext.description,
                None, ext.priority, None, current_user.id
            )
            if updated:
                results.append({"action": "update", "id": updated.id, "title": updated.title})
    
    return {"results": results, "applied_count": len([r for r in results if r["action"] != "skip"])}

# Include routers
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(products_router)
app.include_router(variants_router)
app.include_router(categories_router)
app.include_router(requirements_router)
app.include_router(ingest_router)

# Create tables on startup
@app.on_event("startup")
def create_tables():
    SQLModel.metadata.create_all(engine)

@app.get("/")
def root():
    return {
        "service": "Requirements Management System",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth/me",
            "product_groups": "/product-groups",
            "products": "/products",
            "categories": "/products/{product_id}/categories"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="100.73.184.77", port=8020)
