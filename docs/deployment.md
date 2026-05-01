# Deployment Guide

This project is designed to run on the current VPS with managed external
services for database, authentication, and file storage.

## 1. Server Requirements

Minimum MVP runtime:

- Node.js 20+
- npm 10+
- Git
- Reverse proxy such as Caddy or Nginx

Recommended production runtime:

- Docker
- Docker Compose
- Cloudflare DNS/CDN in front of the domain
- Supabase project for Auth, Postgres, and Storage

The current server can run the MVP directly with Node.js. Docker can be
installed later for more repeatable deployments.

## 2. Environment Files

Copy the example production file:

```bash
cp .env.production.example .env.production
```

Set:

```text
APP_PORT=3000
NEXT_PUBLIC_SITE_URL=https://your-test-domain.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Do not commit `.env.production`.

## 3. Run Without Docker

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

The build script also copies `public` and `.next/static` into the standalone
output so PM2 can serve images and static assets correctly.

Start:

```bash
npm run start
```

The app uses Next.js standalone output and listens on port `3000` by default.
Run `npm run build` before `npm run start`.

Health check:

```bash
curl http://127.0.0.1:3000/api/health
```

## 4. Run With PM2

PM2 is the recommended runtime for this VPS before Docker is installed. It keeps
the Next.js standalone server running, restarts it after crashes, and can restore
the process after a reboot.

Install PM2:

```bash
npm install -g pm2
```

Build the app:

```bash
npm install
npm run build
```

Start or reload the app:

```bash
pm2 startOrReload ecosystem.config.cjs --env production
```

Check status and logs:

```bash
pm2 status
pm2 logs aarhus-3d-print
```

Persist the process list:

```bash
pm2 save
```

Enable startup after reboot:

```bash
pm2 startup
```

PM2 will print a system-specific command. Run that command once with sudo.

## 5. Run With Docker

Install Docker and Docker Compose on the server, then:

```bash
cp .env.production.example .env.production
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f web
```

## 6. Reverse Proxy

Use Cloudflare for DNS and point the test domain to this server.

Example Caddyfile:

```text
your-test-domain.example {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Example Nginx server block:

```nginx
server {
  listen 80;
  server_name your-test-domain.example;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

For production, enable HTTPS through Caddy automatic TLS, Nginx with Certbot, or
Cloudflare Origin Certificates.

## 7. DNS Checklist

In Cloudflare:

- Add an `A` record pointing the test domain to the server IP
- Enable proxy if Cloudflare should serve CDN/WAF
- Set SSL/TLS mode to `Full` or `Full (strict)` after HTTPS is configured
- Keep `NEXT_PUBLIC_SITE_URL` aligned with the test domain

## 8. Deployment Workflow

Recommended manual workflow:

```bash
git pull origin main
npm install
npm run build
npm run start
```

Recommended PM2 workflow:

```bash
git pull origin main
npm install
npm run build
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
```

Docker-based workflow:

```bash
git pull origin main
docker compose up -d --build
```

## 9. Current Health Endpoint

The MVP exposes:

```text
GET /api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "aarhus-3d-print",
  "timestamp": "..."
}
```
