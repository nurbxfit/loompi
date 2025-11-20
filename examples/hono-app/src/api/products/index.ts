import { factories } from "@/lib/factories";
import { createRouter } from "@loompi/hono";
import { Hono } from "hono";
import { createResourceRegistry } from "loompi";


const { routes, controllers } = createResourceRegistry(factories, [
    { schemaName: "api::product.product" }
])

export default createRouter(routes, controllers);

