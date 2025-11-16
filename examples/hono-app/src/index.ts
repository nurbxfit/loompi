import { Hono } from 'hono';
import { logger } from 'hono/logger';
import usersModule from './api/users';

const app = new Hono();

app.use('*', logger());

app.route('/api', usersModule);



app.get('/', (c) => {
    return c.json({
        message: 'Unstrap Example - Hono + Drizzle',
        version: '1.0.0'
    });
});

export default app;
