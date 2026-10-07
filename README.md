# Grow in Jesus Choir — Financial Monitoring & Records Management Platform

> **"Futuristic technology underneath. Simple human experience on top."**

A modern, secure, accessible web platform built specifically for **Grow in Jesus Choir** to manage, organize, monitor, and understand its financial records with human simplicity and transparent accountability.

---

## Architecture Overview

The codebase is organized into three primary roots:

```text
/
├── public/          # Publicly accessible static assets, icons, brand assets
├── src/             # Application source code (App Router, components, features, services, lib)
└── database/        # Database migrations, seeds, views, and documentation
```

### Key Technologies
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4, tw-animate-css, custom light-mode design tokens
- **Database**: Relational SQLite storage with sequential SQL migrations and strict integer financial units
- **Authentication & RBAC**: Session-based authentication with `MEMBER` and `LEADER` role guards (extensible to `ADMIN`, `AUDITOR`)
- **Typography & Icons**: Lucide icons, readable humanist typography, high-contrast light mode

---

## Getting Started

### Prerequisites
- Node.js >= 20.x / 22.x
- pnpm >= 10.x / 12.x

### Installation
```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run database migrations and seed data
pnpm db:migrate

# Start the development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## User Roles & Capabilities

- **Member**: Simplified personal dashboard, contribution records, submit contributions, view receipt confirmations.
- **Leader**: Comprehensive financial command center, income/expense management, member progress tracking (e.g., 42/50 contributed), approval workflow, reports, audit logs.

---

## Security & Financial Principles

1. **Exact Currency Representation**: No floating-point math for money. Stored as integer units in Rwandan Francs (`RWF`).
2. **Server-Enforced Authorization**: Role checks execute strictly server-side.
3. **Auditability**: Destructive or critical financial state changes generate audit log records.
4. **Document Privacy**: Uploaded receipts are stored securely outside the public web root.

