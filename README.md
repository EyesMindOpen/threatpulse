<div align="center">

# 🛡️ ThreatPulse Intel

**Open-source threat intelligence platform for healthcare cybersecurity teams**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)

</div>

---

ThreatPulse Intel aggregates, normalizes, and triages threat intelligence from **18 sources** into a single dashboard. Built for healthcare security operations teams who need CVE tracking, IOC management, TTP mapping, and integration with existing tooling (Jira, Cybellum SBOM, H-ISAC, Brevo).

## ✨ Features

| Feature | Description |
|---------|-------------|
| **18 Intelligence Sources** | CISA KEV, NVD, H-ISAC, Hacker News, Bleeping Computer, Dark Reading, Krebs, SecurityWeek, SANS ISC, Rapid7, MSRC, US-CERT, UK NCSC, Exploit-DB, Packet Storm, CrowdStrike, Mandiant, Infosecurity Magazine |
| **Dashboard** | Severity distribution, source breakdown, 14-day trend lines, real-time metrics |
| **CVE Database** | Searchable CVE table with severity filtering and CVSS scores |
| **Threat Feed** | Unified feed from all sources with type/severity/source filters |
| **RBAC** | SUPERADMIN → ADMIN → ANALYST role hierarchy |
| **Integrations** | Jira (ticketing), Cybellum (SBOM), H-ISAC (healthcare IOCs), Brevo (email alerts) |
| **Feed Management** | Enable/disable individual sources, customize collection frequency, test endpoints |
| **Advisory Export** | Export threat advisories via Email, Teams, or clipboard |
| **Executive Brief** | KPI cards and severity/status breakdowns for leadership |
| **Policy Engine** | SLA definitions, triage workflow, escalation procedures |
| **Product Portfolio** | Cybellum-integrated product risk tracking |
| **CSV/JSON Upload** | Bulk import threats from files |
| **Multi-tenant** | Organization-scoped data isolation |
| **Dark Mode** | Cybersecurity-themed dark UI (default) with light mode option |

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) v2+
- That's it. No Node.js, no PostgreSQL, no other dependencies.

### Deploy

```bash
git clone https://github.com/YOUR_USERNAME/threatpulse-intel.git
cd threatpulse-intel

# Configure
cp .env.docker .env
nano .env                    # Set NEXTAUTH_SECRET and NEXTAUTH_URL

# Launch
docker compose up -d --build

# Watch startup
docker compose logs -f app
```

First boot automatically creates tables, seeds demo data, and starts the app.

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@threatpulse.com` | `admin123!` |
| **Analyst** | `analyst@threatpulse.com` | `analyst123!` |

> ⚠️ **Change these immediately** after your first login.

## 🖥️ Architecture

```
┌────────────────────────────────────────────────┐
│              Docker Compose Stack               │
│                                                │
│  ┌───────────────┐    ┌────────────────────┐   │
│  │  PostgreSQL   │    │  ThreatPulse Intel  │   │
│  │  15-alpine    │◄───│  Next.js 14        │   │
│  │  :5432        │    │  Prisma ORM        │   │
│  │  pgdata vol   │    │  NextAuth.js       │   │
│  └───────────────┘    │  :3000             │   │
│                       └────────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

| Component | Technology | Purpose |
|-----------|------------|--------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Recharts | Dashboard, pages, charts |
| Backend | Next.js API Routes, Prisma ORM | REST API, data layer |
| Auth | NextAuth.js v4 (credentials + JWT) | Session management, RBAC |
| Database | PostgreSQL 15 | Threat storage, user management |
| Container | Docker, multi-stage Alpine builds | Deployment |

## 📁 Project Structure

```
threatpulse-intel/
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # Full stack definition
├── docker/
│   └── docker-entrypoint.sh      # Auto-migrate, seed, start
├── .env.docker                   # Environment template
└── nextjs_space/                 # Application source
    ├── app/
    │   ├── (app)/                # Authenticated pages
    │   │   ├── dashboard/        # Main dashboard + charts
    │   │   ├── cve-database/     # CVE search & filter
    │   │   ├── threat-feed/      # Unified threat feed
    │   │   ├── threats/          # Threat detail + CRUD
    │   │   ├── integrations/     # Feed + service config
    │   │   ├── admin/            # Org + user management
    │   │   ├── executive-brief/  # Leadership KPIs
    │   │   ├── how-it-works/     # Platform documentation
    │   │   ├── policy/           # SLA & governance
    │   │   ├── product-portfolio/# Cybellum integration
    │   │   └── upload/           # CSV/JSON import
    │   └── api/                  # REST API routes
    ├── components/               # Reusable UI (shadcn/ui)
    ├── lib/                      # Auth, DB, types, utils
    ├── prisma/                   # Database schema
    └── scripts/                  # Seed data
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `threatpulse` | Database username |
| `POSTGRES_PASSWORD` | `threatpulse_secret` | Database password |
| `POSTGRES_DB` | `threatpulse_db` | Database name |
| `DB_PORT` | `5432` | Exposed PostgreSQL port |
| `APP_PORT` | `3000` | Exposed app port |
| `NEXTAUTH_URL` | `http://localhost:3000` | Public URL of the app |
| `NEXTAUTH_SECRET` | *(generate!)* | `openssl rand -base64 32` |

## 🔒 RBAC Roles

| Role | Capabilities |
|------|--------------|
| **SUPERADMIN** | Full platform control, cross-org access, user/integration management |
| **ADMIN** | Organization admin, manage users, configure integrations, SLA settings |
| **ANALYST** | View dashboard, triage threats, export advisories, search/filter |

## 🔌 Intelligence Sources

### Public APIs
- **CISA KEV** — Known Exploited Vulnerabilities catalog
- **NVD (NIST)** — National Vulnerability Database (CVSS scores)

### RSS Feeds (16 sources)
The Hacker News, Bleeping Computer, Dark Reading, Krebs on Security, SecurityWeek, SANS ISC, Rapid7, Microsoft MSRC, US-CERT/CISA, UK NCSC, Exploit-DB, Packet Storm, CrowdStrike, Mandiant, Infosecurity Magazine

### Authenticated
- **H-ISAC** — Healthcare sector bulletins (HMAC-SHA1 auth)

## 🛠️ Operations

```bash
# Start / Stop
docker compose up -d
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View logs
docker compose logs -f app
docker compose logs -f db

# Database shell
docker compose exec db psql -U threatpulse -d threatpulse_db

# App container shell
docker compose exec app sh

# Full reset (destroys all data!)
docker compose down -v
docker compose up -d --build
```

## 🌐 Reverse Proxy

For production deployments behind Nginx:

```nginx
server {
    listen 443 ssl;
    server_name threatpulse.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `NEXTAUTH_URL=https://threatpulse.yourdomain.com` in your `.env`.

## 📄 License

[Apache License 2.0](LICENSE) — Copyright 2024 Curtis Haugen

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🛡️ Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and deployment best practices.
