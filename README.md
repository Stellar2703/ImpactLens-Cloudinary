# ImpactLens

> **Turn field media into evidence, intelligence, and impact.**

ImpactLens is an AI-powered media intelligence platform for NGOs, governments, sustainability organizations, and infrastructure teams. It transforms raw field images and videos into searchable evidence, project intelligence, verified impact, and campaign-ready stories.

---

## 🌟 The Four Core Product Pillars

1. **DISCOVER**
   - Natural language semantic media search
   - AI automatic visual feature tagging
   - Multi-dimensional filters (project, location, activity, media type)
   - Source evidence discovery across thousands of field assets

2. **MONITOR**
   - Project phase tracking (Baseline → Activity → Progress → Current)
   - Interactive Before/After photographic comparison slider
   - Longitudinal environmental metrics tracking (NDVI, soil moisture, erosion rates)
   - Infrastructure fatigue & stability monitoring

3. **VERIFY**
   - Human-in-the-Loop AI evidence verification queue
   - Cloudinary asset traceability (`public_id`, format, dimensions, active pipelines)
   - AI confidence scoring and observation details
   - One-click Confirm, False Positive, or Flag for Inspection workflows

4. **CREATE**
   - Automated impact report generator with executive summary and key statistics
   - AI campaign copy & social media story generator
   - Cloudinary multi-aspect transformation presets (Original 16:9, Social Feed 1:1, Story/Reel 9:16)
   - One-click copy, export, and publication workflows

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │   NEXT.JS FRONTEND   │
                         │   (App Router + UI)  │
                         └──────────┬───────────┘
                                    │
                               REST / JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    NODE + EXPRESS    │
                         │       BACKEND        │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌────────────┐       ┌──────────────┐      ┌─────────────┐
       │ Cloudinary │       │ AI Service   │      │ PostgreSQL  │
       │            │       │              │      │  (Prisma)   │
       │ Images     │       │ Vision LLM   │      │ Projects    │
       │ Videos     │       │ Structured   │      │ Media       │
       │ Presets    │       │ JSON Outputs │      │ Metadata    │
       └────────────┘       └──────────────┘      └─────────────┘
```

---

## 🚀 Quick Start

### 1. Run the Frontend (Next.js)

```bash
cd Frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Available Routes:
- `/` - Landing page with 4 feature pillars and high-level KPIs
- `/dashboard` - Executive command center with stats, recent projects, and media
- `/projects` - Initiative gallery
- `/projects/:id` - Detailed project intelligence, timeline, before/after, and risks
- `/media` - Media Explorer with Cloudinary transformation studio & upload modal
- `/search` - Natural language semantic evidence discovery
- `/monitor` - Phase tracker and interactive Before/After sliders
- `/verify` - Evidence verification queue for human-in-the-loop review
- `/reports` - Audit-ready impact report cards, viewer, and generator
- `/stories` - Story & campaign studio with multi-aspect ratio previews

---

### 2. Run the Backend (Node + Express + TypeScript)

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5000/api`.

#### Health Check:
`http://localhost:5000/health`

#### Database (Optional PostgreSQL with Docker):
```bash
docker-compose up -d
npx prisma db push
npm run seed
```
*(Note: If PostgreSQL is not running, the backend automatically operates with an in-memory resilient store seeded with full realistic demo data.)*

---

## ☁️ Cloudinary Integration

Cloudinary is a first-class component throughout ImpactLens:
- **Source Traceability**: Every media item displays its Cloudinary `public_id`, format, dimensions, size, and original secure URL.
- **Transformation Studio**: Integrated visual modal allowing live preview of:
  - Original (`q_auto, f_auto`)
  - Social Feed 1:1 (`ar_1:1, c_fill, g_auto`)
  - Mobile Story / Reel 9:16 (`ar_9:16, c_fill, g_auto`)
  - Report High-Res (`w_1200, c_limit, q_auto:best`)
  - Thumbnail (`w_400, h_300, c_fill, g_auto`)
- **Direct Link Copy**: One-click copy of production-ready CDN transformation URLs.

---

## 🤖 Structured AI Vision Pipeline

Every analyzed field asset yields structured, validated JSON:

```json
{
  "title": "Community tree plantation activity",
  "description": "Community members are planting young native saplings...",
  "objects": ["people", "saplings", "soil", "furrows"],
  "activities": ["tree plantation", "community participation"],
  "tags": ["environment", "plantation", "community", "sustainability"],
  "locationClues": ["rural corridor", "restoration basin"],
  "impactSignals": ["increased vegetation", "active community participation"],
  "riskSignals": [],
  "confidence": 0.94
}
```

---

## 📋 Hackathon Demo Data

Pre-seeded with 4 realistic initiatives:
1. **Green Village Restoration** (Tree plantation, land restoration, power line encroachment risk)
2. **Urban Infrastructure Safety** (Corridor LiDAR, vegetation pruning, flyover stress audit)
3. **Lake Restoration Initiative** (Water hyacinth harvesting, desilting, basin recovery)
4. **Flood Response 2026** (Inundation alerts, bridge foundation scour, arterial clearance)
