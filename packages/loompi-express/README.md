# @loompi/express

Express framework adapter for Loompi.

## Installation

```bash
npm install @loompi/express loompi express
# optional middlewares
npm install multer @sliit-foss/express-http-context
```
## Usage
### Create Express Router
```ts
import { Router } from 'express';   
import { createRouter } from '@loompi/express';
import { createResourceRegistry } from 'loompi';    
import { factories } from './factories';
const { routes, controllers } = createResourceRegistry(factories, [ 
  { schemaName: 'api::user.user' } 
]);
export const usersRouter: Router = createRouter(routes, controllers);
```

### Integrate with Express App
```ts
import express from 'express';
import { usersRouter } from './user-router';

const app = express();

app.use('/api', usersRouter);

app.listen(3000);
```

## Peer Dependencies
- express must be installed by the host project.
- Optional: multer, @sliit-foss/express-http-context.

For more information, refer to the [Loompi Documentation](https://github.com/nurbxfit/loompi)
