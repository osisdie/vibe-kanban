# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + serve frontend static files
FROM python:3.12-slim AS runtime
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# In production, env vars are injected by the platform (Railway/Docker Compose).
# .env.example is not copied — it is only a reference for local development.

ENV PYTHONUNBUFFERED=1
EXPOSE 8004

# Run from backend/ so relative DB path works
WORKDIR /app/backend
# Shell form so ${PORT:-8004} is expanded by sh
CMD python migrate.py && gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:${PORT:-8004} --access-logfile -
