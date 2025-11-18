// examples/hono-app/src/api/users/routes/user.ts

import { factories } from "@/lib/factories";
import { enrichmentMiddleware, loggingMiddleware, timingMiddleware, validateQueryMiddleware } from "@/lib/middlewares";

export default factories.createCoreRoutes("api::user.user", {
    config: {
        find: {
            middlewares: [
                loggingMiddleware,
                timingMiddleware,
                validateQueryMiddleware,
                enrichmentMiddleware,
            ]
        }
    }
}) // TODO how do I get type completion here ?? 