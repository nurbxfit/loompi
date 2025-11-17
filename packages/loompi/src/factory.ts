import { createCoreController } from "./controller";
import { createCoreRoutes } from "./route";
import { ControllerMethod, CoreController, CoreRouterOptions, FactoryContext, SchemaName, SchemaRegistry } from "./types";


// S extends SchemaRegistry for better type completion
export function createFactory<S extends SchemaRegistry>(context: FactoryContext<S>) {
    return {
        createCoreController: <T extends keyof S>(
            schemaName: T,
            extensions?: (ctx: FactoryContext<S>) => Partial<CoreController>
        ) => {
            return createCoreController(context, schemaName as string, extensions);
        },
        createCoreRoutes: <T extends keyof S>(
            schemaName: T,
            options?: CoreRouterOptions
        ) => {
            return createCoreRoutes(context, schemaName as string, options) // todo 
        }
    }
}