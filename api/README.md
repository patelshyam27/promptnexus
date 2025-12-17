# PromptNexus API (dev)

This is a minimal Express + Prisma (SQLite) API for local development.

Quick start:

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API base: `http://localhost:4000/api`

Endpoints implemented: `/register`, `/login`, `/prompts`, `/feedback`.
