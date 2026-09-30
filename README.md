# ImpactLens

> **Turn field media into verified evidence, project intelligence, and audit-ready impact.**

ImpactLens is an AI-powered media intelligence platform designed for NGOs, environmental initiatives, government agencies, and infrastructure teams. It transforms unstructured field photos and videos into searchable evidence, project intelligence, verified impact records, and campaign-ready stories with full Cloudinary media provenance.

---

## 🌟 Core Product Pillars

1. **DISCOVER (Media Intelligence & Semantic Search)**
   - Natural language semantic search across visual assets.
   - AI auto-tagging, object detection, and activity classification.
   - Multi-dimensional filters (initiative, location, date, confidence, verification status).
   - Traceable source evidence linked directly to ground initiatives.

2. **MONITOR (Longitudinal Phase & Change Tracking)**
   - Milestone tracking (Baseline → Implementation → Monitoring → Completion).
   - Interactive Before & After photographic comparisons (Side-by-Side, Interactive Swipe, AI Change Map).
   - Geospatial evidence visualization across field locations.

3. **VERIFY (Human-in-the-Loop AI Verification)**
   - Structured verification queue with confidence scoring and AI rationale.
   - One-click verification actions: **Confirm**, **Reject / False Positive**, or **Flag for Inspection**.
   - Cloudinary asset traceability (`public_id`, format, dimensions, bytes, delivery URLs).
   - Evidence Passports providing complete chain-of-custody metadata.

4. **CREATE (Impact Reporting & Story Studio)**
   - Auto-generated impact reports with executive summaries, metrics, and timeline events.
   - AI Story Studio to compile 3–5 field assets into campaign-ready communications.
   - Cloudinary dynamic transformations (Original, 1:1 Social Square, 9:16 Story/Reel, 16:9 Landscape).
   - PDF export capability for donor updates and compliance packages.

---

## 🏗️ Architecture

```text
                           ┌───────────────────────────────┐
                           │   REACT 19 + VITE FRONTEND    │
                           │     (TanStack Router / Start) │
                           │       http://localhost:5173   │
                           └───────────────┬───────────────┘
                                           │
                               Proxy / REST API (JSON)
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │    NODE + EXPRESS BACKEND     │
                           │         (TypeScript)          │
                           │       http://localhost:5000   │
                           └───────────────┬───────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                              ▼
     ┌──────────────┐              ┌──────────────┐               ┌───────────────┐
     │  Cloudinary  │              │  AI Vision   │               │  PostgreSQL   │
     │  CDN Storage │              │  Service     │               │   (Prisma)    │
     │  Transforms  │              │  (NVIDIA/LLM)│               │  Persistent DB│
     └──────────────┘              └──────────────┘               └───────────────┘
```

---

## 📋 Prerequisites

Before running the application, ensure you have installed:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **bun**
- **Docker & Docker Compose** (recommended for running PostgreSQL), or a local **PostgreSQL** instance
- **Cloudinary Account** (Free tier works great)

---

## 🗄️ Database Setup (Step-by-Step)

ImpactLens uses **PostgreSQL** managed with **Prisma ORM**. It also includes an automatic in-memory fallback if PostgreSQL is not immediately reachable, ensuring uninterrupted development.

### Method 1: Docker (Recommended)

1. **Start the PostgreSQL container** using the provided `docker-compose.yml`:
   ```bash
   # From the project root:
   docker-compose up -d
   ```
   This spins up a PostgreSQL 15 container with:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `impactlens_db`
   - **User**: `impactuser`
   - **Password**: `impactpass`

2. **Verify container status**:
   ```bash
   docker ps
   ```

3. **Apply the Prisma schema & generate client**:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the database** with initial initiatives, sample field assets, and verification items:
   ```bash
   npm run seed
   ```

---

### Method 2: Local / Native PostgreSQL (Without Docker)

1. **Create the database**:
   Log in to PostgreSQL CLI (`psql`) and run:
   ```sql
   CREATE DATABASE impactlens_db;
   CREATE USER impactuser WITH ENCRYPTED PASSWORD 'impactpass';
   GRANT ALL PRIVILEGES ON DATABASE impactlens_db TO impactuser;
   ```

2. **Configure your connection string** in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://impactuser:impactpass@localhost:5432/impactlens_db?schema=public"
   ```

3. **Push schema and seed**:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

---

### Database Troubleshooting & Fallback

- **Check persistence status**: Visit `http://localhost:5000/health` or `http://localhost:5000/api/system/status`.
  - When connected to PostgreSQL: `"persistence": { "mode": "live", "durable": true }`
  - If offline: `"persistence": { "mode": "degraded", "durable": false }` (backend continues operating using in-memory mock stores).
- **Reset database**:
  ```bash
  npx prisma migrate reset
  npm run seed
  ```
