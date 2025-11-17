import { Hono } from 'hono';
import { logger } from 'hono/logger';
import usersModule from './api/users';
import mockeriesModule from './api/mockeries';

const app = new Hono();

app.use('*', logger());

app.route('/api', usersModule);
app.route('/api', mockeriesModule)



app.get('/', (c) => {
    return c.json({
        message: 'loompi Example - Hono + Drizzle',
        version: '1.0.0'
    });
});

export default app;
