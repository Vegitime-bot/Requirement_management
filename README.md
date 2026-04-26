# Requirements Management System (RMS)

> **AI-Powered Requirements Extraction & Version Management Platform**

---

## 🎯 What is RMS?

RMS는 **AI 기반 요구사항 관리 시스템**입니다. 비정형 데이터(이메일, 문서, 회의록)에서 자동으로 제품 요구사항을 추출하고, 체계적인 버전 관리와 협업 기능을 제공합니다.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Input["📥 Input Layer"]
        A1["이메일 📧"]
        A2["기술 문서 📄"]
        A3["회의록 📝"]
        A4["스펙 문서 📋"]
    end

    subgraph AI["🤖 AI Processing Layer"]
        B1["LLM Engine<br/>요구사항 추출"]
        B2["Embedding Engine<br/>의미적 유사도 계산"]
        B3["Smart Matcher<br/>중복 감지"]
    end

    subgraph Core["💡 Core System"]
        C1["Requirement Extractor"]
        C2["Duplicate Detector"]
        C3["Version Manager"]
        C4["ID Generator"]
    end

    subgraph Output["📤 Output Layer"]
        D1["Structured Requirements"]
        D2["Version Snapshots"]
        D3["Change History"]
    end

    Input --> B1
    B1 --> C1
    C1 --> B2
    B2 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> Output
```

---

## ✨ Key Features

### 1. AI Context Ingestion 🤖

**Before:** 수동으로 요구사항 입력  
**After:** 문서 업로드 → AI가 자동 추출

```mermaid
sequenceDiagram
    participant User as 사용자
    participant API as Ingestion API
    participant LLM as LLM Engine
    participant Embed as Embedding Engine
    participant DB as Database

    User->>API: 원본 텍스트 업로드
    API->>LLM: 요구사항 추출 요청
    LLM-->>API: 추출된 요구사항 (JSON)
    API->>Embed: 유사도 계산 요청
    Embed-->>API: 기존 요구사항과 유사도
    API->>DB: 검토 후 저장
    API-->>User: 추천 액션 (create/update/skip)
```

**Example:**

```
📧 Input (Email):
"안녕하세요, 시스템에 OAuth2 로그인 기능을 추가해주세요. 
또한 사용자 데이터를 CSV로 내보낼 수 있으면 좋겠습니다. 
다음 주 금요일까지 완료 부탁드립니다."

↓ AI Analysis

📋 Output (Structured Requirements):
┌─────────────────────────────────────────────────────────┐
│ 📌 REQ-001: OAuth2 Authentication Support               │
│    └─ Priority: Critical | Confidence: 0.92          │
│                                                          │
│ 📌 REQ-002: CSV Data Export                             │
│    └─ Priority: Medium | Confidence: 0.89            │
│                                                          │
│ 🗑️ Filtered: "다음 주 금요일까지" (Deadline, not req)  │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Smart ID System 🏷️

```mermaid
graph LR
    subgraph ID["Requirement ID Format"]
        A["Product Code<br/>VR51"] ---
        B["Variant Code<br/>STD"] ---
        C["Category Code<br/>SEC"] ---
        D["Sequence<br/>0001"]
    end
    
    ID --> E["VR51-STD-SEC-0001"]
    style E fill:#4CAF50,stroke:#333,stroke-width:3px,color:#fff
```

**Format:** `{ProductCode}-{VariantCode}-{CategoryCode}-{Seq:04d}`

| Example | Description |
|---------|-------------|
| `VR51-STD-SEC-0001` | VR51 Product, Standard Variant, Security Category, #1 |
| `VR51-PRO-CORE-0042` | VR51 Product, Pro Variant, Core Category, #42 |

---

### 3. Version Management 📦

```mermaid
gitGraph
    commit id: "v1.0-beta"
    commit id: "v1.0-release"
    branch feature/oauth2
    commit id: "add-oauth"
    checkout main
    merge feature/oauth2 id: "v1.1-release"
    commit id: "v2.0-stable"
```

**Capabilities:**
- 특정 시점의 요구사항 전체 스냅샷 저장
- 언제든 이전 버전으로 rollback 가능
- 버전 간 diff 비교
- 릴리즈 관리

---

## 🛠️ Technology Stack

```mermaid
mindmap
  root((RMS))
    Backend
      FastAPI
      SQLModel
      Python 3.9+
    AI/ML
      LLM Engine
      Embedding Model
    Frontend
      Next.js
      React
      Tailwind CSS
    Database
      Relational DB
      SQL
```

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | FastAPI + SQLModel | REST API, ORM |
| **Database** | PostgreSQL | Data Persistence |
| **LLM** | OpenAI Compatible API | Requirement Extraction |
| **Embedding** | Vector Embeddings | Semantic Similarity |
| **Frontend** | Next.js + React | User Interface |

