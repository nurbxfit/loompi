# @loompi/hono

Hono framework adapter for Loompi.

## Installation

```bash
npm install @loompi/hono loompi hono
```
## Usage

### Create Hono Router
```ts  
import { Hono } from 'hono';
import { createRouter } from '@loompi/hono';
import { createResourceRegistry } from 'loompi';
import { factories } from './factories';

const { routes, controllers } = createResourceRegistry(factories, [
  { schemaName: 'api::user.user' }
]);

export const usersRouter = createRouter(routes, controllers);

```
### Integrate with Hono App

```ts   
import { Hono } from 'hono';
import { usersRouter } from './user-router';    
const app = new Hono(); 
app.route('/api', usersRouter);
export default app;
```

For more information, refer to the [Loompi Documentation](https://github.com/nurbxfit/loompi)