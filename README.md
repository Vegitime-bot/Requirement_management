# Requirements Management System (RMS)

> **AI-Powered Requirements Extraction & Version Management Platform**

## 🎯 What is RMS?

RMS는 **AI 기반 요구사항 관리 시스템**입니다. 문서, 이메일, 회의록 등 비정형 데이터에서 자동으로 제품 요구사항을 추출하고, 버전 관리하며, 팀이 효율적으로 협업할 수 있게 합니다.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TB
    subgraph Input["📥 Input Layer"]
        A1["이메일 📧"]
        A2["기술 문서 📄"]
        A3["회의록 📝"]
        A4["스펙 문서 📋"]
    end

    subgraph AI["🤖 AI Processing Layer"]
        B1["LLM<br/>Kimi-k2.5"]
        B2["Embedding<br/>BGE-M3"]
        B3["유사도 매칭<br/>Cosine 0.75+"]
    end

    subgraph Core["💡 Core System"]
        C1["요구사항 추출"]
        C2["중복 검사"]
        C3["버전 관리"]
        C4["ID 자동 생성"]
    end

    subgraph Output["📤 Output Layer"]
        D1["구조화된 요구사항"]
        D2["버전 스냅샷"]
        D3["변경 이력"]
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
**After:** 문서/이메일 업로드 → AI가 자동 추출

```mermaid
sequenceDiagram
    participant User as 사용자
    participant API as /ingest/analyze
    participant LLM as Kimi-k2.5
    participant Embed as BGE-M3
    participant DB as SQLite

    User->>API: 원본 텍스트 업로드
    API->>LLM: 요구사항 추출 요청
    LLM-->>API: 추출된 요구사항 (JSON)
    API->>Embed: 유사도 계산 요청
    Embed-->>API: 기존 요구사항과 유사도
    API->>DB: 검토 후 저장
    API-->>User: 추천 액션 (create/update/skip)
```

**예시:**
```
입력: "The system must implement OAuth2 authentication for secure user login. 
       Users should be able to export their data to CSV format."

출력:
┌─────────────────────────────────────────────────────────┐
│ 📌 OAuth2 Authentication Support                        │
│    └─ 우선순위: critical | confidence: 0.9               │
│                                                          │
│ 📌 CSV Data Export                                       │
│    └─ 우선순위: medium | confidence: 0.9                 │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Smart ID System 🏷️

```mermaid
graph LR
    subgraph ID["요구사항 ID 체계"]
        A["Product Code<br/>VR51"]
        B["Variant Code<br/>STD"]
        C["Category Code<br/>SEC"]
        D["Sequence<br/>0001"]
    end
    
    ID --> E["VR51-STD-SEC-0001"]
    style E fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff
```

**형식:** `{ProductCode}-{VariantCode}-{CategoryCode}-{Seq:04d}`

| 예시 | 설명 |
|------|------|
| `VR51-STD-SEC-0001` | VR51 제품, Standard 변형, Security 카테고리, 1번 |
| `VR51-PRO-CORE-0042` | VR51 제품, Pro 변형, Core 카테고리, 42번 |

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

**특정 시점의 요구사항 전체 스냅샷 저장**
- 언제든 이전 버전으로 rollback 가능
- 버전 간 diff 비교
- 릴리즈 관리

---

## 🛠️ Tech Stack

```mermaid
mindmap
  root((RMS))
    Backend
      FastAPI
      SQLModel
      SQLite
    AI/ML
      Kimi-k2.5
      BGE-M3
      Ollama
    Frontend
      Next.js
      shadcn/ui
      Tailwind CSS
    Infrastructure
      Tailscale
      uvicorn
```

| 레이어 | 기술 | 용도 |
|--------|------|------|
| **Backend** | FastAPI + SQLModel | REST API, ORM |
| **Database** | SQLite (POC) / PostgreSQL (Prod) | 데이터 영속화 |
| **LLM** | Kimi-k2.5 (Ollama) | 요구사항 추출 |
| **Embedding** | BGE-M3 (Ollama) | 의미적 유사도 계산 |
| **Frontend** | Next.js 14 + shadcn/ui | 사용자 인터페이스 |
| **Network** | Tailscale | 보안 원격 접근 |

---

## 🔄 Data Flow

```mermaid
flowchart LR
    A["📝 Raw Context<br/>이메일/문서"] -->|"POST /ingest/analyze"| B["🤖 LLM Processing"]
    B -->|"Extracted JSON"| C["📊 Similarity Check<br/>BGE-M3 Embedding"]
    C -->|"Suggestions"| D["👤 Human Review"]
    D -->|"Selected Actions"| E["💾 Apply Changes<br/>POST /ingest/apply"]
    E -->|"req_id generated"| F["📦 Requirement Saved"]
    F -->|"Optional"| G["🏷️ Create Version"]
