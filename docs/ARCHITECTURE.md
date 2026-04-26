# RMS Architecture

## System Overview

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        Web["Next.js Web App"]
        Mobile["Mobile (Future)"]
    end

    subgraph Gateway["🌐 API Gateway"]
        FastAPI["FastAPI Server"]
        CORS["CORS Middleware"]
        Auth["Mock Auth (Dev)"]
    end

    subgraph Core["⚙️ Core Services"]
        subgraph Ingestion["📥 Context Ingestion"]
            LLM["LLM Service<br/>Kimi-k2.5"]
            Embed["Embedding Service<br/>BGE-M3"]
            Matcher["Similarity Matcher"]
        end

        subgraph Domain["📋 Domain Logic"]
            Product["Product Manager"]
            Req["Requirement Manager"]
            Version["Version Manager"]
            IDGen["ID Generator"]
        end
    end

    subgraph Data["💾 Data Layer"]
        SQLite[(SQLite<br/>rms.db)]
        LocalFiles[".env config"]
    end

    Client --"HTTP/REST"--> Gateway
    Gateway --"Routes"--> Core
    Ingestion --"Save"--> Domain
    Domain --"CRUD"--> Data

    style LLM fill:#FF6B6B,stroke:#333
    style Embed fill:#4ECDC4,stroke:#333
    style SQLite fill:#96CEB4,stroke:#333
