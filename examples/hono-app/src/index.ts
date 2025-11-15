import { Hono } from 'hono';
import { logger } from 'hono/logger';
// import usersModule from './api/users';

import userController from '@/api/users/controllers/user';
import { honoContextAdapter } from './lib/adapters';

const app = new Hono();

app.use('*', logger());

// app.route('/api', usersModule);

app.get('/api/test', async (c) => {
    // temporary manually adapt the context 
    return userController.find(honoContextAdapter(c));
})

app.get('/', (c) => {
    return c.json({
        message: 'Unstrap Example - Hono + Drizzle',
        version: '1.0.0'
    });
});

export default app;
