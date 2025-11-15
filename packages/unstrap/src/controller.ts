import { parseFilters, parsePagination, parseSort } from "./request-parser";
import { ControllerMethod, CoreController, FactoryContext, SchemaName } from "./types";
import { createPaginationResponse } from "./utils";

// TODO
export function createCoreController<T extends SchemaName>(
    context: FactoryContext,
    schemaName: T,
    extensions?: (ctx: FactoryContext) => Partial<CoreController> & Record<string, ControllerMethod>
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
                const { data, total } = await repository(schemaName).find({
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
                return ctx.res.json({ error: 'Internal server error' }, 500);
            }
        },
        async findOne(ctx) {
            try {
                const id = ctx.req.params.id;
                const repo = repository(schemaName);

                const data = await repo.findOne(id);

                if (!data) {
                    return ctx.res.json({ error: 'Not found' }, 404);
                }

                return ctx.res.json({ data });
            } catch (error) {
                console.error('FindOne error:', error);
                return ctx.res.json({ error: 'Internal server error' }, 500);
            }
        },
        async create(ctx) {
            try {
                const body = await ctx.req.json();

                // we help do validation here
                if (schema?.validation?.insert) {
                    const result = schema.validation.insert.safeParse(body);

                    if (!result.success) {
                        return ctx.res.json({
                            error: {
                                message: 'Validation failed',
                                details: result.error.format()
                            }
                        }, 400)
                    }
                }


                const repo = repository(schemaName);

                const data = await repo.create(body);

                if (!data) {
                    return ctx.res.json({
                        error: 'Not found',
                    }, 404)
                }

                return ctx.res.json({ data }, 201);
            } catch (error) {
                console.error('Create error:', error);
                return ctx.res.json({ error: 'Internal server error' }, 500);
            }
        },
        async update(ctx) {
            try {
                const id = ctx.req.params.id;
                const body = await ctx.req.json();

                if (schema?.validation?.update) {
                    const result = schema.validation.update.safeParse(body);

                    if (!result.success) {
                        return ctx.res.json({
                            error: {
                                message: 'Validation failed',
                                details: result.error.format()
                            }
                        }, 400)
                    }
                }

                const repo = repository(schemaName);

                const data = await repo.update(id, body);

                if (!data) {
                    return ctx.res.json({ error: 'Not found' }, 404);
                }

                return ctx.res.json({ data });
            } catch (error) {
                console.error('Update error:', error);
                return ctx.res.json({ error: 'Internal server error' }, 500);
            }
        },
        async delete(ctx) {
            try {
                const id = ctx.req.params.id;
                const body = await ctx.req.json();
                const repo = repository(schemaName);

                const data = await repo.delete(id);

                if (!data) {
                    return ctx.res.json({ error: 'Not found' }, 404);
                }

                return ctx.res.json({ data });
            } catch (error) {
                console.error('Update error:', error);
                return ctx.res.json({ error: 'Internal server error' }, 500);
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