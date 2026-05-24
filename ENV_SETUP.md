# ============================================
# SOC Platform - Environment Variables Guide
# ============================================
# TOTAL: 6 required keys (backend) + 2 optional (frontend)
# SECRET keys to protect: JWT_SECRET, MONGODB_URI (if has password)

# --------------------------------------------
# FILE 1: backend/.env  (MAIN - edit this)
# --------------------------------------------
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_soc_platform
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# --------------------------------------------
# FILE 2: frontend/.env  (OPTIONAL - only if needed)
# --------------------------------------------
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# --------------------------------------------
# WHERE EACH KEY IS USED IN CODE
# --------------------------------------------
# PORT          -> backend/src/index.js
# MONGODB_URI   -> backend/src/config/db.js
# JWT_SECRET    -> backend/src/routes/auth.js, middleware/auth.js
# JWT_EXPIRES_IN-> backend/src/routes/auth.js
# FRONTEND_URL  -> backend/src/index.js (CORS + Socket.io)
# NODE_ENV      -> general Node environment
# VITE_API_URL  -> frontend/src/services/api.js
# VITE_SOCKET_URL -> frontend/src/services/socket.js

# --------------------------------------------
# HARDCODED (change only if ports differ)
# --------------------------------------------
# frontend/vite.config.js line 10 -> proxy target port 5000

# --------------------------------------------
# DEMO LOGIN (from seed, not .env)
# --------------------------------------------
# bhanu@soc.local / soc123
# admin@soc.local / admin123
