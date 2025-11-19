import { Context, Hono } from "hono";
import { ControllerRegistry, createRouterMappings, handleControllerError, MiddlewareHandler, RouteDefinition } from "loompi";
import { honoToRequestContextAdapter } from "./request";
import { createMiddleware } from "hono/factory";


export function createRouter(
    app: Hono,
    routeDefinitions: RouteDefinition[],
    controllers: ControllerRegistry
): Hono {
    const mappings = createRouterMappings(routeDefinitions, controllers);
    mappings.forEach((mappings) => {
        const { method, path, handler, middlewares } = mappings

        const honoHandler = async (c: Context) => {
            const ctx = honoToRequestContextAdapter(c);
            try {
                const result = await handler(ctx);
                return result || c.res;

            } catch (error) {
                return handleControllerError(ctx, error);
            }
        }

        const honoMiddleware = middlewares.map((mw: MiddlewareHandler) => {
            // implement hono middleware
            return createMiddleware(async (c: Context, next) => {
                const ctx = honoToRequestContextAdapter(c);
                try {
                    return await mw(ctx, async () => {
                        await next();
                    });
                } catch (error) {
                    return handleControllerError(ctx, error);
                }
            })
        })

        app[method](path, ...honoMiddleware, honoHandler);
    });

    return app;
}