```

## Database Schema

```mermaid
erDiagram
    USER ||--o{ PRODUCT_MEMBERSHIP : "has"
    PRODUCT_GROUP ||--o{ PRODUCT_MEMBERSHIP : "has"
    PRODUCT_GROUP ||--o{ PRODUCT : "contains"
    PRODUCT ||--o{ PRODUCT_VARIANT : "has"
    PRODUCT ||--o{ CATEGORY : "has"
    PRODUCT ||--o{ REQUIREMENT : "contains"
    PRODUCT ||--o{ REQUIREMENT_VERSION : "snapshots"
    REQUIREMENT }o--|| PRODUCT_VARIANT : "belongs_to"
    REQUIREMENT }o--|| CATEGORY : "belongs_to"
    REQUIREMENT ||--o{ REQUIREMENT_ACTION : "logs"
    REQUIREMENT_VERSION ||--o{ REQUIREMENT_VERSION_ITEM : "contains"

    USER {
        string id PK
        string email UK
        string name
        datetime created_at
    }

    PRODUCT_GROUP {
        string id PK
        string name
        string created_by FK
        datetime created_at
    }

    PRODUCT_MEMBERSHIP {
        string id PK
        string group_id FK
        string user_id FK
        string role
        string status
        datetime requested_at
        string approved_by FK
        datetime approved_at
    }

    PRODUCT {
        string id PK
        string group_id FK
        string name
        string code UK
        string description
        datetime created_at
    }

    PRODUCT_VARIANT {
        string id PK
        string product_id FK
        string name
        string code
        string description
        datetime created_at
    }

    CATEGORY {
        string id PK
        string product_id FK
        string name
        string code
        string description
        string created_by FK
        datetime created_at
    }

    REQUIREMENT {
        string id PK
        string req_id UK
        string product_id FK
        string category_id FK
        string variant_id FK
        string title
        string description
        string status
        string priority
        string created_by FK
        datetime created_at
        datetime updated_at
    }

    REQUIREMENT_ACTION {
        string id PK
        string requirement_id FK
        string action_type
        string old_value
        string new_value
        string performed_by FK
        datetime performed_at
    }

    REQUIREMENT_VERSION {
        string id PK
        string product_id FK
        string version_name
        string description
        string created_by FK
        datetime created_at
    }

    REQUIREMENT_VERSION_ITEM {
        string id PK
        string version_id FK
        string requirement_id FK
        string title
        string description
        string status
        string priority
        string category_id
        string variant_id
    }
```

## AI Processing Pipeline

```mermaid
flowchart LR
    A["📄 Raw Text<br/>Email/Spec/Doc"] --> B["🤖 LLM Extraction"]
    B --> C{"✅ Is Product<br/>Requirement?"}
    C -->|Yes| D["📊 Embedding<br/>Vectorization"]
    C -->|No| E["🗑️ Filter Out"]
    D --> F["🔍 Similarity Search"]
    F --> G{"🤔 Match Found?"}
    G -->|Yes| H["📝 Suggest UPDATE"]
    G -->|No| I["📝 Suggest CREATE"]
    H --> J["👤 Human Review"]
    I --> J
    J --> K["💾 Apply Changes"]

    style B fill:#FF6B6B,stroke:#333
    style D fill:#4ECDC4,stroke:#333
    style K fill:#96CEB4,stroke:#333
```

## ID Generation Flow

```mermaid
sequenceDiagram
    participant Req as Requirement Create
    participant Gen as ID Generator
    participant DB as Database

    Req->>Gen: generate_req_id(product_id, variant_id, category_id)
    Gen->>DB: Get Product.code
    DB-->>Gen: "VR51"
    Gen->>DB: Get Variant.code
    DB-->>Gen: "STD"
    Gen->>DB: Get Category.code
    DB-->>Gen: "SEC"
    Gen->>DB: Count existing with prefix
    DB-->>Gen: max_seq = 4
    Gen->>Gen: next_seq = 5
    Gen-->>Req: "VR51-STD-SEC-0005"
```

## Version Management Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Create Requirement
    Draft --> Review: Submit
    Review --> Approved: Accept
    Review --> Draft: Reject
    Approved --> Implemented: Development
    Implemented --> Verified: Testing
    Verified --> Released: Release
    Released --> Archived: Deprecate

    Released --> VersionSnapshot: Create Version
    VersionSnapshot --> [*]: Store Snapshot

    state VersionSnapshot {
        [*] --> Capture
        Capture --> SaveItems: Copy all requirements
        SaveItems --> [*]
    }
```

## Request Lifecycle

```mermaid
journey
    title Context Ingestion User Journey
    section Upload
      Upload document: 5: User
      Wait for analysis: 3: User
    section Review
      View extracted requirements: 5: User
      Review suggestions: 4: User
      Select actions: 4: User
    section Apply
      Confirm application: 5: User
      View generated IDs: 5: User
      Create version: 3: User
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database (POC)** | SQLite | Zero config, portable, file-based |
| **Database (Prod)** | PostgreSQL | Scalable, concurrent access |
| **ORM** | SQLModel | Type-safe, FastAPI native |
| **LLM** | Kimi-k2.5 | Korean/English bilingual, Ollama compatible |
| **Embedding** | BGE-M3 | Multilingual, SOTA performance |
| **API Framework** | FastAPI | Async native, auto OpenAPI docs |
| **Frontend** | Next.js 14 + shadcn/ui | Modern, accessible, rapid development |
| **Network** | Tailscale | Secure remote access, zero config VPN |

## Security Considerations

```mermaid
flowchart TB
    subgraph Security["🔒 Security Layers"]
        A["Network: Tailscale<br/>mTLS + WireGuard"]
        B["API: CORS + Auth"]
        C["Data: Input Validation<br/>SQL Injection Prevention"]
        D["Config: .env files<br/>Never commit secrets"]
    end

    Security --> E["🛡️ Protected System"]

    style E fill:#96CEB4,stroke:#333
```

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| LLM Extraction | 2-5s | Depends on context length |
| Embedding Generation | 100-300ms | Per text chunk |
| Similarity Search | 50-100ms | In-memory cache |
| Database Query | 10-50ms | SQLite, indexed |
| API Response | 3-6s | Total pipeline |

## Scaling Strategy

```mermaid
graph LR
    subgraph Current["Current (POC)"]
        A1["Single Process"]
        B1["SQLite File"]
        C1["Local Ollama"]
    end

    subgraph Future["Future (Production)"]
        A2["Gunicorn Workers"]
        B2["PostgreSQL Cluster"]
        C2["Dedicated LLM Service"]
        D2["Redis Cache"]
        E2["Load Balancer"]
    end

    Current --"Horizontal Scale"--> Future

    style Current fill:#FFE66D,stroke:#333
    style Future fill:#96CEB4,stroke:#333
```

---

*Last Updated: 2026-04-26*
