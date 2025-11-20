import Fastify from 'fastify';
import { registerFastifyRouter } from '@loompi/fastify';
import userRouter from './api/users'
import fastifyRequestContext from '@fastify/request-context';
import fastifyMultipart from '@fastify/multipart';

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(fastifyRequestContext, {
    defaultStoreValues: {
        user: null,
    }
});

await fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    }
});

// Register all routes
registerFastifyRouter(fastify, userRouter);


await fastify.listen({ port: 3000 });