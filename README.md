# NUMM — National Unified Material Master Platform
### AI-Driven Harmonization & Deduplication for Central Public Sector Enterprises (CPSEs)
Government of India | "One Nation – One Material Code" Initiative

---

## 🏛️ Executive Overview

The National Unified Material Master (NUMM)** platform establishes an authoritative, unified material coding registry for India's Central Public Sector Enterprises (CPSEs). By leveraging deep learning semantic embeddings and zero-shot UNSPSC taxonomy classification, NUMM detects cross-enterprise duplicate inventory, standardizes item specifications, and generates globally unique **National Material Codes (NMCs) formatted as `NMC-{UNSPSC_CLASS}-{SEQUENCE_NUMBER}`.

### Target CPSEs
* ONGC (Oil and Natural Gas Corporation)
* BHEL (Bharat Heavy Electricals Limited)
* SAIL (Steel Authority of India)
* GAIL (Gas Authority of India)
* IOCL (Indian Oil Corporation)
* NTPC (National Thermal Power Corporation)
* NMDC (National Mineral Development Corporation)
* HAL (Hindustan Aeronautics Limited)
* BEL (Bharat Electronics Limited)
* CONCOR (Container Corporation of India)

---

## Key Modules

1. Auth & Multi-Tenancy Roles: Role-based access control (`SUPER_ADMIN`, `CPSE_ANALYST`, `REVIEWER`) with JWT auth and CPSE isolation.
2. Executive Command Dashboard: Real-time KPI stat cards, CPSE catalog distribution donut chart, 30-day deduplication velocity chart, and live Socket.IO activity feed.
3. Material Master Catalog Upload: Drag-and-drop CSV uploader with client-side header validation, 10-row preview, and dynamic schema column mapper.
4. AI Matching Engine (FastAPI): Python microservice powered by `sentence-transformers` (`all-MiniLM-L6-v2`) and `scikit-learn` cosine similarity with automatic fallback.
5. Cross-CPSE Duplicate Detection: Interactive similarity threshold slider (0–100%), side-by-side specification diffs, and bulk approval/rejection workflows.
6. Material Harmonization Workbench: Split-screen workflow with instant AI standardizations, single-key shortcuts (`A` = Approve, `R` = Reject, `E` = Edit, `N` = Next), and persistent local state.
7. National Material Code Registry: Searchable repository of authoritative NMCs with drilldown into linked enterprise codes and CSV export.
8. Harmonization Analytics & Heatmap: CPSEs (Y) × UNSPSC Segments (X) coverage matrix, reduction bar charts, and an interactive National Procurement Savings Estimator.
9. Immutable Audit Trail: Cryptographically traceable append-only event log with before/after state diff inspection.
10. SAP/ERP Integration Gateway: REST API key issuance, real-time webhook dispatching with test ping, and OpenAPI/Swagger documentation with cURL, Python, and Node.js snippets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Papa Parse, Zustand |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, Socket.IO, Bull Queue, Multer, Bcrypt, JWT |
| **AI Microservice** | Python 3.11+, FastAPI, Uvicorn, Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-Learn, PyTorch |
| **Databases & Cache** | PostgreSQL 16, Redis 7 (or high-performance local SQLite fallback) |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## ⚡ Quick Start with Docker Compose

To launch the complete containerized stack:

```bash
# 1. Clone the repository and enter directory
cd numm-platform

# 2. Start all services in the background
docker-compose up -d --build
```

### Services & Ports
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Express API**: [http://localhost:4000](http://localhost:4000)
- **FastAPI AI Microservice**: [http://localhost:8000](http://localhost:8000) (Docs at `/docs`)
- **PostgreSQL Database**: Port `5432`
- **Redis Event Queue**: Port `6379`

---

## 💻 Native Local Development (Zero Docker Required)

The project includes an automatic zero-dependency setup enabling immediate local execution:

### 1. Start Backend API
```bash
cd backend
npm install
npm run db:setup    # Runs Prisma push and seeds ~909 synthetic materials & users
npm run dev         # Starts backend API on http://localhost:4000
```

### 2. Start AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python main.py      # Starts FastAPI on http://localhost:8000
```

### 3. Start Frontend Web Application
```bash
cd frontend
npm install
npm run dev         # Starts Vite dev server on http://localhost:3000
```

---

## 🔑 Default Evaluation Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `admin@numm.gov.in` | `Admin@1234` | Full National Platform & API Keys |
| **CPSE_ANALYST** | `analyst@ongc.in` | `Analyst@1234` | ONGC Enterprise Catalog |
| **REVIEWER** | `reviewer@numm.gov.in` | `Review@1234` | Harmonization Workbench & NMC Approval |

*(Note: The login page and top bar include instant single-click role switchers for effortless evaluation.)*

---

## 📊 Sample Datasets Loaded

The database seed automatically pre-populates:
1. **`cpse_material_master_synthetic.csv`**: 909 realistic materials across ONGC, BHEL, SAIL, GAIL, IOCL, NTPC, NMDC, HAL, BEL, and CONCOR.
2. **`unspsc_trimmed.csv`**: Reference taxonomy mapping segments, families, classes, and commodities.
3. **5 Approved NMCs**: Pre-harmonized national material codes linking multiple CPSEs.
4. **Pre-detected Candidate Duplicate Pairs**: Immediate interactive evaluation on first launch.

---

## 🧪 Verification & Testing

- **Backend Health Check**: `GET http://localhost:4000/api/health`
- **AI Service Health Check**: `GET http://localhost:8000/health`
- **AI Classification**: `POST http://localhost:8000/classify`
- **OpenAPI / Swagger Spec**: `GET http://localhost:4000/api/integrations/openapi.json`
