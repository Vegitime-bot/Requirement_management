#!/usr/bin/env python3
"""
RMS 데이터 리셋 + 목업 데이터 시드
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from sqlmodel import Session, select, delete
from app import (
    engine, ProductGroup, Product, ProductVariant, Category,
    Requirement, RequirementVersion, User, ProductMembership
)

def reset_and_seed():
    with Session(engine) as session:
        # 기존 데이터 삭제
        print("Deleting existing data...")
        session.exec(delete(RequirementVersion))
        session.exec(delete(Requirement))
        session.exec(delete(Category))
        session.exec(delete(ProductVariant))
        session.exec(delete(ProductMembership))
        session.exec(delete(Product))
        session.exec(delete(ProductGroup))
        session.exec(delete(User))
        session.commit()
        print("Existing data deleted.")
        
        # 1. User 생성
        user = User(
            sso_id="admin001",
            email="admin@lsi.com",
            name="System Admin"
        )
        session.add(user)
        session.flush()
        print(f"Created user: {user.id}")
        
        # 2. Product Group 생성
        group = ProductGroup(
            name="VR Headset Product Line",
            description="VR headset products for 2026",
            created_by=user.id
        )
        session.add(group)
        session.flush()
        print(f"Created product group: {group.id}")
        
        # 3. Product 생성
        product = Product(
            group_id=group.id,
            name="VR51 Headset",
            code="VR51",
            description="Next-gen VR headset with 4K displays"
        )
        session.add(product)
        session.flush()
        print(f"Created product: {product.id}")
        
        # 4. Variants 생성
        variants = [
            ProductVariant(product_id=product.id, name="Standard", code="STD", description="Standard edition"),
            ProductVariant(product_id=product.id, name="Professional", code="PRO", description="Professional edition with extra features"),
            ProductVariant(product_id=product.id, name="Enterprise", code="ENT", description="Enterprise edition with full support"),
        ]
        for v in variants:
            session.add(v)
        session.flush()
        print(f"Created {len(variants)} variants")
        
        # 5. Categories 생성
        categories = [
            Category(product_id=product.id, name="Core Features", code="CORE", description="Core system features", created_by=user.id),
            Category(product_id=product.id, name="Security", code="SEC", description="Security requirements", created_by=user.id),
            Category(product_id=product.id, name="Performance", code="PERF", description="Performance requirements", created_by=user.id),
            Category(product_id=product.id, name="User Interface", code="UI", description="UI/UX requirements", created_by=user.id),
        ]
        for c in categories:
            session.add(c)
        session.flush()
        print(f"Created {len(categories)} categories")
        
        # 6. Requirements 생성
        requirements = [
            Requirement(
                product_id=product.id,
                req_id="VR51-STD-CORE-0001",
                title="4K Display Support",
                description="The system shall support 4K resolution displays for each eye",
                category_id=categories[0].id,
                variant_id=variants[0].id,
                priority="high",
                status="approved",
                source_type="manual",
                created_by=user.id
            ),
            Requirement(
                product_id=product.id,
                req_id="VR51-STD-SEC-0001",
                title="User Authentication",
                description="The system shall support multi-factor authentication",
                category_id=categories[1].id,
                variant_id=variants[0].id,
                priority="high",
                status="approved",
                source_type="manual",
                created_by=user.id
            ),
            Requirement(
                product_id=product.id,
                req_id="VR51-PRO-PERF-0001",
                title="90Hz Refresh Rate",
                description="The system shall maintain 90Hz refresh rate under all conditions",
                category_id=categories[2].id,
                variant_id=variants[1].id,
                priority="high",
                status="approved",
                source_type="manual",
                created_by=user.id
            ),
            Requirement(
                product_id=product.id,
                req_id="VR51-ENT-UI-0001",
                title="Multi-language Support",
                description="The system shall support at least 10 languages",
                category_id=categories[3].id,
                variant_id=variants[2].id,
                priority="medium",
                status="draft",
                source_type="manual",
                created_by=user.id
            ),
        ]
        for r in requirements:
            session.add(r)
        session.flush()
        print(f"Created {len(requirements)} requirements")
        
        session.commit()
        print("\n✅ Data reset and seeding completed!")
        print(f"   - 1 Product Group")
        print(f"   - 1 Product (VR51)")
        print(f"   - 3 Variants (STD, PRO, ENT)")
        print(f"   - 4 Categories (CORE, SEC, PERF, UI)")
        print(f"   - 4 Requirements")

if __name__ == "__main__":
    reset_and_seed()
