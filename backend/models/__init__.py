from datetime import datetime
from typing import Optional, List
from uuid import uuid4
from sqlalchemy import Column, String, Text, Boolean, Float, ForeignKey, Index, CheckConstraint, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    sso_id: Optional[str] = None
    email: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductGroup(SQLModel, table=True):
    __tablename__ = "product_groups"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    owner_ids: List[str] = Field(default=[], sa_column=Column(ARRAY(UUID)))
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Product(SQLModel, table=True):
    __tablename__ = "products"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    group_id: str = Field(foreign_key="product_groups.id")
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductVariant(SQLModel, table=True):
    __tablename__ = "product_variants"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductMembership(SQLModel, table=True):
    __tablename__ = "product_memberships"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    group_id: str = Field(foreign_key="product_groups.id")
    user_id: str = Field(foreign_key="users.id")
    role: str = Field(sa_column=Column(String(20)))
    status: str = Field(default="pending", sa_column=Column(String(20)))
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    approved_by: Optional[str] = Field(default=None, foreign_key="users.id")
    approved_at: Optional[datetime] = None

class Category(SQLModel, table=True):
    __tablename__ = "categories"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    name: str
    description: Optional[str] = None
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Requirement(SQLModel, table=True):
    __tablename__ = "requirements"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    product_id: Optional[str] = Field(default=None, foreign_key="products.id")
    variant_id: Optional[str] = Field(default=None, foreign_key="product_variants.id")
    title: str = Field(sa_column=Column(String(500)))
    content: str
    category_id: Optional[str] = Field(default=None, foreign_key="categories.id")
    status: str = Field(default="draft", sa_column=Column(String(20)))
    priority: Optional[str] = Field(default=None, sa_column=Column(String(20)))
    requester_id: Optional[str] = Field(default=None, foreign_key="users.id")
    assignee_id: Optional[str] = Field(default=None, foreign_key="users.id")
    duplicate_of_id: Optional[str] = Field(default=None, foreign_key="requirements.id")
    duplicate_confidence: Optional[float] = None
    duplicate_checked_at: Optional[datetime] = None
    is_deleted: bool = Field(default=False)
    is_overridden: bool = Field(default=False)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RequirementAction(SQLModel, table=True):
    __tablename__ = "requirement_actions"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    requirement_id: str = Field(foreign_key="requirements.id")
    variant_id: Optional[str] = Field(default=None, foreign_key="product_variants.id")
    action_type: str = Field(sa_column=Column(String(20)))
    field_name: Optional[str] = Field(default=None, sa_column=Column(String(50)))
    new_value: Optional[str] = None
    changed_by: str = Field(foreign_key="users.id")
    review_status: str = Field(default="pending", sa_column=Column(String(20)))
    reviewed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = None
    propagated_from: Optional[str] = Field(default=None, foreign_key="requirement_actions.id")
    conflict_status: str = Field(default="none", sa_column=Column(String(20)))
    resolved_by: Optional[str] = Field(default=None, foreign_key="users.id")
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = Field(default=None, sa_column=Column(String(20)))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RequirementDraft(SQLModel, table=True):
    __tablename__ = "requirement_drafts"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    product_id: str = Field(foreign_key="products.id")
    variant_id: Optional[str] = Field(default=None, foreign_key="product_variants.id")
    title: str = Field(sa_column=Column(String(500)))
    content: str
    ai_analysis: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    compared_requirement_ids: List[str] = Field(default=[], sa_column=Column(ARRAY(UUID)))
    status: str = Field(default="analyzing", sa_column=Column(String(20)))
    created_by: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class JiraReference(SQLModel, table=True):
    __tablename__ = "jira_references"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    requirement_id: str = Field(foreign_key="requirements.id")
    jira_key: str = Field(sa_column=Column(String(50)))
    jira_url: str = Field(sa_column=Column(String(500)))
    is_auto_linked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RequirementImplementation(SQLModel, table=True):
    __tablename__ = "requirement_implementations"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    requirement_id: str = Field(foreign_key="requirements.id")
    is_completed: bool = Field(default=False)
    evidence: Optional[str] = None
    version: Optional[str] = Field(default=None, sa_column=Column(String(100)))
    completed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
