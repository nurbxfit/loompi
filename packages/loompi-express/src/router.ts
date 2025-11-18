import { NextFunction, Request, Response, Router } from "express";
import { ControllerRegistry, createRouterMappings, MiddlewareHandler, RouteDefinition } from "loompi";
import express from 'express'
import { ExpressAdapterOptions, expressToRequestContextAdapter } from "./request";

let httpContext: any;
let multer: any;

try {
    httpContext = require('@sliit-foss/express-http-context');
} catch { }

try {
    multer = require('multer');
} catch { }

export interface CreateRouterOptions extends ExpressAdapterOptions {
    multerConfig?: any; // multer.Options
    useHttpContext?: boolean,
    useMulter?: boolean,
}


export function createRouter(
    routeDefinitions: RouteDefinition[],
    controllers: ControllerRegistry,
    options: CreateRouterOptions = {}
): Router {
    const router = express.Router();

    // apply httpContext if needed
    if (options.useHttpContext && httpContext) {
        router.use(httpContext.middleware);
    }

    // setuo multer if needed
    let upload: any;
    if (options.useMulter && multer) {
        upload = multer(options.multerConfig || { storage: multer.memoryStorage() })
    }

    // setup standard body parsing middleware for req.json()
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }))


    // gen routes mappings
    const mappings = createRouterMappings(routeDefinitions, controllers);

    mappings.forEach((mappings) => {
        const { method, path, handler, middlewares } = mappings

        // convert loompi route handler to express handler
        const expressHandler = async (req: Request, res: Response, next: NextFunction) => {
            try {
                const ctx = expressToRequestContextAdapter(req, res, {
                    useHttpContext: options.useHttpContext,
                    useMulter: options.useMulter
                });

                await handler(ctx);

                // If handler doesn't send a response, call next
                if (!res.headersSent) {
                    next();
                }
            } catch (error) {
                next(error);
            }
        }
        /**
         * TODO assign middlewares based on mappings,
         * convert our own requestContext based middleware into express middlewares
         * type MiddlewareHandler = (ctx: any, next: () => Promise<void>) => Promise<void>;
         * 
         * Need to test this part
         */

        // Convert RequestContext middlewares to Express middlewares
        const expressMiddlewares = middlewares.map((middleware: MiddlewareHandler) => {
            return async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const ctx = expressToRequestContextAdapter(req, res, {
                        useHttpContext: options.useHttpContext,
                        useMulter: options.useMulter
                    });

                    // Wrap Express next() to match RequestContext signature
                    await middleware(ctx, async () => {
                        // Don't call next() here - let middleware control flow
                    });

                    // If middleware doesn't throw or respond, continue
                    if (!res.headersSent) {
                        next();
                    }
                } catch (error) {
                    next(error);
                }
            };
        });


        // Apply multer middleware for file upload routes if configured
        const allMiddlewares = [...expressMiddlewares];

        // detect if route needs file upload based on metadata
        // For now, apply upload.any() to all routes if multer is enabled
        if (options.useMulter && upload) {
            allMiddlewares.unshift(upload.any()); // or upload.single(), upload.array(), etc.
        }

        //attach routes and controller to router

        router[method](path, ...allMiddlewares, expressHandler);
    })
    // assign handler 
    return router;
}