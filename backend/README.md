# ImpactLens Backend API

Production-ready backend API service for **ImpactLens** — Turn field media into evidence, intelligence, and impact.

Built with **Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, and Cloudinary SDK**.

---

## Architecture Flow

```text
Field Media Upload
       ↓
Cloudinary Media Pipeline (f_auto, q_auto, multi-aspect presets)
       ↓
AI Vision Analysis (Structured JSON: objects, activities, tags, risks, impacts)
       ↓
PostgreSQL Database (Prisma Models)
       ↓
Discover (Search) / Monitor (Timelines & Before/After) / Verify (Human-in-the-Loop)
       ↓
Impact Reports & Stories
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `DATABASE_URL` and `CLOUDINARY_*` credentials.

### 4. Database Setup & Seed
If using Docker for PostgreSQL:
```bash
docker-compose up -d
```

Run Prisma migrations & seed demo dataset:
```bash
npx prisma db push
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

---

## API Endpoints Reference

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get detailed project information
- `POST /api/projects` - Create new project

### Media & Cloudinary Pipeline
- `GET /api/media` - Filterable media explorer (by project, tag, media type)
- `GET /api/media/:id` - Detailed asset information with Cloudinary metadata
- `POST /api/media/upload` - Upload media file or URL to Cloudinary
- `POST /api/media/:id/analyze` - Trigger AI vision analysis returning structured JSON

### Semantic Discovery
- `GET /api/search?q={query}` - Natural language evidence search

### Visual Monitoring & Comparison
- `POST /api/comparisons` - Compare before/after media assets

### Human Verification Workflow
- `GET /api/verifications` - Review queue of AI-flagged observations & risks
- `PATCH /api/verifications/:id` - Update status (`CONFIRMED`, `FALSE_POSITIVE`, `NEEDS_INSPECTION`)

### Automated Intelligence Reports
- `GET /api/reports` - List generated impact reports
- `GET /api/reports/:id` - Get comprehensive report detail
- `POST /api/reports/generate` - Generate impact report from project evidence

### Content & Stories
- `GET /api/stories` - List published stories
- `POST /api/stories/generate` - Generate impact story, campaign copy, or social media post

### Dashboard
- `GET /api/dashboard/stats` - Command center KPI metrics and recent activity
