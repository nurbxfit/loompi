import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    ControllerRegistry,
    createRouterMappings,
    MiddlewareHandler,
    RouteDefinition
} from 'loompi';
import { fastifyRequestContextAdapter, FastifyAdapterOptions } from './request';

export interface CreateRouterOptions extends FastifyAdapterOptions {
    prefix?: string;
    useHttpContext?: boolean,
    useMultipart?: boolean,
}

export function createRouter(
    routeDefinitions: RouteDefinition[],
    controllers: ControllerRegistry,
    options: CreateRouterOptions = {}
) {
    const mappings = createRouterMappings(routeDefinitions, controllers);
    const router: {
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        url: string,
        preHandler: ((request: FastifyRequest, reply: FastifyReply) => Promise<void>)[]
        handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>
    }[] = [];

    mappings.forEach((mapping) => {
        const { method, path, handler, middlewares } = mapping;
        const fastifyMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
        const fullPath = options.prefix ? `${options.prefix}${path}` : path;

        // Convert loompi middlewares to Fastify preHandler hooks
        const preHandlers = middlewares.map((mw: MiddlewareHandler) => {
            return async (request: FastifyRequest, reply: FastifyReply) => {
                const ctx = fastifyRequestContextAdapter(request, reply, {
                    useRequestContext: options.useRequestContext,
                    useMultipart: options.useMultipart
                });

                let nextCalled = false;

                await mw(ctx, async () => {
                    nextCalled = true;
                });

                // If middleware sent a response and didn't call next, stop here
                if (!nextCalled && reply.sent) {
                    return;
                }
            };
        });

        // Main route handler
        const fastifyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
            const ctx = fastifyRequestContextAdapter(request, reply, {
                useRequestContext: options.useRequestContext,
                useMultipart: options.useMultipart
            });

            const result = await handler(ctx);

            // If handler returned something and reply wasn't sent
            if (result !== undefined && !reply.sent) {
                return result; // Fastify auto-serializes
            }
        };

        // Register route
        router.push({
            method: fastifyMethod,
            url: fullPath,
            preHandler: preHandlers,
            handler: fastifyHandler
        })
    });

    return router;

}

export function registerFastifyRouter(fastify: FastifyInstance, router: ReturnType<typeof createRouter>,) {
    router.forEach(r => fastify.route(r));
}