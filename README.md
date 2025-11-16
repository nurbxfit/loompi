# Unstrap

> Framework-agnostic API factory inspired by Strapi - build type-safe CRUD APIs with any framework and ORM

## 🎯 Features

- 🚀 **Framework Agnostic** - Works with Hono, Express, Fastify, and more
- 🗄️ **ORM Agnostic** - Supports Drizzle, Prisma, Kysely, and more
- 🔒 **Type-Safe** -  TypeScript support.
- 🎨 **Strapi-like DX** - Familiar API inspired by Strapi v5
- 🔌 **Extensible** - Easy to override controllers and add custom routes
- 🛡️ **Built-in Auth** - Policy and middleware system included
- 🔍 **Advanced Filtering** - Complex query filters with operators ($eq, $gt, $contains, etc.)
- 📦 **Modular** - Use only what you need



## 🚀 Quick Start

```bash
# Install core + adapters
bun add unstrap @unstrap/hono @unstrap/drizzle
```

# Basic Usage

## Folder Structure
Example here is a folder structure of a simple hono + drizzle + BetterAuth setup with a `user` resource.

```
src/
 ├─ api/
 │   └─ users/
 │       ├─ controllers/user.ts # where we call factory.createCoreController
 │       └─ routes/user.ts # where we call factory.createCoreRoutes
 ├─ schemas/
 │   ├─ index.ts       # aggregate all resource schemas into a single registry
 │   └─ user.ts        # where we define unstrap schema for user resource (strapi like schema)
 ├─ lib/
 │   ├─ auth.ts        # Your own rizzle + BetterAuth setup
 │   ├─ database.ts    # Your own Drizzle + SQLite setup
 │   └─ factory.ts     # where we instantiate Unstrap factory
 └─ middlewares/
     └─ token-guard.ts  # (optional) BetterAuth middleware

```

### Example: src/schemas/user.ts
```ts
import { user } from "@/db/user-schema";
import { defineSchema } from "unstrap";
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod';

export default defineSchema({
    kind: 'collectionType',
    collectionName: 'user',
    tableName: user,
    info: {
        singularName: 'user',
        pluralName: 'users',
        displayName: 'users',
    },
    hooks: { // we define a hook to auto-generate UUID for new users
        repository: {
            beforeCreate: (data) => {
                if (!data.id) {
                    data.id = crypto.randomUUID();
                }
                return data;
            }
        }
    },
    validation: { // we define validation schemas for create and update operations
        insert: createInsertSchema(user, {
            name: z.string(),
            email: z.email(),
        }).omit({ id: true, createdAt: true }),
        update: createInsertSchema(user, {
            name: z.string(),
            email: z.email(),
            image: z.url(),
        }).omit({ id: true, createdAt: true }).partial(),
    },
})
```

### Aggregate Schemas

```ts
// src/schemas/index.ts
import { SchemaRegistry } from "unstrap";
import userSchema from './user';

export const schemas: SchemaRegistry = {
    "api::user.user": userSchema , // note the schema key, it should be the same as controller key, we will use this shared key in factory
} as const;

```

The schema defines:
- tableName → database table (Drizzle ORM)
- validation → Zod validation for insert and update
- info → display names for frontend or admin use


### Example: CRUD Controller
```ts   
import { factories } from "@/lib/factories";
export default factories.createCoreController("api::user.user", () => ({
    async me(ctx) {

        ctx.res.status(418)
        return ctx.res.json({
            me: 'nurbxfit'
        })
    }
}));

```
his allows you to create standard CRUD endpoints quickly, while still supporting custom logic.

### Example: Routes
You can define routes similarly using a factory pattern:

```ts
// src/api/users/routes/user.ts

import { factories } from "@/lib/factories";

export default factories.createCoreRoutes("api::user.user")

```

### Example: Custom Route

```ts
// src/api/users/routes/custom-user.ts

import { createCustomRoutes } from "unstrap";

export default createCustomRoutes([
    {
        method: 'GET',
        path: '/users/me',
        handler: "api::user.user.me",
        config: {
            middlewares: [],
            policies: []
        }
    }
])
```

# Stitching it Together
In each modules/resource collection, you will have a `controllers` and `routes` folder and an index.ts
example folder structure:

```
src/
 ├─ api/
 │   └─ users/
 │       ├─ controllers/
 │       │    └─ user.ts
 │       ├─ routes/
 │       │    ├─ user.ts
 │       │    └─ custom-user.ts
 │       └─ index.ts # here we stitch it all together
```
In the `index.ts`, you can stich it up together into a router by calling the createRouter factory:

```ts
import { createRouter } from "@unstrap/hono";
import { Hono } from "hono";
import userRoutes from '@/api/users/routes/user';
import customUserRoutes from '@/api/users/routes/custom-user';
import userController from '@/api/users/controllers/user';
import { ControllerRegistry, CoreController } from "unstrap";

const controllers: ControllerRegistry = {
    "api::user.user": userController as CoreController
}
const app = new Hono();

const router = createRouter(app, [customUserRoutes, userRoutes], controllers)

export default router;
```

This keeps your API modular, easy to setup and organized.

## Philosophy

- Modular – each resource has its own controller and routes.
- Factory-driven – generate CRUD endpoints automatically, extendable with custom logic.
- Developer-friendly – inspired by Strapi but framework-agnostic (adaptable).