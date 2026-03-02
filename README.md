# MyBase

MyBase is a full-stack backend-as-a-service platform I built from scratch. It lets users create isolated backend projects where each project gets its own PostgreSQL database, auto-generated REST API, and file storage. Through a clean dashboard, users can create tables with custom column types, insert and manage data through a visual editor, and instantly query their data from any external app using a project API key. Authentication supports both email/password and GitHub OAuth. The entire stack is self-hosted Angular frontend on Vercel, FastAPI backend on Render, PostgreSQL on Neon, and file storage on Cloudflare R2.

**Live demo:** [my-base-xi.vercel.app](https://my-base-xi.vercel.app)

---

## What it does

MyBase lets you spin up isolated backend projects in seconds. Each project gets:

- **PostgreSQL database** — create tables with custom columns, insert/edit/delete rows through a visual editor
- **Auto-generated REST API** — every table is instantly accessible via a project API key
- **File storage** — powered by Cloudflare R2 (10 GB free, no egress fees)
- **Authentication** — email/password and GitHub OAuth

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Database (meta) | PostgreSQL via Neon |
| Per-project data | PostgreSQL schemas (one per project) |
| File storage | Cloudflare R2 (S3-compatible) |
| Frontend | Angular 21 + Angular Material |
| Auth | JWT + bcrypt + GitHub OAuth |
| Backend hosting | Render.com |
| Frontend hosting | Vercel |

---

## Features

- **Project isolation** — each project has its own PostgreSQL schema and API key
- **Visual table editor** — create tables, define column types, insert and edit rows in a spreadsheet-like UI
- **REST API** — query your data from any app using `x-api-key` header
- **GitHub login** — one-click OAuth alongside email/password
- **API reference tab** — auto-generated JavaScript, Python, and cURL examples per project
- **Cloudflare R2 storage** — upload and manage files per project
- **Dark UI** — fully custom Angular Material dark theme

---

## API usage

Every table you create is accessible via REST:

```bash
# Get all rows
curl https://mybase-of2t.onrender.com/data/your_table \
  -H "x-api-key: YOUR_PROJECT_API_KEY"

# Insert a row
curl -X POST https://mybase-of2t.onrender.com/data/your_table \
  -H "x-api-key: YOUR_PROJECT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 30}'

# Update a row
curl -X PATCH https://mybase-of2t.onrender.com/data/your_table/1 \
  -H "x-api-key: YOUR_PROJECT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"age": 31}'

# Delete a row
curl -X DELETE https://mybase-of2t.onrender.com/data/your_table/1 \
  -H "x-api-key: YOUR_PROJECT_API_KEY"
```

Query parameters: `?limit=50&offset=0&order_by=created_at&order_dir=desc&select=id,name`

---

## Running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=sqlite:///./data/mybase.db
SECRET_KEY=your-secret-key
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=mybase-storage
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=http://localhost:4200
```

```bash
uvicorn app.main:app --reload --port 8003
```

API docs available at `http://localhost:8003/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:4200`

---

## Deploying your own instance

### 1. Neon (free PostgreSQL)
Sign up at [neon.tech](https://neon.tech), create a project, copy the connection string.

### 2. Cloudflare R2 (free storage)
Sign up at [cloudflare.com](https://cloudflare.com), create an R2 bucket, generate API tokens.

### 3. GitHub OAuth App
Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
Set callback URL to `https://your-render-url.onrender.com/auth/github/callback`.

### 4. Render (backend)
- Connect your GitHub repo
- Set root directory to `backend`
- Add all environment variables (see `.env` above)

### 5. Vercel (frontend)
- Connect your GitHub repo
- Set root directory to `frontend`
- Vercel auto-detects Angular

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (generate a random 64-char hex string) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `FRONTEND_URL` | Your Vercel URL (for CORS and OAuth redirects) |
