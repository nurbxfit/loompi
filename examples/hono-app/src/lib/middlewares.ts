/**
 * Example Middlewares, to test if loompi middlewares working correctly
 */

import { MiddlewareHandler } from "loompi";

// Test middleware : Logging
export const loggingMiddleware: MiddlewareHandler = async (ctx, next) => {
    console.log('🔵 [Logging Middleware] START');
    console.log('   Method:', ctx.req.method);
    console.log('   Path:', ctx.req.path);
    console.log('   Query:', ctx.req.query);

    await next(); // Continue to next middleware/controller

    console.log('🔵 [Logging Middleware] END');
}

// Test middleware 2: Timing
export const timingMiddleware: MiddlewareHandler = async (ctx, next) => {
    const start = Date.now();
    console.log('⏱️  [Timing Middleware] Request started');

    await next();

    const duration = Date.now() - start;
    console.log(`⏱️  [Timing Middleware] Request took ${duration}ms`);
};

// Test middleware 3: Auth simulation (sets user in context)
export const authMiddleware: MiddlewareHandler = async (ctx, next) => {
    console.log('🔐 [Auth Middleware] Checking authorization...');

    const token = ctx.req.headers['authorization'];

    if (!token) {
        console.log('❌ [Auth Middleware] No token provided');
        ctx.res.json({ error: 'Unauthorized - No token' }, 401);
    }

    // Simulate token validation
    const user = { id: 1, name: 'Test User', token };
    ctx.set('user', user);
    console.log('✅ [Auth Middleware] User authenticated:', user.name);

    await next();
};

// Test middleware 4: Request enrichment
export const enrichmentMiddleware: MiddlewareHandler = async (ctx, next) => {
    console.log('💎 [Enrichment Middleware] Adding metadata...');

    ctx.set('requestId', crypto.randomUUID());
    ctx.set('timestamp', new Date().toISOString());

    await next();
};

// Test middleware 5: Query parameter validator
export const validateQueryMiddleware: MiddlewareHandler = async (ctx, next) => {
    console.log('🔍 [Validator Middleware] Checking query params...');

    const { limit } = ctx.req.query;

    // testing middleware throwing error

    if (limit && Number(limit) > 100) {
        console.log('❌ [Validator Middleware] Limit too high');
        //  Early exit
        // in hono we need to return Request object, we cannot return empty
        return ctx.res.json({
            error: 'Invalid query parameter',
            details: 'Limit cannot exceed 100'
        }, 400);

    }

    console.log('✅ [Validator Middleware] Query params valid');
    await next();
};