```

---

## 📊 API Endpoints

```mermaid
graph TB
    subgraph API["REST API Layer"]
        A1["/products<br/>CRUD"]
        A2["/products/{id}/requirements<br/>CRUD + Actions"]
        A3["/products/{id}/versions<br/>버전 관리"]
        A4["/products/{id}/variants<br/>변형 관리"]
        A5["/products/{id}/categories<br/>카테고리"]
        A6["/ingest/analyze<br/>AI 추출"]
        A7["/ingest/apply<br/>적용"]
        A8["/product-groups<br/>그룹 관리"]
    end

    style A6 fill:#FF6B6B,stroke:#333,color:#fff
    style A7 fill:#FF6B6B,stroke:#333,color:#fff
```

### Core Endpoints

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/ingest/analyze` | AI 요구사항 추출 |
| POST | `/ingest/apply` | 추출 결과 적용 |
| GET/POST | `/products/{id}/requirements` | 요구사항 CRUD |
| GET/POST | `/products/{id}/versions` | 버전 관리 |

---

## 🎯 Use Cases

### Scenario 1: 이메일에서 요구사항 추출

```
📧 수신 이메일:
"안녕하세요, 시스템에 OAuth2 로그인 기능을 추가해주세요. 
 또한 사용자 데이터를 CSV로 내보낼 수 있으면 좋겠습니다. 
 다음 주 금요일까지 완료 부탁드립니다."

↓ AI 분석

📋 추출된 요구사항:
   ✅ REQ-001: OAuth2 Authentication (critical)
   ✅ REQ-002: CSV Data Export (medium)
   ❌ 납기일 요청 (필터링됨)
```

### Scenario 2: 버전 관리

```
📦 v1.0-beta 릴리즈:
   - OAuth2 로그인
   - CSV 내보내기
   - 기본 검색 기능

📦 v1.0-stable 릴리즈:
   + SAML SSO 추가
   + 성능 최적화
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Ollama (local LLM)
- Node.js 18+ (frontend)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env 파일 생성
cat > .env << EOF
LLM_API_URL=http://localhost:11434/v1
LLM_MODEL=kimi-k2.5:cloud
EMBEDDING_API_URL=http://localhost:11434
EMBEDDING_MODEL=bge-m3
EOF

# Ollama 모델 다운로드
ollama pull kimi-k2.5:cloud
ollama pull bge-m3

# 서버 실행
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Future Roadmap

```mermaid
timeline
    title RMS Roadmap
    2026-Q2 : POC 완성
            : SQLite + Ollama
            : 기본 Context Ingestion
    2026-Q3 : 프로덕션 준비
            : PostgreSQL 마이그레이션
            : 실시간 협업 (WebSocket)
            : 고급 필터/검색
    2026-Q4 : 엔터프라이즈 기능
            : SSO 통합
            : 권한 관리 (RBAC)
            : 외부 시스템 연동 (Jira, Confluence)
```

---

## 🏆 Key Achievements

| 기능 | 기술 | 상태 |
|------|------|------|
| AI 요구사항 추출 | Kimi-k2.5 | ✅ 완료 |
| 의미적 유사도 | BGE-M3 | ✅ 완료 |
| 자동 ID 생성 | {Product}-{Var}-{Cat}-{Seq} | ✅ 완료 |
| 버전 관리 | Snapshot 기반 | ✅ 완료 |
| 변경 이력 | Actions 테이블 | ✅ 완료 |
| 멀티 테넌트 | Product Groups | ✅ 완료 |

---

## 📞 Contact

- **Repository:** https://github.com/Vegitime-bot/Requirement_management
- **Tech Stack:** FastAPI, Next.js, SQLModel, Ollama
- **License:** MIT

---

*Built with ❤️ by Vegitime-bot*
