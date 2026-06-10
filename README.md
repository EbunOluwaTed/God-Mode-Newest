# GodMode Dashboard

> ⚡ Your personal command center. Thoughts become tasks. Tasks become execution.

---

## Stack
- **React** (Create React App) — Frontend
- **Supabase** — Database
- **Gemini 1.5 Flash** — AI task extraction
- **Vercel** — Hosting + serverless API

---

## 🚀 Full Deployment Guide

### Step 1 — Push to GitHub

```bash
# In your terminal, inside this folder:
git init
git add .
git commit -m "GodMode v2 — full rebuild"
git remote add origin https://github.com/EbunOluwaTed/God-Mode-Newest.git
git push -u origin main --force
```

> If you get a "refusing to merge unrelated histories" error, use:
> `git push origin main --force`

---

### Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → your project
2. Click **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase_schema.sql`
4. Click **Run**

You'll see two tables created: `users` and `tasks`.

5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon/public key** (long JWT string)

---

### Step 3 — Get your Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → **Create API key**
3. Copy the key (starts with `AIza...`)
4. Make sure billing/quota is enabled on your Google Cloud project

---

### Step 4 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `EbunOluwaTed/God-Mode-Newest` from GitHub
3. Framework: **Create React App** (auto-detected)
4. Click **Environment Variables** and add these 3:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `GEMINI_API_KEY` | Your Gemini API key |

5. Click **Deploy**
6. Once deployed, go to **Settings → Domains** and add: `godmode.vercel.app`

---

### Step 5 — Custom domain (optional)

In Vercel → Domains, add `godmode.vercel.app` as alias, or purchase a custom domain.

---

## 🧪 Testing locally

```bash
npm install

# Create a .env file:
cp .env.example .env
# Fill in your keys in .env

npm start
```

The app runs on `http://localhost:3000`.  
The API route (`/api/extract-tasks`) needs Vercel CLI to run locally:

```bash
npm install -g vercel
vercel dev
```

---

## 🐛 Troubleshooting

### AI Dump not working
The modal now shows the **exact error** from Gemini. Common issues:
- `403` → API key invalid or not enabled
- `429` → Quota exceeded → check aistudio.google.com
- `404` → Wrong model name (already fixed in this build)
- `GEMINI_API_KEY not set` → Add it in Vercel Environment Variables

### Tasks not showing
All pending tasks show by default. If the dashboard is empty, check:
- Supabase schema was run correctly
- `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set in Vercel

### Build fails
Run `npm install` locally and fix any errors before pushing.

---

## Features

- ✅ Username + PIN login (no email needed)
- ✅ Per-user data in Supabase
- ✅ Dark / Light mode toggle
- ✅ Big, bold dashboard with date navigation (← → today 📅)
- ✅ Day name highlighted in accent color
- ✅ All pending tasks visible by default
- ✅ Sort by urgency / date / category / recently added
- ✅ Customisable task categories
- ✅ AI Dump with clear error messages
- ✅ Add task button next to category tabs
- ✅ View all tasks panel
- ✅ Space Grotesk + Playfair Display typography
