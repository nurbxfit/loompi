import { factories } from "@/lib/factories";


export default factories.createCoreController("api::user.user", () => ({
    async me(ctx) {

        ctx.res.status(418)
        return ctx.res.json({
            me: 'nurbxfit'
        })
    }
}));