import { createCustomRoutes } from "unstrap";

export default createCustomRoutes([
    {
        method: 'GET',
        path: '/users/me',
        handler: "api::user.user.me",
        config: {
            middlewares: [],
            policies: []
        }
    }
])