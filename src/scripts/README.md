# SGMakan Scripts

Database management and AI cafe discovery scripts for SGMakan.

## Quick Setup

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Choose your organization and set:
   - **Name**: sgmakan (or any name)
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 2. Run Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `src/scripts/schema.sql`
4. Click **Run** (or press Ctrl+Enter)

### 3. Configure Environment

Copy the example env file in **project root**:
```bash
copy .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# React Frontend
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

# Node.js Scripts (uses service_role for RLS bypass)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Serper + OpenRouter
SERPER_API_KEY=your_serper_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3-next-80b-a3b-instruct:free
```

Get your credentials from:
- **Supabase keys**: https://supabase.com/dashboard/project/_/settings/api
- **Serper API key**: https://serper.dev
- **OpenRouter API key**: https://openrouter.ai/keys

### 4. Install Dependencies

```bash
npm install
```

### 5. Seed the Database

```bash
node src/scripts/seed-db.js
```

### 6. Run Weekly Cafe Discovery (Optional)

```bash
node src/scripts/cafe-curator.js
```

## Scripts Overview

| Script | Description |
|--------|-------------|
| `seed-db.js` | Populate database with sample neighborhoods and cafes |
| `cafe-curator.js` | **v3** — 4-stage AI pipeline: Discover → Extract → Verify → Enrich & Store |
| `db-config.js` | Supabase client configuration for scripts |
| `schema.sql` | Database schema (run in Supabase SQL Editor) |
| `setup-auth.sql` | Auth triggers and RLS policies |

## Cafe Curator v3 Pipeline

The `cafe-curator.js` script runs a 4-stage pipeline:

| Stage | What it does |
|-------|-------------|
| **1. Discover** | Searches 10 trusted Singapore food blogs via Serper for recent cafe articles (looks back 2 months) |
| **2. Extract** | Uses AI to pull official cafe names from article titles and snippets (batched, structured output) |
| **3. Verify** | Cross-checks each candidate against Google Places, runs fuzzy duplicate detection against DB, and uses an AI judge to confirm it's a real, open cafe/brunch spot in Singapore |
| **4. Enrich** | Generates description, detects vibe/tags/MRT/neighborhood, finds a valid image. High-confidence cafes auto-insert into `cafes`; low-confidence go to `pending_cafes` for admin review |

### Key improvements over v2
- **Fuzzy dedup** (Levenshtein + normalized name matching) prevents near-duplicate entries
- **AI judge** rejects non-cafes, closed places, and wrong matches
- **Confidence scoring** (0–1) with auto-approve threshold (80%+)
- **`pending_cafes` staging** for cafes that need admin review
- **Smart neighborhood detection** via address keywords + postal code mapping
- **Multiple search intents** ("new cafe", "new brunch", "newly opened cafe", "best new coffee")
- **Image validation** skips placeholder/broken URLs

## Database Tables

| Table | Description |
|-------|-------------|
| `neighborhoods` | Singapore neighborhoods |
| `cafes` | Approved cafe listings |
| `profiles` | User profiles (linked to Supabase Auth) |
| `favorites` | User's saved cafes |
| `pending_cafes` | AI-discovered cafes awaiting review |
| `ai_pipeline_log` | AI discovery run history |

## Environment Variables

All environment variables are stored in `.env` at the **project root**.

| Variable | Used By | Purpose |
|----------|---------|---------|
| `REACT_APP_SUPABASE_URL` | React app | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | React app | Public anon key (respects RLS) |
| `SUPABASE_URL` | Node scripts | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Node scripts | Service role key (bypasses RLS) |
| `SERPER_API_KEY` | Discovery | Google Search + Places via Serper |
| `OPENROUTER_API_KEY` | AI curator | OpenRouter API key |
| `OPENROUTER_MODEL` | AI curator | AI model (default: qwen/qwen3-next-80b-a3b-instruct:free) |

## Scheduling AI Discovery

The pipeline is already configured in `.github/workflows/ai-cafe-discovery.yml`.

### GitHub Actions (automatic — every Monday 2 AM SGT)

Required secrets (set in repo Settings → Secrets):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SERPER_API_KEY`
- `OPENROUTER_API_KEY`

Optional variable (Settings → Variables):
- `OPENROUTER_MODEL` (defaults to `qwen/qwen3-next-80b-a3b-instruct:free`)

You can also trigger it manually from the **Actions** tab → **AI Cafe Discovery** → **Run workflow**.

### Windows Task Scheduler (local alternative)

```
Program: node
Arguments: src/scripts/cafe-curator.js
Start in: C:\path\to\sgmakan
Schedule: Weekly
```
