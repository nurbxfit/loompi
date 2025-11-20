# 🌱 loompi

A framework-agnostic Strapi-style API factory.
Generate fully typed CRUD APIs (controllers + routes + validation + filtering) using your own framework and ORM.

<p align="left"> <img src="https://img.shields.io/badge/status-alpha-blue" /> <img src="https://img.shields.io/badge/runtime-node%20%7C%20bun-green" /> <img src="https://img.shields.io/badge/framework-hono%20%7C%20express%20%7C%20fastify-yellow" /> <img src="https://img.shields.io/badge/orm-drizzle%20%7C%20prisma%20%7C%20kysely-purple" /> </p>

Loompi is a lightweight experiment I built for fun.
It’s not a framework or a full solution.

Just a collection of helpers that make it easier to set up basic CRUD endpoints using your own stack (Hono, Express, Drizzle, etc.).

If you like Strapi’s schema → controller → routes idea but want something simple and code-based, this might be useful.

## ✨ Features

- 🚀 Framework Agnostic – Hono, Express, Fastify, or anything else
- 🗄️ ORM Agnostic – Drizzle, Prisma, Kysely, etc.
- 🧩 Auto-generated CRUD – find, findOne, create, update, delete
- 🔒 Type-safe – TypeScript everywhere
- 🎨 Strapi-inspired DX – schemas & resource conventions
- 🔌 Extendable – override controllers or add custom routes
- 🔍 Advanced Filtering – $eq, $gt, $in, $contains, etc.
- 📦 Modular – you pick the framework & ORM

## 🚀 Quick Start

**Install Loompi + your adapters:**
```ts
bun add loompi @loompi/hono @loompi/drizzle
```

**The Easy Way: `createResourceRegistry`**

The fastest way to scaffold resources is with `createResourceRegistry`. 

You'll need three things:

- Schema – Defines your resource structure and validation
- Repository Adapter – Connects loompi to your ORM
- Router Adapter – Connects loompi to your web framework

### 1. Define a Scehma:

Basic schema looks like this: 
```ts
export default defineSchema({
    kind: 'collectionType',
    collectionName: 'user',
    tableName: user,
    info: {
        singularName: 'user',
        pluralName: 'users',
        displayName: 'users',
    }
})
```

or extends it with custom hooks and validation like this:
```ts
import { user } from "@/db/user-schema";
import { defineSchema } from "loompi";
import { createInsertSchema } from 'drizzle-zod';
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
        if (!data.id) {
          data.id = crypto.randomUUID(); // will auto gen uuid for sqlite id fields
        }
        return data;
      },
    },
    controller: {
      afterCreate: (ctx, data) => {
        // Manipulate response data (don't return ctx.res.json directly!)
        return { ...data, hooked: true };
      },
      afterUpdate: (ctx, data) => {
        return { ...data, hooked: true };
      }
    }
  },
  validation: {
    request: {
      create: createInsertSchema(user, {
        name: z.string(),
        email: z.string().email(),
      }).omit({ id: true, createdAt: true, emailVerified: true }).strict(),
      
      update: createInsertSchema(user, {
        name: z.string(),
        email: z.string().email(),
        image: z.string().url(),
      }).omit({ id: true, createdAt: true, emailVerified: true }).partial().strict(),
    }
  },
});
```

### 2. Create a Schema Registry:

```ts
import { SchemaRegistry } from "loompi";
import userSchema from './user';
import productSchema from './product';

export const schemas: SchemaRegistry = {
    "api::user.user": userSchema,
    "api::product.product": productSchema
} as const;
```

### 3. Set up Repository and factories:

```ts
import { schemas } from "@/schemas";
import { createDrizzleRepositoryFactory } from "@loompi/drizzle";
import { db } from "./database";


const repository = createDrizzleRepositoryFactory(db, schemas, {
    dialect: 'sqlite'
})

// factories requires a repository and schema registry
// we export this to to create controllers and routes later.
export const factories = createFactory({
    repository,
    schemas: schemas
})

```

> Note: Each adapter will have its own setup process, please refer to the respective adapter docs for more details.


### 4. Create Resources and Router.

```ts
import { factories } from "@/lib/factories";
import { createRouter } from "@loompi/hono";
import { Hono } from "hono";
import { createResourceRegistry } from "loompi";


const { routes, controllers } = createResourceRegistry(factories, [
    { schemaName: "api::user.user" }
])

export default createRouter(new Hono(), routes, controllers);

```

### 5. Use the Router

```ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import usersModule from './api/users';

const app = new Hono();

app.use('*', logger());

app.route('/api', usersModule); // we now have /api/users endpoints with full CRUD (find, findOne, create, update, delete)



app.get('/', (c) => {
    return c.json({
        message: 'loompi Example - Hono + Drizzle',
        version: '1.0.0'
    });
});

export default app;

```

## Advanced: Extending createResourceRegistry
`createResourceRegistry` also allows you to extend your resources with custom controller methods and routes.

