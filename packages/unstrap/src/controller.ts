import { ZodObject } from "zod";
import { parseFilters, parsePagination, parseSort } from "./request-parser";
import { ControllerMethod, CoreController, FactoryContext, SchemaRegistry } from "./types";
import { createPaginationResponse, createValidationErrorResponse } from "./utils";
import { handleControllerError, handleNotFoundError, validateRequestData } from "./controller-helper";

export function createCoreController<S extends SchemaRegistry>(
    context: FactoryContext<S>,
    schemaName: keyof S,
    extensions?: (ctx: FactoryContext<S>) => Partial<CoreController>
) {

    const { repository, schemas } = context;
    const schema = schemas[schemaName];

    const coreController: CoreController = {
        async find(ctx) {
            try {
                // parse the query
                const query = ctx.req.query;
                const filters = parseFilters(query);
                const pagination = parsePagination(query);
                const sort = parseSort(query);

                // eg: schemaName = api::user.user 
                const { data, total } = await repository(schemaName as string).find({
                    filters,
                    pagination,
                    sort
                })

                const { pageSize, page } = pagination;

                return ctx.res.json({
                    data,
                    meta: {
                        pagination: createPaginationResponse(page, pageSize, total)
                    }
                })

            } catch (error) {
                console.error('Find error:', error);
                return handleControllerError(ctx, error);
            }
        },
        async findOne(ctx) {
            try {
                const id = ctx.req.params.id;
                const repo = repository(schemaName as string);

                const data = await repo.findOne(id);

                if (!data) {
                    return ctx.res.json({ error: 'Not found' }, 404);
                }

                return ctx.res.json({ data });
            } catch (error) {
                console.error('FindOne error:', error);
                return handleControllerError(ctx, error);
            }
        },

        async create(ctx) {
            try {
                const body = await ctx.req.json();

                const validatedBody = validateRequestData(body, 'update');
                if (validatedBody.error) {
                    return ctx.res.json(validatedBody.error, 400);
                }

                let data = body.data;

                // we help do validation on the request here
                const requestSchema = schema?.validation?.request?.create as ZodObject;   // Fallback
                if (requestSchema) {
                    const result = requestSchema.safeParse(data);

                    if (!result.success) {
                        return ctx.res.json(
                            createValidationErrorResponse(result.error),
                            400
                        );
                    }

                    data = result.data; // use zod sanitized data
                }

                // call controller hook before repository hook, if available (beforeCreate)

                if (schema.hooks?.controller?.beforeCreate) {
                    data = await schema.hooks.controller.beforeCreate(ctx, data);
                }


                const repo = repository(schemaName as string);

                // Repo hook will be called inside the repo implementation
                let result = await repo.create(data);

                // call controller hook if available (afterCreate)
                if (schema?.hooks?.controller?.afterCreate) {
                    const hookResult = await schema.hooks.controller.afterCreate(ctx, result);

                    // Check if hook incorrectly returned a Response
                    if (isResponse(hookResult)) {
                        console.error(
                            `[Unstrap] Error: controller.afterCreate hook returned a Response object. ` +
                            `Hooks should return data (not ctx.res.json()). Schema: ${String(schemaName)}`
                        );
                        throw new Error(
                            'Controller hooks must return data, not Response objects. ' +
                            'Do not use ctx.res.json() in hooks.'
                        );
                    }

                    if (hookResult !== undefined) {
                        result = hookResult;
                    }
                }

                return ctx.res.json({ data: result }, 201);

            } catch (error) {
                console.error('Create error:', error);
                return handleControllerError(ctx, error);
            }
        },
        async update(ctx) {
            try {
                const id = ctx.req.params.id;
                const body = await ctx.req.json();

                const validatedBody = validateRequestData(body, 'update');
                if (validatedBody.error) {
                    return ctx.res.json(validatedBody.error, 400);
                }

                let data = body.data;

                const requestSchema = schema?.validation?.request?.update as ZodObject

                if (requestSchema) {
                    const result = requestSchema.safeParse(data);

                    if (!result.success) {
                        return ctx.res.json(
                            createValidationErrorResponse(result.error),
                            400
                        );
                    }


                    data = result.data; // use zod sanitized data, user need to use strict on their schema definition
                }

                // beforeUpdate hook
                if (schema?.hooks?.controller?.beforeUpdate) {
                    const hookResult = await schema.hooks.controller.beforeUpdate(ctx, id, data);
                    if (hookResult !== undefined) {
                        data = hookResult;
                    }
                }

                const repo = repository(schemaName as string);

                let result = await repo.update(id, data);

                if (!result) {
                    return handleNotFoundError(ctx, id);
                }

                // afterUpdate hook
                if (schema?.hooks?.controller?.afterUpdate) {
                    const hookResult = await schema.hooks.controller.afterUpdate(ctx, result);

                    // Check if hook incorrectly returned a Response
                    if (isResponse(hookResult)) {
                        console.error(
                            `[Unstrap] Error: controller.afterUpdate hook returned a Response object. ` +
                            `Schema: ${String(schemaName)}`
                        );
                        throw new Error(
                            'Controller hooks must return data, not Response objects. ' +
                            'Do not use ctx.res.json() in hooks.'
                        );
                    }

                    if (hookResult !== undefined) {
                        result = hookResult;
                    }
                }

                return ctx.res.json({ data: result });
            } catch (error) {
                console.error('Update error:', error);
                return handleControllerError(ctx, error);
            }
        },
        async delete(ctx) {
            try {
                const id = ctx.req.params.id;
                const repo = repository(schemaName as string);

                const data = await repo.delete(id);

                if (!data) {
                    return handleNotFoundError(ctx, id);
                }

                return ctx.res.json({ data });
            } catch (error) {
                console.error('Delete error:', error);
                return handleControllerError(ctx, error);
            }
        },
    }

    if (extensions) {
        const customControllers = extensions(context);
        return {
            ...coreController,
            ...customControllers,
        }
    }

    return coreController;
}


function isResponse(value: any): boolean {
    return value &&
        typeof value === 'object' &&
        (value instanceof Response ||
            value.constructor?.name === 'Response' ||
            (value.status !== undefined && value.headers !== undefined));
}