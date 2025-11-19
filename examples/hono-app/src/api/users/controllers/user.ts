import { factories } from "@/lib/factories";
import { RequestContext } from "loompi";


export default factories.createCoreController("api::user.user", () => ({
    me: async (ctx) => {

        return ctx.res.json({
            me: 'nurbxfit'
        }, 418)
    },
    // Test endpoint that simulates slow operation
    slow: async (ctx: RequestContext) => {
        console.log('🐌 [Controller] slow() called');

        // Simulate slow operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        return ctx.res.json({
            message: 'This took 1 second',
            requestId: ctx.get('requestId'),
        });
    },

    // Test endpoint that always fails
    error: async (ctx: RequestContext) => {
        console.log('💥 [Controller] error() called');
        throw new Error('Simulated error for testing');
    }
}));