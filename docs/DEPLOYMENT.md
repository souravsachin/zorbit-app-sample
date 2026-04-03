# Deployment Guide

## Prerequisites

- Node.js 20+ on the server
- MongoDB accessible from the server
- PM2 installed globally (`npm install -g pm2`)
- Access to the Zorbit platform services (identity, PII vault)

## Step 1: Build Locally

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

## Step 2: Transfer to Server

```bash
rsync -avz --delete \
  dist/ package.json package-lock.json ecosystem.config.js .env \
  user@server:/home/user/apps/zorbit-platform/zorbit-app-sample/
```

## Step 3: Install Dependencies on Server

```bash
ssh user@server
cd /home/user/apps/zorbit-platform/zorbit-app-sample/
npm ci --omit=dev
```

## Step 4: Configure Environment

Edit `.env` on the server:

```bash
PORT=3140
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27018/zorbit_sample_tasks?directConnection=true
JWT_SECRET=<same_as_identity_service>
IDENTITY_SERVICE_URL=http://localhost:3099
PII_VAULT_SERVICE_URL=http://localhost:3105
KAFKA_ENABLED=true
KAFKA_BROKER=localhost:9092
```

## Step 5: Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Step 6: Configure Nginx

Add to your nginx server block:

```nginx
location /api/sample/ {
    proxy_pass http://127.0.0.1:3140/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Step 7: Register Module

```bash
export JWT_TOKEN="<your_token>"

# Register menu items
export NAV_URL="http://localhost:3103"
bash scripts/register-menu.sh

# Register DataTable page definition
export DATATABLE_URL="http://localhost:3113"
bash scripts/register-datatable.sh

# Seed demo data
export SAMPLE_URL="http://localhost:3140"
bash scripts/seed-demo.sh
```

## Step 8: Verify

```bash
# Health check
curl http://localhost:3140/api/v1/G/sample/health

# List tasks (requires JWT)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3140/api/v1/O/O-XXXX/tasks
```

## Port Convention

| Environment | Port |
|-------------|------|
| Development | 3040 |
| Server      | 3140 |

The +100 offset is the Zorbit convention for all services (3001->3099, 3002->3102, etc.).
