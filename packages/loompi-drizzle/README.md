# @loompi/drizzle
Drizzle ORM adapter for Loompi.

## Installation

```bash
npm install @loompi/drizzle loompi drizzle drizzle-zod
```

## Usage

```ts
import { createDrizzleRepositoryFactory } from '@loompi/drizzle';
import { createFactory } from 'loompi';
import { db } from './database';
import { schemas } from './schemas';

const repository = createDrizzleRepositoryFactory(db, schemas, { dialect: 'sqlite' });
export const factories = createFactory({ repository, schemas });

```

## Peer Dependencies

- drizzle-orm must be installed by the host project.

## Notes
- Use this adapter to connect Loompi with Drizzle ORM.
- Compatible with SQLite, Postgres, MySQL.


For more information, refer to the [Loompi Documentation](https://github.com/nurbxfit/loompi)