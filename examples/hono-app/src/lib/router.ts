import { Context, Hono } from "hono";
import { ControllerRegistry, createRouterMappings, RouteDefinition } from "unstrap";
import { honoToRequestContextAdapter } from "./adapters";

/**
 * Temporary, for testing, I will moved it into unstrap-hono adapter
 */
export function createRouter(
    app: Hono,
    routeDefinitions: RouteDefinition[],
    controllers: ControllerRegistry
): Hono {
    const mappings = createRouterMappings(routeDefinitions, controllers);

    // we takes the mappings, and then register to Hono app
    mappings.forEach((mappings) => {
        const { method, path, handler, middlewares } = mappings

        const honoHandler = async (c: Context) => {
            const ctx = honoToRequestContextAdapter(c);
            return handler(ctx);
        }

        // const honoMiddleware = middlewares.map(mw => {
        //     return async (c: Context, next: () => Promise<void>) => {
        //         const ctx = honoToRequestContextAdapter(c);
        //         await mw(ctx, next);
        //     }
        // })

        app[method](path, ...middlewares, honoHandler);
    });

    return app;
}