import { factories } from "@/lib/factories";
import { createRouter } from "@loompi/express";
import { createResourceRegistry } from "loompi";

const { routes, controllers } = createResourceRegistry(factories, [
    { schemaName: "api::user.user" }
])

export default createRouter(routes, controllers, {
    useHttpContext: true,
    useMulter: true,
    multerConfig: {
        limits: { fileSize: 5 * 1024 * 1024 }
    }
})