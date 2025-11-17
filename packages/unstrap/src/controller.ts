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

                const data = body.data;

                // we help do validation here
                if (schema?.validation?.insert) {
                    const insertValidator = schema.validation.insert as ZodObject;
                    const result = insertValidator.safeParse(data);

                    if (!result.success) {
                        return ctx.res.json(
                            createValidationErrorResponse(result.error),
                            400
                        );
                    }
                }


                const repo = repository(schemaName as string);

                const result = await repo.create(data);

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

                const data = body.data;

                if (schema?.validation?.update) {
                    const result = schema.validation.update.safeParse(data);

                    if (!result.success) {
                        return ctx.res.json(
                            createValidationErrorResponse(result.error),
                            400
                        );
                    }
                }

                const repo = repository(schemaName as string);

                const result = await repo.update(id, data);

                if (!result) {
                    return handleNotFoundError(ctx, id);
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
                const body = await ctx.req.json();
                const repo = repository(schemaName as string);

                const data = await repo.delete(id);

                if (!data) {
                    return ctx.res.json({ error: 'Not found' }, 404);
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

