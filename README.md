# Galaxxy Study Hub

A full-stack learning management application built with React, Python Flask, and Supabase PostgreSQL. Users can organize study materials into chapters and topics, write markdown notes, chat with an AI assistant, and take quizzes.

## Tech Stack

**Frontend:**
- React 18 + Vite
- React Router v7
- Tailwind CSS
- React Query (TanStack Query)
- Axios
- Supabase JS Client
- React Markdown + remark-gfm

**Backend:**
- Python Flask
- Flask SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Google Generative AI (Gemini)

**Database:**
- Supabase PostgreSQL with Row Level Security

## Prerequisites

- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

## Setup

### 1. Database

1. Go to your Supabase project → SQL Editor
2. Run the contents of `backend/schema.sql`
3. Enable Google OAuth in Supabase → Authentication → Providers

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in .env
cp .env.example .env

# Run
python run.py
```

### 3. Frontend

```bash
cd frontend
npm install

# Copy and fill in .env
cp .env.example .env

# Run
npm run dev
```

### 4. Environment Variables

**backend/.env:**
| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (Transaction mode, port 6543) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (Settings → API) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FLASK_SECRET_KEY` | Random secret string |
| `JWT_SECRET_KEY` | Random secret string for JWT |

**frontend/.env:**
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/sync` | Sync Supabase user + issue JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/chapters` | List chapters (supports `?q=` search) |
| POST | `/api/chapters` | Create chapter |
| GET | `/api/chapters/:id` | Get chapter with topics |
| PUT | `/api/chapters/:id` | Update chapter |
| DELETE | `/api/chapters/:id` | Delete chapter |
| GET | `/api/chapters/:id/topics` | List topics |
| POST | `/api/chapters/:id/topics` | Create topic |
| PUT | `/api/topics/:id` | Update topic |
| DELETE | `/api/topics/:id` | Delete topic |
| PUT | `/api/chapters/:id/topics/reorder` | Reorder topics |
| GET | `/api/topics/:id/content` | Get content |
| PUT | `/api/topics/:id/content` | Save content |
| POST | `/api/ai/chat` | AI chat (optional `chapter_id`) |
| POST | `/api/ai/quiz` | Generate quiz from chapter |
| POST | `/api/ai/quiz/submit` | Submit quiz answers |
| GET | `/api/ai/quiz/history` | Get quiz history |

## Features

- Google Sign-In via Supabase Auth
- Chapter and topic CRUD with markdown editor
- Auto-save content
- Drag-and-drop topic reordering
- AI chat assistant with chapter context
- AI quiz generation and scoring
- Search across chapters
- Responsive design (mobile, tablet, desktop)
- Error boundaries and toast notifications
- Row Level Security at database level

## Project Structure

```
Galaxxy Study Hub/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuration
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routes/              # Flask Blueprints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth middleware
│   │   └── utils/
│   ├── requirements.txt
│   ├── run.py
│   ├── schema.sql
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Navbar, Modal, Skeleton, etc.
│   │   │   ├── chapter/         # MarkdownEditor
│   │   │   ├── quiz/            # Quiz component
│   │   │   └── ai/              # AIChat sidebar
│   │   ├── pages/               # LoginPage, HomePage, ChapterPage
│   │   ├── context/             # AuthContext
│   │   ├── services/            # API service layer
│   │   └── utils/               # Supabase client
│   ├── package.json
│   └── .env.example
└── README.md
```
