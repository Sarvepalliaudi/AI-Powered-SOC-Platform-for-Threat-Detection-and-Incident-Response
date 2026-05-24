# AI-Powered SOC Platform — User Manual & Deployment Guide

**Project:** NA-042026 – Group A  
**Team:** Sarvepalli Audi Siva BhanuVardhan · Rishabh Sankhla · Kommi Moulika Naidu

---

## Table of Contents

1. [What is MongoDB and why we use it](#1-what-is-mongodb-and-why-we-use-it)
2. [Fixing MongoDB Atlas connection errors](#2-fixing-mongodb-atlas-connection-errors)
3. [Environment variables (all keys)](#3-environment-variables-all-keys)
4. [Local development setup](#4-local-development-setup)
5. [Using the platform (analyst guide)](#5-using-the-platform-analyst-guide)
6. [Hosting recommendations](#6-hosting-recommendations)
7. [Production deployment steps](#7-production-deployment-steps)
8. [Security checklist](#8-security-checklist)

---

## 1. What is MongoDB and why we use it

**MongoDB** is the cloud database that stores everything your SOC platform needs:

| Collection | Stores |
|------------|--------|
| **Users** | Analyst accounts, roles, passwords (hashed) |
| **Logs** | Parsed auth.log and Apache access.log entries |
| **Alerts** | Threat detections with severity & MITRE mapping |
| **Incidents** | Investigation notes, timeline, evidence |
| **Reports** | Generated PDF report metadata |

**Without MongoDB:** login fails, no data persists, dashboards stay empty.  
**With MongoDB Atlas:** data is stored in the cloud, accessible from anywhere, no local DB install needed.

Your connection string goes in **`backend/.env`** → `MONGODB_URI`

---

## 2. Fixing MongoDB Atlas connection errors

### Error: `getaddrinfo ENOTFOUND ac-8p0yxto-shard-00-01...`

This means your computer **cannot resolve the Atlas server hostname** (DNS/network issue).

**Fix checklist:**

1. **Correct URI format** — must include database name:
   ```
   mongodb+srv://USER:PASSWORD@cluster.mongodb.net/ai_soc_platform?retryWrites=true&w=majority
   ```
   ❌ Wrong: `...mongodb.net/?appName=ai-soc` (missing database name)  
   ✅ Right: `...mongodb.net/ai_soc_platform?retryWrites=true&w=majority`

2. **Atlas Network Access** — go to Atlas → Network Access → Add IP Address → `0.0.0.0/0` (allow all, for dev/demo)

3. **Atlas Database User** — Database Access → user must have read/write on the cluster

4. **Internet / VPN** — disable VPN, check Wi-Fi, try different network

5. **IPv4 fix** — already applied in `backend/src/config/db.js` (`family: 4`)

6. **Special characters in password** — URL-encode `@`, `#`, `%` etc. in the password portion of the URI

---

## 3. Environment variables (all keys)

### Backend — `backend/.env` (6 required keys)

| Key | Secret? | Example | Purpose |
|-----|---------|---------|---------|
| `PORT` | No | `5000` | API server port |
| `MONGODB_URI` | **YES** | `mongodb+srv://...` | Atlas database connection |
| `JWT_SECRET` | **YES** | Long random string | Signs login tokens |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiry |
| `NODE_ENV` | No | `development` / `production` | Environment mode |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS + WebSocket origin |

### Frontend — `frontend/.env` (2 optional keys)

| Key | When needed | Example |
|-----|-------------|---------|
| `VITE_API_URL` | Production only | `https://your-api.onrender.com/api` |
| `VITE_SOCKET_URL` | Production only | `https://your-api.onrender.com` |

> **Never commit `.env` files.** They are protected by `.gitignore`.

---

## 4. Local development setup

```powershell
# 1. Install dependencies
cd "d:\ai soc"
npm run install:all

# 2. Configure backend/.env (MongoDB Atlas URI + JWT_SECRET)

# 3. Start backend
cd backend
npm run dev
# Expect: "MongoDB Connected" + "SOC Platform API running on port 5000"

# 4. Seed demo data (first time only)
npm run seed

# 5. Start frontend (new terminal)
cd frontend
npm run dev
```

**Login:** `bhanu@soc.local` / `soc123`

---

## 5. Using the platform (analyst guide)

| Page | What to do |
|------|------------|
| **Dashboard** | Monitor live stats, charts, AI threat score, top attackers |
| **Log Analysis** | Upload `auth.log` or `access.log` → auto threat detection |
| **Alerts** | Review detections, update status, view MITRE ATT&CK mapping |
| **Incidents** | Create cases, add timeline, comments, containment actions |
| **Reports** | Generate & download PDF threat/log/incident reports |
| **User Manual** | In-app guide (sidebar → User Manual) |
| **Settings** | Toggle dark/light theme, view account info |
| **Team / About** | Team profiles with LinkedIn links |

**Dark/Light mode:** Click sun/moon icon in header. Preference saves automatically.

---

## 6. Hosting recommendations

| Component | Best platform | Why |
|-----------|---------------|-----|
| **Database** | **MongoDB Atlas** (free tier) | Already configured, managed, reliable |
| **Backend API** | **Render** or **Railway** | Easy Node.js deploy, free tier |
| **Frontend** | **Vercel** or **Netlify** | Free, fast CDN, auto HTTPS |
| **All-in-one** | **Render** (2 services) | Backend + static frontend in one place |

### Recommended stack for internship demo

```
MongoDB Atlas  →  Database (already set up)
Render         →  Backend (Node.js Web Service)
Vercel         →  Frontend (React static site)
```

**Cost:** Free tier on all three for demo/portfolio use.

---

## 7. Production deployment steps

### Step A — MongoDB Atlas (done)
- Cluster running, user created, IP whitelisted
- Copy connection string to production env vars

### Step B — Deploy Backend on Render

1. Push code to GitHub (ensure `.env` is NOT in repo)
2. [render.com](https://render.com) → New **Web Service**
3. Connect repo → Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:

```
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/ai_soc_platform?retryWrites=true&w=majority
JWT_SECRET=your_production_secret_min_32_chars
JWT_EXPIRES_IN=24h
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

7. Deploy → note URL: `https://your-api.onrender.com`

### Step C — Deploy Frontend on Vercel

1. [vercel.com](https://vercel.com) → New Project → import repo
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables:

```
VITE_API_URL=https://your-api.onrender.com/api
VITE_SOCKET_URL=https://your-api.onrender.com
```

6. Deploy → note URL: `https://your-app.vercel.app`

### Step D — Finalize

1. Update Render `FRONTEND_URL` to your Vercel URL
2. Run seed on production: Render Shell → `npm run seed`
3. Test login and log upload

---

## 8. Security checklist

- [ ] Rotate MongoDB password if ever exposed
- [ ] Use strong `JWT_SECRET` (32+ random characters)
- [ ] Never commit `backend/.env` to Git
- [ ] Restrict Atlas IP access in production (not `0.0.0.0/0`)
- [ ] Use HTTPS in production (Render/Vercel provide this automatically)
- [ ] Change demo passwords before public deployment

---

## Team LinkedIn Profiles

- [Sarvepalli Audi Siva BhanuVardhan](https://www.linkedin.com/in/audi-siva-bhanuvardhan-sarvepalli-4598a8289/)
- [Rishabh Sankhla](https://www.linkedin.com/in/rishabhsankhla771401/)
- [Kommi Moulika Naidu](https://www.linkedin.com/in/moulika-naidu-8b395a311/)

---

*AI-Powered SOC Platform · Cybersecurity Internship Major Project · 2026*
