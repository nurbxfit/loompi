import { createRouter } from "@loompi/hono";
import { Hono } from "hono";
import userRoutes from '@/api/users/routes/user';
import customUserRoutes from '@/api/users/routes/custom-user';
import userController from '@/api/users/controllers/user';
import { ControllerRegistry, CoreController } from "loompi";

const controllers: ControllerRegistry = {
    "api::user.user": userController as CoreController
}
const app = new Hono();

const router = createRouter([customUserRoutes, userRoutes], controllers)

export default router;