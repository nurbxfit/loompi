import { createCoreController } from "./controller";
import { createCoreRoutes, createCustomeRoutes } from "./route";
import { ControllerMethod, CoreController, CoreRouterOptions, FactoryContext, SchemaName } from "./types";


export function createFactory(context: FactoryContext) {
    return {
        createCoreController: <T extends keyof typeof context.schemas>(schemaName: T, extensions?: (ctx: FactoryContext) => Partial<CoreController> & Record<string, ControllerMethod>) => {
            return createCoreController(context, schemaName, extensions);
        },
        createCoreRoutes: <T extends SchemaName>(
            schemaName: T,
            options?: CoreRouterOptions
        ) => {
            return createCoreRoutes() // todo 
        },
        createCustomeRoutes: () => {
            return createCustomeRoutes(); // todo
        }
    }
}