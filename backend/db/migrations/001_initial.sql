-- PostgreSQL Initial Migration
-- Requirements Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (SSO integration ready)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sso_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Groups
CREATE TABLE product_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_ids UUID[] DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Memberships (with approval flow)
CREATE TABLE product_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirements
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_progress', 'implemented', 'verified')),
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duplicate_of_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
    duplicate_confidence FLOAT,
    duplicate_checked_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_overridden BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (product_id IS NOT NULL AND variant_id IS NULL) OR
        (product_id IS NULL AND variant_id IS NOT NULL)
    )
);

-- Requirement Actions (change history)
CREATE TABLE requirement_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('update', 'delete')),
    field_name VARCHAR(50),
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    propagated_from UUID REFERENCES requirement_actions(id) ON DELETE SET NULL,
    conflict_status VARCHAR(20) DEFAULT 'none' CHECK (conflict_status IN ('none', 'pending', 'resolved')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution VARCHAR(20) CHECK (resolution IN ('accept_product', 'keep_variant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirement Drafts (LLM analysis)
CREATE TABLE requirement_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    ai_analysis JSONB,
    compared_requirement_ids UUID[],
    status VARCHAR(20) NOT NULL DEFAULT 'analyzing' CHECK (status IN ('analyzing', 'pending_confirm', 'confirmed', 'rejected')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jira References
CREATE TABLE jira_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    jira_key VARCHAR(50) NOT NULL,
    jira_url VARCHAR(500) NOT NULL,
    is_auto_linked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requirement_id, jira_key)
);

-- Requirement Implementations
CREATE TABLE requirement_implementations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID NOT NULL UNIQUE REFERENCES requirements(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    evidence TEXT,
    version VARCHAR(100),
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_sso ON users(sso_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_groups_owner ON product_groups USING GIN(owner_ids);
CREATE INDEX idx_groups_created_by ON product_groups(created_by);

CREATE INDEX idx_products_group ON products(group_id);

CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE INDEX idx_memberships_group ON product_memberships(group_id);
CREATE INDEX idx_memberships_user ON product_memberships(user_id);
CREATE INDEX idx_memberships_status ON product_memberships(status);

CREATE INDEX idx_categories_product ON categories(product_id);

CREATE INDEX idx_requirements_product ON requirements(product_id) WHERE variant_id IS NULL;
CREATE INDEX idx_requirements_variant ON requirements(variant_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_category ON requirements(category_id);
CREATE INDEX idx_requirements_requester ON requirements(requester_id);
CREATE INDEX idx_requirements_assignee ON requirements(assignee_id);
CREATE INDEX idx_requirements_duplicate ON requirements(duplicate_of_id);
CREATE INDEX idx_requirements_is_deleted ON requirements(is_deleted) WHERE is_deleted = FALSE;

CREATE INDEX idx_actions_requirement ON requirement_actions(requirement_id);
CREATE INDEX idx_actions_variant ON requirement_actions(variant_id);
CREATE INDEX idx_actions_requirement_field_status ON requirement_actions(requirement_id, field_name, review_status, created_at DESC);
CREATE INDEX idx_actions_propagated ON requirement_actions(propagated_from);
CREATE INDEX idx_actions_conflict ON requirement_actions(conflict_status) WHERE conflict_status = 'pending';

CREATE INDEX idx_drafts_product ON requirement_drafts(product_id);
CREATE INDEX idx_drafts_variant ON requirement_drafts(variant_id);
CREATE INDEX idx_drafts_status ON requirement_drafts(status);
CREATE INDEX idx_drafts_created_by ON requirement_drafts(created_by);

CREATE INDEX idx_jira_requirement ON jira_references(requirement_id);
