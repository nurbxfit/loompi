import { CoreRouterOptions, FactoryContext, RouteDefinition, RouteSpec, SchemaName, SchemaRegistry } from "./types";

/**
 * Generate route spec for CRUD operations
 * This doesn't register routes, it just return the spec
 * later we can either manually use it or use the createRouter 
 * to stich it out with the controller 
 */
export function createCoreRoutes<S extends SchemaRegistry>(
    context: FactoryContext<S>,
    schemaName: keyof S,
    options: CoreRouterOptions = {}
): RouteDefinition {
    const schema = context.schemas[schemaName];
    const defaultPath = `/${schema.info.pluralName}`;
    const basePath = options.prefix ?? defaultPath;

    const coreRoutes = ['find', 'findOne', 'create', 'update', 'delete'] as const;

    /**
     * By default we includes all coreRoutes,
     * if user use only or except, we will filter by that
     */
    let routesToInclude = [...coreRoutes];
    if (options.only) {
        routesToInclude = routesToInclude.filter(r => options.only?.includes(r));
    }
    if (options.except) {
        routesToInclude = routesToInclude.filter(r => !options.except?.includes(r));
    }

    const routes: RouteSpec[] = [];

    routesToInclude.forEach(routeName => {
        const config = options.config?.[routeName];

        switch (routeName) {
            case 'find':
                routes.push({
                    method: 'GET',
                    path: basePath, // eg:. /users
                    handler: `${schemaName as string}.find`,
                    config
                })
                break;
            case 'findOne':
                routes.push({
                    method: 'GET',
                    path: `${basePath}/:id`, // eg:. /users/:id
                    handler: `${schemaName as string}.findOne`,
                    config
                })
                break;
            case 'create':
                routes.push({
                    method: 'POST',
                    path: basePath,
                    handler: `${schemaName as string}.create`,
                    config
                })
                break;
            case 'update':
                routes.push({
                    method: 'PUT',
                    path: `${basePath}/:id`,
                    handler: `${schemaName as string}.update`,
                    config
                })
                break;
            case 'delete':
                routes.push({
                    method: 'DELETE',
                    path: `${basePath}/:id`,
                    handler: `${schemaName as string}.delete`,
                    config
                })
                break;
        }
    })

    return {
        routes
    }

}

// help define custom routes with type safety, instead of just export default an object in our route file 
export function createCustomRoutes(routes: RouteSpec[]): RouteDefinition {
    return { routes };
}