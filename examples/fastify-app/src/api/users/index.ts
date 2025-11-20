import { factories } from "@/lib/factories";
import { authMiddleware, enrichmentMiddleware, loggingMiddleware, timingMiddleware, validateQueryMiddleware } from "@/lib/middlewares";
import { createRouter } from "@loompi/fastify";
import { createResourceRegistry, RequestContext } from "loompi";

const { routes, controllers } = createResourceRegistry(factories, [
    {
        schemaName: "api::user.user",
        routeOptions: {
            config: {
                find: {
                    middlewares: [
                        loggingMiddleware,
                        timingMiddleware,
                        validateQueryMiddleware, // Can block if limit > 100
                        enrichmentMiddleware,
                    ]
                }
            }
        },
        // Add custom controllers to verify ctx.get() works
        controllerExtensions: ({ repository }) => ({
            me: async (ctx: RequestContext) => {
                console.log('🎯 [Controller] me() called');

                const user = ctx.get('user');
                const requestId = ctx.get('requestId');
                const timestamp = ctx.get('timestamp');

                ctx.res.json({
                    message: 'Custom me endpoint',
                    user,
                    requestId,
                    timestamp,
                    headers: ctx.req.headers,
                });
            },

            // Test endpoint that simulates slow operation
            slow: async (ctx: RequestContext) => {
                console.log('🐌 [Controller] slow() called');

                // Simulate slow operation
                await new Promise(resolve => setTimeout(resolve, 1000));

                ctx.res.json({
                    message: 'This took 1 second',
                    requestId: ctx.get('requestId'),
                });
            },

            // Test endpoint that always fails
            error: async (ctx: RequestContext) => {
                console.log('💥 [Controller] error() called');
                throw new Error('Simulated error for testing');
            }
        }),
        customRoutes: [
            {
                method: 'GET',
                path: '/users/me',
                handler: 'api::user.user.me',
                config: {
                    middlewares: [
                        loggingMiddleware,
                        authMiddleware,
                        enrichmentMiddleware,
                    ]
                }
            },
            {
                method: 'GET',
                path: '/users/slow',
                handler: 'api::user.user.slow',
                config: {
                    middlewares: [
                        loggingMiddleware,
                        timingMiddleware,
                    ]
                }
            },
            {
                method: 'GET',
                path: '/users/error',
                handler: 'api::user.user.error',
                config: {
                    middlewares: [
                        loggingMiddleware,
                    ]
                }
            }
        ]
    }
])

export default createRouter(routes, controllers, {
    useHttpContext: true,
    useMultipart: true,
    prefix: '/api'
})