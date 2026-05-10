# Contributing to ThreatPulse Intel

Thank you for your interest in contributing to ThreatPulse Intel!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/threatpulse-intel.git
   cd threatpulse-intel
   ```
3. Start the development stack:
   ```bash
   cp .env.docker .env
   docker compose up -d --build
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Project Structure
```
threatpulse-intel/
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Full stack (app + PostgreSQL)
├── docker/
│   └── docker-entrypoint.sh  # Auto-migrate + seed + start
├── nextjs_space/           # Application source
│   ├── app/                # Next.js App Router pages + API
│   ├── components/         # Reusable UI components
│   ├── lib/                # Auth, DB, types, utilities
│   ├── prisma/             # Database schema
│   └── scripts/            # Seed data
└── .env.docker             # Environment template
```

### Key Technologies
- **Next.js 14** (App Router)
- **PostgreSQL 15** + Prisma ORM
- **NextAuth.js** (credentials provider, JWT sessions)
- **Recharts** for data visualization
- **Tailwind CSS** + shadcn/ui components

## Pull Request Process

1. Ensure your code builds: `docker compose up -d --build`
2. Test the application manually (login, dashboard, all pages)
3. Update documentation if you've changed configuration or added features
4. Write clear commit messages
5. Open a PR against `main` with a description of your changes

## Code Style

- TypeScript strict mode
- Tailwind CSS for all styling
- Server-side data fetching where possible
- API routes must check authentication and RBAC
- All database queries must filter by `organizationId` (multi-tenancy)

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Docker version, browser)
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
