# 🌱 loompi

A framework-agnostic Strapi-style API factory.
Generate fully typed CRUD APIs (controllers + routes + validation + filtering) using your own framework and ORM.

<p align="left"> <img src="https://img.shields.io/badge/status-alpha-blue" /> <img src="https://img.shields.io/badge/runtime-node%20%7C%20bun-green" /> <img src="https://img.shields.io/badge/framework-hono%20%7C%20express%20%7C%20fastify-yellow" /> <img src="https://img.shields.io/badge/orm-drizzle%20%7C%20prisma%20%7C%20kysely-purple" /> </p>

Loompi is a lightweight experiment I built for fun.
It’s not a framework or a full solution.

Just a collection of helpers that make it easier to set up basic typed CRUD endpoints using your own stack (Hono, Express, Drizzle, etc.).

If you like Strapi’s schema → controller → routes idea but want something simple and code-based, this might be useful.

## ✨ Features

- 🚀 Framework Agnostic – Hono, Express, Fastify, or anything else
- 🗄️ ORM Agnostic – Drizzle, Prisma, Kysely, etc.
- 🧩 Auto-generated CRUD – find, findOne, create, update, delete
- 🔒 Type-safe – first-class TypeScript everywhere
- 🎨 Strapi-inspired DX – schemas & resource conventions
- 🔌 Extendable – override controllers or add custom routes
- 🛡️ Policies & Middlewares – simple authorization hooks
- 🔍 Advanced Filtering – $eq, $gt, $in, $contains, etc.
- 📦 Modular – you pick the framework & ORM

## 🚀 Quick Start

Install Loompi + your adapters:
```ts
bun add loompi @loompi/hono @loompi/drizzle
```
## 📁 Project Structure Example

A typical user resource using Hono + Drizzle + BetterAuth:
```
src/
 ├─ api/
 │   └─ users/
 │       ├─ controllers/user.ts     # Core + custom controller
 │       └─ routes/user.ts          # Core routes
 ├─ schemas/
 │   ├─ index.ts                    # Schema registry
 │   └─ user.ts                     # Resource schema
 ├─ lib/
 │   ├─ auth.ts                     # Your auth logic
 │   ├─ database.ts                 # Drizzle setup
 │   └─ factories.ts                # Loompi factories
 └─ middlewares/
     └─ token-guard.ts              # (optional) BetterAuth middleware
```

## 🧱 Defining a Schema
```ts
src/schemas/user.ts

import { user } from "@/db/user-schema";
import { defineSchema } from "loompi";
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod';

export default defineSchema({
  kind: 'collectionType',
  collectionName: 'user',
  tableName: user,

  info: {
    singularName: 'user',
    pluralName: 'users',
    displayName: 'Users',
  },

  hooks: {
    repository: {
      beforeCreate: (data) => {
        if (!data.id) data.id = crypto.randomUUID();
        return data;
      }
    }
  },

  validation: {
    insert: createInsertSchema(user, {
      name: z.string(),
      email: z.string().email(),
    }).omit({ id: true, createdAt: true }),

    update: createInsertSchema(user, {
      name: z.string(),
      email: z.string().email(),
      image: z.string().url(),
    }).omit({ id: true, createdAt: true }).partial(),
  },
})
```
## 📚 Registering Schemas
```ts
src/schemas/index.ts

import { SchemaRegistry } from "loompi";
import userSchema from "./user";

export const schemas: SchemaRegistry = {
  "api::user.user": userSchema,
} as const;
```
## 🧩 Creating a Controller
```ts
src/api/users/controllers/user.ts

import { factories } from "@/lib/factories";

export default factories.createCoreController("api::user.user", () => ({
  async me(ctx) {
    return ctx.res.json({ user: 'example-user' }, 418);
  }
}));
```

This gives you controllers handler for all the standard CRUD operations, plus a custom `me` method.

## 🛣️ Generating Routes
```ts
src/api/users/routes/user.ts

import { factories } from "@/lib/factories";

export default factories.createCoreRoutes("api::user.user");
```

This gives you routes for all the standard CRUD operations:
```
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
```


## 🧪 Adding Custom Routes
```ts
import { createCustomRoutes } from "loompi";

export default createCustomRoutes([
  {
    method: "GET",
    path: "/users/me",
    handler: "api::user.user.me",
    config: { middlewares: [], policies: [] }
  }
]);
```
here we define a custom route that maps to the `me` controller method we defined earlier.

noticed that we give `"api::user.user.me"` as the handler string, which follows the pattern of "resource.controller.method".

## 🔗 Stitching Everything Together
```ts
src/api/users/index.ts

import { createRouter } from "@loompi/hono";
import { Hono } from "hono";

import userRoutes from "./routes/user";
import customUserRoutes from "./routes/custom-user";
import userController from "./controllers/user";

import { ControllerRegistry, CoreController } from "loompi";

const controllers: ControllerRegistry = {
  "api::user.user": userController as CoreController,
};

const app = new Hono();

const router = createRouter(app, [customUserRoutes, userRoutes], controllers);

export default router;
```

## 🧠 Philosophy

- Bring your own stack – framework, ORM, router, auth
- Strapi-like DX – without the monolith
- Convention over configuration – define a schema, get CRUD
- Full override control – controllers and routes are extendable
- Clean folder structure – each resource stands on its own

## 🧩 Adapter Overview
| Package           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `loompi`          | Core schema, controller, filtering logic   |
| `@loompi/hono`    | Router factory for Hono                    |
| `@loompi/drizzle` | Repository + query adapter for Drizzle ORM |


More adapters planned. (express, fastify, prisma, kysely, etc.)


## 🗺️ Roadmap

- 🔜 Prisma adapter
- 🔜 Kysely adapter
- 🔜 Express / Fastify routers adapter
- 🔜 Relations (populate / expand)
- 🔜 Admin UI generator (experimental)

## 💬 Questions / Feedback

Feel free to open a GitHub issue or start a discussion — feedback is extremely welcome during the early alpha phase.