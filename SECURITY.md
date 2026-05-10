# Security Policy

## Supported Versions

| Version | Supported          |
|---------| ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ThreatPulse Intel, **please do not open a public issue.**

Instead, please report it responsibly:

1. **Email**: Send details to the repository owner via the contact information in their GitHub profile.
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to acknowledge reports within **48 hours** and provide a fix or mitigation within **7 days** for critical issues.

## Security Best Practices for Deployment

### Secrets Management
- **Never** commit `.env` files with real credentials
- Generate a strong `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Use unique, strong passwords for PostgreSQL
- Rotate API keys (Jira, Cybellum, H-ISAC, Brevo) regularly

### Network
- Run behind a reverse proxy (Nginx/Traefik) with TLS
- Do **not** expose PostgreSQL port (`5432`) to the internet
- Use Docker network isolation (the default compose config does this)

### Authentication
- Change the default demo passwords immediately after deployment
- Enforce strong passwords for all user accounts
- Review user roles regularly (SUPERADMIN/ADMIN/ANALYST)

### Container Security
- Keep the base images updated (`node:18-alpine`, `postgres:15-alpine`)
- Run the app as a non-root user (the Dockerfile already does this)
- Scan images with `docker scout` or `trivy` before production use

### Data
- Back up the `pgdata` Docker volume regularly
- Integration credentials (Jira tokens, API keys) are stored encrypted in the database
- All feed endpoints are fetched server-side — no credentials are exposed to the browser
