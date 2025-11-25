# loompi

Framework-agnostic API factory toolkit inspired by Strapi. Generate CRUD APIs (controllers, routes, validation, filtering) using your own framework and ORM.

## Installation

```bash
npm install loompi
```

## Quick Start

**Basic workflow:**
1. Define your data schema using `defineSchema`
2. Create a repository factory for your ORM
3. Use `createFactory` to generate controllers and routes
4. Integrate generated routes into your web framework

> **Note:** loompi is framework and ORM agnostic. Adapt examples to your chosen framework and ORM.

### Adapters

Two types of adapters are available:

| Adapter Type | Purpose | Examples |
|---|---|---|
| **Framework** | Generate routes and controllers | Express, Fastify, Hono |
| **ORM** | Create repositories | Drizzle, Prisma, TypeORM |

Install adapters matching your stack. For example, Express + Drizzle:
```bash
npm install express drizzle-orm @loompi/express @loompi/drizzle
```

### Example: Define Schema and Create Router

```ts
// user-router.ts
import { defineSchema, createFactory, createResourceRegistry } from 'loompi';
import { createRouter } from '@loompi/express';
import { customRepoFactory } from './lib/custom-orm-factory';

export const userSchema = defineSchema({
    kind: 'collectionType',
    collectionName: 'user',
    info: { singularName: 'user', pluralName: 'users', displayName: 'Users' }
});

const factories = createFactory({ 
    repository: customRepoFactory, 
    schemas: { "api::user.user": userSchema } 
});

const { routes, controllers } = createResourceRegistry(factories, [
    { schemaName: "api::user.user" }
]);

export default createRouter(routes, controllers);
```

### Integrate with Express

```ts
// app.ts
import express from 'express';
import userRouter from './user-router';

const app = express();
app.use(express.json());
app.use('/users', userRouter);

export default app;
```


## Advanced Usage

### Custom Repository Implementation

Implement the `Repository` interface for custom ORMs:

```ts
// lib/custom-orm-factory.ts
import type { Repository, FindOptions, RepositoryFactory } from 'loompi';

export class CustomRepository implements Repository {
    constructor(private prefix: string) {}

    async find(options: FindOptions) {
        return { data: [...], total: 0 };
    }

    async findOne(id: string | number) {
        return { id, name: '...', email: '...' };
    }

    async create(data: any) {
        return { id: 1, ...data };
    }

    async update(id: string | number, data: any) {
        return { id, ...data };
    }

    async delete(id: string | number) {
        return { id };
    }
}

export const customRepoFactory: RepositoryFactory = (schemaName) => 
    new CustomRepository(schemaName);
```


### Using Drizzle Repository Adapter

```ts
// lib/drizzle-orm-factory.ts
import { createDrizzleRepositoryFactory } from "@loompi/drizzle";
import { db } from "./database";
import { userSchema } from "./user-router";

const schemas = {
    "api::user.user": userSchema,
};  

export const factories = createFactory({
    repository: createDrizzleRepositoryFactory(db, schemas, { dialect: 'sqlite' }),
    schemas
});
```


For more information, refer to the [Loompi Documentation](https://github.com/nurbxfit/loompi)