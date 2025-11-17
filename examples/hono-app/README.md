# Loompi Example: Hono + Drizzle

Example application using loompi with Hono framework and Drizzle ORM.

## Setup

```bash
bun install
bun run dev
```

## Project Structure

```
src/
├── api/
│   └── users/
│       ├── controllers/
│       │   └── user.ts
│       ├── routes/
│       │   └── user.ts
│       └── index.ts
├── db/
├── lib/
│   └── factories.ts
└── index.ts
```