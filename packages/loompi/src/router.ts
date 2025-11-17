import { ControllerRegistry, MiddlewareHandler, RouteDefinition, RouteMapping } from "./types";

const policies = new Map<string, MiddlewareHandler>();
const middlewares = new Map<string, MiddlewareHandler>();

export function registerPolicy(name: string, handler: MiddlewareHandler) {
    policies.set(name, handler);
}

export function registerMiddleware(name: string, handler: MiddlewareHandler) {
    middlewares.set(name, handler);
}


export function createRouterMappings(
    // app: GenericApp ? or AdaptedApp ??
    routeDefinition: RouteDefinition[],
    controllers: ControllerRegistry // Record<string, CoreController>
): RouteMapping[] {

    const mappings: RouteMapping[] = [];
    routeDefinition.forEach(({ routes }) => {
        routes.forEach((route) => {
            const config = route.config;
            const middlewareStack: MiddlewareHandler[] = []
            const authEnabled = config?.auth !== false;

            // 1. Process auth config
            if (authEnabled) {
                const authMiddleware = middlewares.get('auth');
                if (authMiddleware) {
                    middlewareStack.push(authMiddleware);
                } else {
                    console.warn('Auth enabled but no auth middleware registered');
                }
            }

            // 2. todo process policy ?? for what ?? not sure, saw it in strapi

            // 3. Process middlewares
            if (config?.middlewares?.length) {
                config?.middlewares.forEach(middlewareConfig => {
                    if (typeof middlewareConfig === 'string') {
                        // Named middleware
                        const mw = middlewares.get(middlewareConfig);
                        if (mw) {
                            middlewareStack.push(mw);
                        } else {
                            console.warn(`Middleware not found: ${middlewareConfig}`);
                        }
                    } else if (typeof middlewareConfig === 'function') {
                        // Inline middleware
                        middlewareStack.push(middlewareConfig);
                    }
                });
            }

            const parts = route.handler.split('.');
            let controllerKey: string;
            let actionName: string;

            // eg:. api::user.user.findOne
            if (parts.length === 3) {
                controllerKey = `${parts[0]}.${parts[1]}` // combined the first two back together (api::category.category)
                actionName = parts[2]
            } else if (parts.length == 2) {
                controllerKey = parts[0];
                actionName = parts[1]
            } else {
                console.warn(`Invalid handler format: ${route.handler}`)
                return;
            }

            const controller = controllers[controllerKey];
            if (!controller) {
                console.warn(`Controller not found: ${controllerKey}`);
                return;
            }

            const handler = controller[actionName];
            if (!handler) {
                console.warn(`Handler not found: ${controllerKey}.${actionName}`);
                return;
            }

            // // we should register controller to the routes and bind it to 
            // // the app, but now that this is framework agnostic, 
            // // we are not sure how each app passed handle the routes assignment
            // // should we create an adapter ??
            // const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
            // // app[method]?.(route.path, ...middlewares, handler);

            mappings.push({
                method: route.method.toLowerCase() as any,
                path: route.path,
                handler,
                middlewares: middlewareStack,
            });

            console.log(`Registered: ${route.method} ${route.path} -> ${route.handler}`);
        })
    })

    return mappings

}