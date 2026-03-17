# Railway CLI Reference

Commands used in this project for deployment and management.

## Setup

```bash
# Install
npm install -g @railway/cli

# Login (opens browser)
railway login

# Or login with token (CI/scripts)
RAILWAY_TOKEN=xxx railway whoami

# Link local project to Railway service
railway link
```

## Deploy

```bash
# Deploy current directory (blocking — waits for build to finish)
railway up

# Deploy in background (returns immediately with build URL)
railway up --detach

# Build logs URL is printed, e.g.:
#   Build Logs: https://railway.com/project/xxx/service/yyy?id=zzz
```

## Environment Variables

```bash
# List all variables
railway variables

# Set one or more variables
railway variables set KEY=value
railway variables set EMAIL_PROVIDER=resend RESEND_API_KEY=re_xxx

# Delete a variable
railway variables delete KEY
```

## Logs

```bash
# Application logs (runtime)
railway logs

# Build logs (Docker build output)
railway logs --build

# Filter with grep
railway logs 2>&1 | grep -E "ERROR|migration|email"
railway logs 2>&1 | tail -30
```

## Status & Info

```bash
# Current project/service info
railway status

# Check who you're logged in as
railway whoami
```

## Run Commands in Railway Context

```bash
# Run a command with Railway env vars injected
# NOTE: Cannot connect to Railway's internal PostgreSQL from local machine
#       (e.g. postgres.railway.internal is only reachable inside Railway network)
railway run -- python -c "import os; print(os.environ['DATABASE_URL'])"
```

## Common Workflows

### First-time deploy

```bash
railway login
railway link                    # Select project and service
railway variables set \
  JWT_SECRET_KEY=$(openssl rand -hex 32) \
  FRONTEND_URL=https://your-app.up.railway.app \
  EMAIL_PROVIDER=resend \
  RESEND_API_KEY=re_xxx
railway up --detach
```

### Update env vars and redeploy

```bash
railway variables set NEW_VAR=value
railway up --detach
```

### Check deploy health after release

```bash
# Wait for build
railway logs --build 2>&1 | tail -10

# Check runtime startup
railway logs 2>&1 | grep -E "Starting|migration|gunicorn|ERROR" | tail -15
```

### Debug a failing deploy

```bash
# 1. Check build logs for compilation errors
railway logs --build 2>&1 | tail -30

# 2. Check runtime logs for startup crashes
railway logs 2>&1 | tail -30

# 3. Check env vars are set correctly
railway variables 2>&1 | grep -E "DATABASE_URL|SMTP|RESEND"
```

## Project Config

See `railway.toml` in project root:

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

## Notes

- Railway's internal services (e.g. `postgres.railway.internal`) are only reachable from within the Railway network, not from local machines.
- Railway blocks outbound SMTP ports (25/587/465) — use HTTP-based email providers like Resend instead.
- `railway up` uploads local files (respects `.gitignore`). It does NOT push from git — it uploads your working directory.
- Environment variable changes take effect on next deploy. Setting a variable alone does not trigger a redeploy.
