# AI-Powered SOC Platform

**NA-042026 – Group A** | Threat Detection & Incident Response

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Docker)

### Install

```powershell
npm run install:all
```

### Run

```powershell
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Seed demo data (first time)
npm run seed

# Terminal 3 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Demo Login
| Email | Password | Role |
|-------|----------|------|
| bhanu@soc.local | soc123 | Lead Analyst |
| admin@soc.local | admin123 | Admin |

## Project Structure

```
backend/     Express API, MongoDB, threat detection engine
frontend/    React + Tailwind + Recharts dashboard
sample-logs/ Sample auth.log and access.log files
```

## Environment

**Never commit `backend/.env`** — it is listed in `.gitignore`.

| File | Keys | Purpose |
|------|------|---------|
| `backend/.env` | **6 keys** | Database, JWT, ports, CORS |
| `frontend/.env` | **2 optional** | Only if API is not on localhost:5000 |

Copy `backend/.env.example` → `backend/.env` and edit. See **`ENV_SETUP.md`** for full key reference.

