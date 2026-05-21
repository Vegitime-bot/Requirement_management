#!/usr/bin/env python3
"""
테스트 유저에게 Product Group 멤버십 추가
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from sqlmodel import Session, select
from app import engine, ProductGroup, ProductMembership, User

def add_membership():
    with Session(engine) as session:
        # 테스트 유저 찾기 (get_current_user에서 반환하는 유저)
        test_user = session.exec(
            select(User).where(User.sso_id == "test-sso-id")
        ).first()
        
        if not test_user:
            # 하드코딩된 테스트 유저 생성
            test_user = User(
                id="test-user-id",
                sso_id="test-sso-id",
                email="test@example.com",
                name="Test User"
            )
            session.add(test_user)
            session.flush()
            print(f"Created test user: {test_user.id}")
        else:
            print(f"Found test user: {test_user.id}")
        
        # 모든 Product Group에 멤버십 추가
        groups = session.exec(select(ProductGroup)).all()
        for group in groups:
            # 기존 멤버십 확인
            existing = session.exec(
                select(ProductMembership).where(
                    ProductMembership.group_id == group.id,
                    ProductMembership.user_id == test_user.id
                )
            ).first()
            
            if not existing:
                membership = ProductMembership(
                    group_id=group.id,
                    user_id=test_user.id,
                    role="owner",
                    status="approved",
                    approved_by=test_user.id,
                    approved_at=datetime.utcnow()
                )
                session.add(membership)
                print(f"Added membership for group: {group.name}")
            else:
                print(f"Membership already exists for group: {group.name}")
        
        session.commit()
        print("\n✅ Membership added successfully!")

if __name__ == "__main__":
    add_membership()