- **Inspect database visually**:
  ```bash
  npx prisma studio
  ```
  Opens Prisma Studio at `http://localhost:5555`.

---

## 🚀 Getting Started

### 1. Backend Setup

1. **Navigate to the backend directory and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   PORT=5000
   NODE_ENV=development

   # Database
   DATABASE_URL="postgresql://impactuser:impactpass@localhost:5432/impactlens_db?schema=public"

   # Cloudinary (Required for live asset uploads & transformations)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # AI Vision Model (Optional: NVIDIA NIM, OpenAI, or Gemini)
   AI_API_KEY=your_vision_api_key
   AI_BASE_URL=https://integrate.api.nvidia.com/v1
   AI_MODEL=meta/llama-3.2-11b-vision-instruct

   # Rate Limiting
   RATE_LIMIT_PER_MINUTE=5000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Backend starts at `http://localhost:5000`.

---

### 2. Frontend Setup

1. **Navigate to the frontend directory and install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure frontend environment**:
   Verify or create `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The UI will be accessible at: **[http://localhost:5173](http://localhost:5173)**.

---

## 🗺️ Application Routes

| Route | Page Name | Purpose |
|---|---|---|
| `/` | Landing Page | Platform value proposition, KPI cards, and feature highlights |
| `/dashboard` | Executive Dashboard | High-level metrics, verification progress, and recent field uploads |
| `/projects` | Initiatives Gallery | Browse all impact projects, view status & evidence metrics |
| `/projects/:id` | Project Intelligence | Detail workspace: Milestones, Evidence Requirements, Before/After & Map |
| `/media` | Media Explorer | Filter, view, and inspect all Cloudinary-stored evidence |
| `/media/:id` | Evidence Passport | Deep inspection: AI tags, confidence scores, GPS coordinates, Cloudinary CDN info |
| `/verify` | Verification Queue | Human-in-the-loop review workflow (Confirm / Reject / Inspect) |
| `/compare` | Visual Comparison | Before vs. After comparison slider, swipe mode, and change detection |
| `/story` | Story Studio | Generate narrative stories from 3–5 field assets for social & donor communication |
| `/reports` | Impact Reports | Generate and download audit-ready impact reports |
| `/analytics` | Impact Analytics | Verification metrics, CO₂ offset, hectares restored, and data visualizers |

---

## ☁️ Cloudinary Capabilities

ImpactLens leverages Cloudinary as a foundational asset management and transformation layer:
- **Direct Multi-Part Uploads**: Upload field photos & videos directly into designated project folders.
- **Dynamic Transformation Presets**:
  - `optimized`: `f_auto,q_auto` delivery.
  - `square` (1:1): `c_fill,ar_1:1,g_auto` for social feeds.
  - `portrait` (9:16): `c_fill,ar_9:16,g_auto` for Instagram / TikTok / mobile stories.
  - `landscape` (16:9): `c_fill,ar_16:9,g_auto` for report presentations.
  - `thumbnail`: `c_thumb,w_400,h_300,g_auto` for fast gallery cards.
- **Full Provenance & Traceability**: Each asset retains its `public_id`, format, dimensions, byte size, and original asset URL.

---

## 🤖 AI Vision Analysis Schema

Field assets processed through the AI pipeline generate structured metadata:

```json
{
  "title": "Mangrove restoration sapling monitoring",
  "description": "Field workers planting mangrove propagules along the tidal wetland shoreline.",
  "objects": ["mangrove propagules", "field workers", "tidal mudflat", "estuary"],
  "activities": ["mangrove restoration", "community field planting"],
  "tags": ["environment", "wetlands", "biodiversity", "reforestation"],
  "impactSignals": ["healthy root establishment", "active seedling coverage"],
  "riskSignals": ["tidal debris encroachment"],
  "confidence": 94,
  "evidenceQuality": "high"
}
```

---

## 🛠️ Useful Commands

### Backend (`/backend`)
```bash
npm run dev              # Start backend dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled production server
npm run prisma:generate  # Re-generate Prisma Client
npm run prisma:push      # Push Prisma schema directly to DB
npm run prisma:migrate   # Run database migrations
npm run seed             # Seed database with sample projects & media
npm run test:cloudinary  # Test Cloudinary connection & credentials
npm run test:ai          # Test AI vision integration
```

### Frontend (`/frontend`)
```bash
npm run dev              # Start Vite dev server on port 5173
npm run build            # Production client & SSR bundle build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint checks
```

---

## 🔒 Security & Git Hygiene

- Keep all `.env` files strictly out of version control.
- Root, `backend/`, and `frontend/` directories include dedicated `.gitignore` files protecting credentials, node modules, build artifacts, and agent scratchpads.
- When committing, only include template files like `.env.example`.

---

## 📄 License

This project is licensed under the MIT License.
