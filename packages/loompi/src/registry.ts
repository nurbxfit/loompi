import { createFactory } from "./factory";
import { createCustomRoutes } from "./route";
import { ControllerExtensionsDefinition, ControllerMethod, ControllerRegistry, CoreController, CoreRouterOptions, CustomController, FactoryContext, RouteDefinition, RouteSpec, SchemaRegistry } from "./types";

// Ideas; Currently the process of using this packages require 5 to 6 steps

// // 1. Define schemas
// const UserSchema = defineSchema({ ... });
// const schemas = { 'api::user.user': UserSchema };

// // 2. Create factory
// const factories = createFactory({ repository, schemas });

// // 3. Create controllers
// const userController = factories.createController('api::user.user', extensions);

// // 4. Create routes
// const userRoutes = factories.createRoutes('api::user.user', options);

// // 5. Create registry
// const controllers = { 'api::user.user': userController };
// const routes = [userRoutes];

// // 6. Create router
// const router = createRouter(app, routes, controllers);

// decided to create a helper or abstraction to help make it more convenient, while not detroying the flexibility

/**
 * This function helps generate resource definitions (controllers and routes)
 * with minimal steps based on a schema.
 * The resulting routes and controllers still need to be stitched together
 * using a separate function like `createRouter`.
 * * @param factories - The factory instance used to create core components.
 * @param schemaName - The key of the schema to build the resource for.
 * @param options - Configuration options for controller extensions and custom routes.
 * @returns An object containing the generated controller, routes, and the schema name.
 * * @example
 * // 1. Define the application instance (e.g., Hono, Express).
 * // 2. Call createResource to get controllers and routes definitions.
 * // 3. Use createRouter to apply definitions to the application instance.
 * const app = new Hono() // or new Express()
 * const {routes,controller} = createResource(
 *  factories,
 *  "api::user.user",
 *  {
 *   controllerExtensions: ({_}) => ({
 *      me: (ctx) => {
 *          const authedUser = ctx.req.get("user");
 *          return ctx.res.json({
 *              ...authedUser
 *          },200)
 *      }
 *   }),
 *   customRoutes: [
 *      {
 *          method: 'GET',
 *          path: '/users/me',
 *          handler: 'api::user.user.me'
 *      }
 *   ]
 *  }
 * )
 * const router = createRouter(app, routes, {"api::user.user": controller as CoreController})
*/
export function createResource<S extends SchemaRegistry>(
    factories: ReturnType<typeof createFactory<S>>,
    schemaName: keyof S,
    options?: {
        controllerExtensions?: (ctx: FactoryContext<S>) => ControllerExtensionsDefinition;
        routeOptions?: CoreRouterOptions;
        customRoutes?: RouteSpec[],
    }
): {
    controllerRegistry: ControllerRegistry,
    routeDefinitions: RouteDefinition[],
} {
    // based on definition they provide,
    // we help build coreController and coreRoutes for them.

    const controller = factories.createCoreController(schemaName, options?.controllerExtensions);

    const coreRoutes = factories.createCoreRoutes(schemaName, options?.routeOptions);
    const routes = [];

    if (options?.customRoutes) {
        routes.push(createCustomRoutes(options.customRoutes));
    }

    routes.push(coreRoutes)

    // we still need to stich it together to create router,
    // const app = new Hono() // or new Express()
    // const router = createRouter(app, routes, controllers)

    // or should we return controllerRegistry instead of controller ?? 
    // eg: const controllers =  {[schemaName]: controller}
    return {
        controllerRegistry: {
            [schemaName]: controller as CoreController
        },
        routeDefinitions: routes,
    }
}


/**
 * @typedef {Object} ResourceConfig
 * @property {keyof S} schemaName - The unique identifier/key of the schema (e.g., 'api::user.user').
 * @property {(ctx: FactoryContext<S>) => Partial<CoreController>} [controllerExtensions] - A function to extend or override the default controller methods.
 * @property {CoreRouterOptions} [routeOptions] - Options to configure the generation of core routes (e.g., limit, policy).
 * @property {RouteSpec[]} [customRoutes] - An array of custom route specifications to be added to the resource.
 */


// JSDOC generate using A.I

/**
 * Creates a registry (a collection) of controllers and routes for multiple resources
 * based on the provided schema definitions.
 * * This function iterates through the list of resources, uses `createResource` internally
 * for each one, and aggregates the resulting controllers and routes into a single object.
 * * @template S - A type extending the SchemaRegistry, which defines all available schemas.
 * @param {ReturnType<typeof createFactory<S>>} factories - The factory instance used to generate core controllers and routes.
 * @param {ResourceConfig[]} resources - An array of configuration objects, each defining a resource to be created.
 * @returns {{controllers: Record<string, CoreController>, routes: RouteDefinition[]}} An object containing all generated controllers mapped by schema name, and a flattened array of all generated route definitions.
 *
 * @example
// src/lib/resources.ts
import { createResourceRegistry } from 'unstrap';
import { factories } from './factories';

export const { controllers, routes } = createResourceRegistry(factories, [
    // User resource
    {
        schemaName: 'api::user.user',
        routeOptions: {
            config: {
                find: { auth: false },
                create: { auth: true }
            }
        },
        controllerExtensions: ({ repository }) => ({
            async me(ctx) {
                const user = ctx.get('user');
                return ctx.res.json({ data: user });
            }
        }),
        customRoutes: [
            {
                method: 'GET',
                path: '/me',
                handler: 'api::user.user.me',
                config: { auth: true }
            }
        ]
    },
    
    // Post resource (defaults)
    {
        schemaName: 'api::post.post'
    },
    
    // Admin resource (custom config)
    {
        schemaName: 'api::admin.admin',
        routeOptions: {
            only: ['find', 'findOne']
        }
    }
]);

// src/index.ts
import { createRouter } from '@unstrap/hono';
import { controllers, routes } from './lib/resources';

const app = new Hono();
createRouter(app.basePath('/api'), routes, controllers);
 */

export function createResourceRegistry<S extends SchemaRegistry>(
    factories: ReturnType<typeof createFactory<S>>,
    resources: Array<{
        schemaName: keyof S;
        controllerExtensions?: (ctx: FactoryContext<S>) => ControllerExtensionsDefinition;
        routeOptions?: CoreRouterOptions;
        customRoutes?: RouteSpec[],
    }>
) {
    const controllers: Record<string, CoreController> = {};
    const allRoutes: RouteDefinition[] = [];

    for (const resource of resources) {
        const { controllerRegistry, routeDefinitions } = createResource(
            factories,
            resource.schemaName,
            resource
        );

        controllers[resource.schemaName as string] = controllerRegistry[resource.schemaName as string] as CoreController;
        allRoutes.push(...routeDefinitions)
    }

    return {
        controllers,
        routes: allRoutes
    }
}