---

## 🔄 Data Flow

```mermaid
flowchart LR
    A["📝 Raw Context<br/>Email/Doc/Meeting"] -->|"POST /ingest/analyze"| B["🤖 LLM Processing"]
    B -->|"Extracted JSON"| C["📊 Similarity Check<br/>Embedding"]
    C -->|"Suggestions"| D["👤 Human Review"]
    D -->|"Selected Actions"| E["💾 Apply Changes<br/>POST /ingest/apply"]
    E -->|"req_id generated"| F["📦 Requirement Saved"]
    F -->|"Optional"| G["🏷️ Create Version"]
```

---

## 📊 API Overview

```mermaid
graph TB
    subgraph API["REST API Endpoints"]
        A1["/products<br/>Product CRUD"]
        A2["/products/{id}/requirements<br/>Requirement Management"]
        A3["/products/{id}/versions<br/>Version Control"]
        A4["/products/{id}/variants<br/>Variant Management"]
        A5["/products/{id}/categories<br/>Category Management"]
        A6["/ingest/analyze<br/>AI Extraction"]
        A7["/ingest/apply<br/>Apply Changes"]
        A8["/product-groups<br/>Team Collaboration"]
    end

    style A6 fill:#FF6B6B,stroke:#333,color:#fff
    style A7 fill:#FF6B6B,stroke:#333,color:#fff
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ingest/analyze` | AI-powered requirement extraction |
| POST | `/ingest/apply` | Apply extracted requirements |
| GET/POST | `/products/{id}/requirements` | Requirement CRUD + Actions |
| GET/POST | `/products/{id}/versions` | Version management |

---

## 🎯 Use Cases

### Scenario 1: Email to Structured Requirements

```
📧 Received Email:
"안녕하세요, 시스템에 OAuth2 로그인 기능을 추가해주세요. 
또한 사용자 데이터를 CSV로 내보낼 수 있으면 좋겠습니다. 
다음 주 금요일까지 완료 부탁드립니다."

↓ AI Processing

📋 Extracted Requirements:
   ✅ REQ-001: OAuth2 Authentication (critical)
   ✅ REQ-002: CSV Data Export (medium)
   ❌ Deadline request (filtered out)

💡 Suggested Actions:
   - Create REQ-001: New requirement
   - Create REQ-002: New requirement
```

### Scenario 2: Duplicate Prevention

```
📝 New Input: "Implement OAuth2-based user authentication"

🔍 Existing: "Add OAuth2 login support for secure access"

📊 Similarity Score: 0.835 (High)

💡 Suggestion: UPDATE existing requirement instead of creating duplicate
```

### Scenario 3: Version Management

```
📦 v1.0-beta Release:
   - OAuth2 Authentication
   - CSV Export
   - Basic Search

📦 v1.0-stable Release:
   + SAML SSO (added)
   + Performance Optimization (added)
   
🔒 Snapshot saved: All requirements at v1.0-stable state
```

---

## 🏆 Key Achievements

| Feature | Technology | Status |
|---------|------------|--------|
| AI Requirement Extraction | LLM | ✅ Complete |
| Semantic Similarity | Vector Embeddings | ✅ Complete |
| Auto ID Generation | Structured Format | ✅ Complete |
| Version Management | Snapshot-based | ✅ Complete |
| Change History | Event Sourcing | ✅ Complete |
| Multi-tenancy | Product Groups | ✅ Complete |
| Duplicate Detection | Cosine Similarity | ✅ Complete |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- LLM API Access (OpenAI Compatible)

### Quick Start

```bash
# 1. Clone Repository
git clone https://github.com/Vegitime-bot/Requirement_management.git
cd Requirement_management

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Configure Environment
cp .env.example .env
# Edit .env with your LLM API settings

# 4. Run Backend
python app.py

# 5. Setup Frontend (New Terminal)
cd ../frontend
npm install
npm run dev

# 6. Open Browser
# http://localhost:3000
```

---

## 📁 Project Structure

```
requirements-management-system/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── services/
│   │   ├── llm.py            # LLM integration
│   │   └── embedding.py      # Embedding service
│   └── tests/                # Test suite
├── frontend/
│   ├── app/                  # Next.js pages
│   └── components/           # React components
├── docs/                     # Documentation
└── README.md                 # This file
```

---

## 📈 Future Roadmap

```mermaid
timeline
    title RMS Roadmap
    2026-Q2 : MVP Complete
            : Core Features
    2026-Q3 : Production Ready
            : Advanced Filters
            : Collaboration Features
    2026-Q4 : Enterprise Features
            : SSO Integration
            : External System Connectors
```

---

## 📞 Links

- **Repository:** https://github.com/Vegitime-bot/Requirement_management
- **Documentation:** See `docs/` directory

---

*Built with ❤️ for better requirement management*
