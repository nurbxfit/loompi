import { loggingMiddleware, timingMiddleware } from "@/lib/middlewares";
import { createCustomRoutes } from "loompi";

export default createCustomRoutes([
    {
        method: 'GET',
        path: '/users/me',
        handler: "api::user.user.me",
        config: {
            middlewares: [],
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/users/slow',
        handler: 'api::user.user.slow',
        config: {
            middlewares: [
                loggingMiddleware,
                timingMiddleware,
            ]
        }
    },
    {
        method: 'GET',
        path: '/users/error',
        handler: 'api::user.user.error',
        config: {
            middlewares: [
                loggingMiddleware,
            ]
        }
    }
])