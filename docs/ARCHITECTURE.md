# RMS Architecture

## System Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Web["Web Application"]
        Mobile["Mobile (Future)"]
    end

    subgraph Gateway["API Gateway"]
        FastAPI["FastAPI Server"]
        CORS["CORS Middleware"]
        Auth["Authentication"]
    end

    subgraph Core["Core Services"]
        subgraph Ingestion["Context Ingestion"]
            LLM["LLM Service"]
            Embed["Embedding Service"]
            Matcher["Similarity Matcher"]
        end

        subgraph Domain["Domain Logic"]
            Product["Product Manager"]
            Req["Requirement Manager"]
            Version["Version Manager"]
            IDGen["ID Generator"]
        end
    end

    subgraph Data["Data Layer"]
        DB[(Relational Database)]
    end

    Client --> Gateway
    Gateway --> Core
    Ingestion --> Domain
    Domain --> Data

    style LLM fill:#FF6B6B,stroke:#333
    style Embed fill:#4ECDC4,stroke:#333
    style DB fill:#96CEB4,stroke:#333
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
    A["Raw Text"] --> B["LLM Extraction"]
    B --> C{"Is Product Requirement?"}
    C -->|Yes| D["Embedding Vectorization"]
    C -->|No| E["Filter Out"]
    D --> F["Similarity Search"]
    F --> G{"Match Found?"}
    G -->|Yes| H["Suggest UPDATE"]
    G -->|No| I["Suggest CREATE"]
    H --> J["Human Review"]
    I --> J
    J --> K["Apply Changes"]

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

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Backend** | FastAPI + SQLModel | Type-safe, async-native, OpenAPI docs |
| **Database** | PostgreSQL | ACID compliant, scalable |
| **ORM** | SQLModel | Pydantic + SQLAlchemy integration |
| **LLM** | OpenAI Compatible API | Flexible provider selection |
| **Embedding** | Vector Embeddings | Semantic similarity search |
| **Frontend** | Next.js + React | SSR, modern DX |
| **Styling** | Tailwind CSS | Utility-first, rapid development |

## Security Considerations

```mermaid
flowchart TB
    subgraph Security["Security Layers"]
        A["Network: TLS/HTTPS"]
        B["API: CORS + Auth"]
        C["Data: Input Validation"]
        D["Config: Environment Variables"]
    end

    Security --> E["Protected System"]

    style E fill:#96CEB4,stroke:#333
```

## Scaling Strategy

```mermaid
graph LR
    subgraph Current["Current"]
        A1["Application Server"]
        B1["Database"]
        C1["LLM API"]
    end

    subgraph Future["Future"]
        A2["Load Balancer"]
        B2["App Cluster"]
        C2["Read Replicas"]
        D2["Cache Layer"]
    end

    Current --"Scale Horizontally"--> Future

    style Current fill:#FFE66D,stroke:#333
    style Future fill:#96CEB4,stroke:#333
```

---

*Last Updated: 2026-04-26*
