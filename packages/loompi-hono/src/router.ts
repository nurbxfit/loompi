import { Context, Hono } from "hono";
import { ControllerRegistry, createRouterMappings, RouteDefinition } from "loompi";
import { honoToRequestContextAdapter } from "./request";


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
            return handler(ctx);
        }

        /**
         * TODO: Need to decide if middleware receive 
         * our requestContext or hono context.
         */
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