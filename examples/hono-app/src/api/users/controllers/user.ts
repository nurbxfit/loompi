import { factories } from "@/lib/factories";


export default factories.createCoreController("api::user.user", () => ({
    async me(ctx) {

        return ctx.res.json({
            me: 'nurbxfit'
        }, 418)
    }
}));