```ts
const { routes, controllers } = createResourceRegistry(factories, [
    {
      // here we define a standard resource (CRUD) for the user schema
      schemaName: 'api::user.user',
      // here we extend the user resource with custom controller methods and routes
        controllerExtensions: ({ repository }) => ({
            hello: async (ctx) => {
                const data = repository("api::user.user").find({});
                return ctx.res.json({
                    data
                })
            }
        }),
        customRoutes: [
            {
                method: 'GET',
                path: '/users/hello',
                handler: 'api::user.user.hello'
            }
        ]
    },
])
```


## 📁 Manual Setup Project Structure Example
For flexibility, you can also set up loompi manually without `createResourceRegistry`.

**A typical user resource using Hono + Drizzle + BetterAuth:**
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

### 1. 🧱 Defining a Schema
```ts
// src/schemas/user.ts
import { user } from "@/db/user-schema";
import { defineSchema } from "loompi";
import { createInsertSchema } from 'drizzle-zod';
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
    request: {
      create: createInsertSchema(user, {
        name: z.string(),
        email: z.string().email(),
      }).omit({ id: true, createdAt: true }),
      
      update: createInsertSchema(user, {
        name: z.string(),
        email: z.string().email(),
        image: z.string().url(),
      }).omit({ id: true, createdAt: true }).partial(),
    }
  },
});
```
### 2. 📚 Registering Schemas
```ts
// src/schemas/index.ts
import { SchemaRegistry } from "loompi";
import userSchema from "./user";

export const schemas: SchemaRegistry = {
  "api::user.user": userSchema,
} as const;
```

### 3. 🧩 Creating a Controller
```ts
// src/api/users/controllers/user.ts
import { factories } from "@/lib/factories";

export default factories.createCoreController("api::user.user", () => ({
  async me(ctx) {
    return ctx.res.json({ user: 'example-user' }, 200);
  }
}));
```

This gives you all CRUD handlers (`find`, `findOne`, `create`, `update`, `delete`) plus your custom `me` method.

### 4. 🛣️ Generating Routes
```ts
// src/api/users/routes/user.ts
import { factories } from "@/lib/factories";

export default factories.createCoreRoutes("api::user.user");
```

**This gives you routes for all the standard CRUD operations:**
```
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
```


### 5. 🧪 Adding Custom Routes
```ts
// src/api/users/routes/custom-user.ts
import { createCustomRoutes } from "loompi";

export default createCustomRoutes([
  {
    method: "GET",
    path: "/users/me",
    handler: "api::user.user.me",  // Pattern: resource.controller.method
    config: { middlewares: [], policies: [] }
  }
]);
```
here we define a custom route that maps to the `me` controller method we defined earlier.

noticed that we give `"api::user.user.me"` as the handler string, which follows the pattern of "resource.controller.method".

### 6. 🔗 Stitching Everything Together
```ts
// src/api/users/index.ts
import { createRouter } from "@loompi/hono";
import { Hono } from "hono";
import { ControllerRegistry, CoreController } from "loompi";

import userRoutes from "./routes/user";
import customUserRoutes from "./routes/custom-user";
import userController from "./controllers/user";

const controllers: ControllerRegistry = {
  "api::user.user": userController as CoreController,
};

const app = new Hono();
const router = createRouter(app, [customUserRoutes, userRoutes], controllers);

export default router;
```

## 🛠️ Creating Custom Adapters
You can build your own repository adapter by implementing the `Repository` and `RepositoryFactory` interfaces from loompi.

```ts
import type { Repository, FindOptions, RepositoryFactory } from 'loompi';

export class MockRepository implements Repository {
  constructor(private prefix: string) {}

  async find(options: FindOptions): Promise<{ data: any[]; total: number }> {
    return {
      data: [
        { id: 1, name: `${this.prefix}-John`, email: 'john@example.com' },
        { id: 2, name: `${this.prefix}-Jane`, email: 'jane@example.com' },
      ],
      total: 2
    };
  }

  async findOne(id: string | number): Promise<any> {
    return { id, name: `${this.prefix}-John`, email: 'john@example.com' };
  }

  async create(data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async update(id: string | number, data: any): Promise<any> {
    return { id, ...data };
  }

  async delete(id: string | number): Promise<any> {
    return { id, name: `${this.prefix}-John` };
  }
}

export const mockRepoFactory: RepositoryFactory = (schemaName: string) => {
  return new MockRepository(schemaName);
};
```

## 🧠 Philosophy

- Bring your own stack – framework, ORM, router, auth
- Convention over configuration – define a schema, get CRUD
- Full override control – controllers and routes are extendable
- Clean folder structure – each resource stands on its own

## 🧩 Adapter Overview
| Package           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `loompi`          | Core schema, controller, filtering logic   |
| `@loompi/hono`    | Router factory for Hono                    |
| `@loompi/express` | Router factory for Express                 |
| `@loompi/fastify` | Router factory for Fastify                 |
| `@loompi/drizzle` | Repository + query adapter for Drizzle ORM |


More adapters planned. (express, fastify, prisma, kysely, etc.)


## 🗺️ Roadmap

- 🔜 Prisma adapter
- 🔜 Kysely adapter
- 🔜 Relations (populate / expand)

## 💬 Questions / Feedback

Feel free to open a GitHub issue or start a discussion — feedback is extremely welcome during the early alpha phase. 