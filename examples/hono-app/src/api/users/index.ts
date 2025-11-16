import { createRouter } from "@unstrap/hono";
import { Hono } from "hono";
import userRoutes from '@/api/users/routes/user';
import userController from '@/api/users/controllers/user';
import { ControllerRegistry, CoreController } from "unstrap";

const controllers: ControllerRegistry = {
    "api::user.user": userController as CoreController
}
const app = new Hono();

const router = createRouter(app, [userRoutes], controllers)

export default router;