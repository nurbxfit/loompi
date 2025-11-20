import { mockRepoFactory } from "@/lib/repository";
import { createRouter } from "@loompi/hono";
import { Hono } from "hono";
import { createFactory, createResourceRegistry, defineSchema, SchemaRegistry } from "loompi";

/**
 * Basic usage:
 * 1. define our schemaRegistry
 * 2. create factories
 * 3. create resources
 * 4. attach to main framework (eg: hono) via createRouter
 */

const schemas: SchemaRegistry = {
    "api::mockery.mockery": defineSchema({
        kind: "collectionType",
        collectionName: "mockery",
        tableName: "mockery",
        info: {
            singularName: "mockery",
            pluralName: "mockeries",
            displayName: "mockeries",
        }
    }),
    "api::demo.demo": defineSchema({
        kind: "collectionType",
        collectionName: "demo",
        tableName: "demo",
        info: {
            singularName: "demo",
            pluralName: "demos",
            displayName: "demos",
        }
    })
}

const factories = createFactory({
    repository: mockRepoFactory,
    schemas
})


const { routes, controllers } = createResourceRegistry(factories, [
    {
        schemaName: 'api::mockery.mockery',
    },
    {
        schemaName: 'api::demo.demo',
        controllerExtensions: ({ repository }) => ({
            hello: async (ctx) => {
                const data = repository("api::demo.demo").find({});
                return ctx.res.json({
                    data
                })
            }
        }),
        customRoutes: [
            {
                method: 'GET',
                path: '/demo/hello',
                handler: 'api::demo.demo.hello'
            }
        ]
    },
])

const router = createRouter(routes, controllers);

export default router;

