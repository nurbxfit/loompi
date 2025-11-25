# @loompi/fastify

Fastify framework adapter for Loompi.

## Installation

```bash
npm install @loompi/fastify loompi fastify @fastify/request-context @fastify/multipart
```
## Usage
### Create Fastify Router
```ts
import { FastifyInstance } from 'fastify';
import { createRouter } from '@loompi/fastify';
import { createResourceRegistry } from 'loompi';
import { factories } from './factories';    

const { routes, controllers } = createResourceRegistry(factories, [ 
  { schemaName: 'api::user.user' } 
]);

export const usersRouter = createRouter(routes, controllers);
```


### Integrate with Fastify App
```ts
import fastify from 'fastify';  
import { FastifyInstance } from 'fastify';
import { usersRouter } from './user-router';

const app: FastifyInstance = fastify();

// Register adapters/plugins
await app.register(require('@fastify/request-context'));
await app.register(require('@fastify/multipart'));

// Register loompi routes
registerFastifyRouter(app, usersRouter);

await app.listen({ port: 3000 });
```

## Peer Dependencies

- fastify must be installed by the host project.
- Optional: @fastify/request-context, @fastify/multipart.

For more information, refer to the [Loompi Documentation](https://github.com/nurbxfit/loompi)