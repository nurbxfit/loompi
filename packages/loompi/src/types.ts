// Core type definitions
export type SchemaName = string;

export interface RouteSpec {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: string;
    config?: RouteConfig;
}

export interface RouteConfig {
    auth?: boolean;
    policies?: PolicyConfig[];
    middlewares?: MiddlewareConfig[];
}

export type PolicyConfig = string | { name: string; config?: any } | PolicyHandler;
export type MiddlewareConfig = string | { name: string; config?: any } | MiddlewareHandler;

export type PolicyHandler = (ctx: RequestContext, next: () => Promise<void>) => Promise<boolean | void>;
export type MiddlewareHandler = (ctx: RequestContext, next: () => Promise<void>) => Promise<void>;

export interface RouteDefinition {
    routes: RouteSpec[];
}

export interface Repository<T = any> {
    find(options: FindOptions): Promise<{ data: T[]; total: number }>;
    findOne(id: string | number): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: string | number, data: Partial<T>): Promise<T | null>;
    delete(id: string | number): Promise<T | null>;
}

export interface FindOptions {
    filters?: Record<string, any>;
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
    pagination?: { page: number; pageSize: number };
}

export type ControllerMethod = (ctx: RequestContext) => Promise<any>;

export interface CoreController {
    find: ControllerMethod;
    findOne: ControllerMethod;
    create: ControllerMethod;
    update: ControllerMethod;
    delete: ControllerMethod;
    [key: string]: ControllerMethod;
}

export type CustomController = Record<string, ControllerMethod>;

export type ControllerRegistry = Record<string, CoreController>

export type ControllerExtensionsDefinition = Partial<CoreController> & CustomController;

export interface CoreRouterOptions {
    prefix?: string;
    only?: Array<'find' | 'findOne' | 'create' | 'update' | 'delete'>;
    except?: Array<'find' | 'findOne' | 'create' | 'update' | 'delete'>;
    config?: {
        find?: RouteConfig;
        findOne?: RouteConfig;
        create?: RouteConfig;
        update?: RouteConfig;
        delete?: RouteConfig;
    };
}

export interface RouteMapping {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    handler: Function;
    middlewares: MiddlewareHandler[];
    // config: {
    //     auth: boolean;
    //     policies?: any[];
    //     middlewares?: any[];
    // };
}


// Common request contex, we will need framework specific adapter to convert into this context
export interface RequestContext {
    req: {
        method: string;
        path: string;
        query: Record<string, any>;
        params: Record<string, string>;
        headers: Record<string, string>;
        body?: any; // Parsed body (already awaited)
        json: () => Promise<any>;
        text: () => Promise<string>;
        formData?: () => Promise<FormData>;
    };
    res: {
        json: (data: any, status?: number) => Response;
        text: (data: string, status?: number) => Response;
        redirect: (url: string, status?: number) => Response;
        status: (code: number) => Response;
    };
    // For storing middleware data (user, session, etc.) just like what hono did
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    // Raw & framework context (escape door to get into raw requst)
    raw?: any;
    framework?: any
}

export type RepositoryFactory = <T = any>(schemaName: SchemaName) => Repository<T>;

export interface FactoryContext<S extends SchemaRegistry = SchemaRegistry> {
    repository: RepositoryFactory;
    schemas: S
    // service?: any;
    // db?: DatabaseAdapter;
}

// Abstract document Service like strapi .document
// what I had in mind, is the service level, we will wrap the repository
// with extra business logic, like sanitized output, input validation etc
// repository is basically middle ground between service and Databas Adapter
// Database adapter is more raw query like ?? not sure yet
// for now I will just build on repository pattern first.

// not sure yet just an ideas
// interface DocumentService<T> {
//     create(data: any): Promise<T>;
//     find(options: any): Promise<T[]>;
// }

// Abstract database interface (Features for future)

// export interface DatabaseAdapter {
//     select(table: any, options: SelectOptions): Promise<any[]>;
//     insert(table: any, values: any): Promise<any>;
//     update(table: any, id: any, values: any): Promise<any>;
//     delete(table: any, id: any): Promise<any>;
//     count(table: any, filters?: any): Promise<number>;
// }

// export interface SelectOptions {
//     where?: any;
//     orderBy?: Array<{ field: string; order: 'asc' | 'desc' }>;
//     limit?: number;
//     offset?: number;
// }


// ===== For schema definition just like strapi collection-type

/**
 * Controller hooks can modify data for the response
 * IMPORTANT: Do NOT return ctx.res.json() - only return data or void
 */
export type ControllerHook<T = any> = (
    ctx: RequestContext,
    data: T
) => T | void | Promise<T | void>;

// Helper type to extract schema names
export type SchemaRegistry = Record<string, SchemaDefinition>;

export interface SchemaConfig<TTable = any> {
    kind: 'collectionType' | 'singleType';
    collectionName: string;
    tableName: TTable;
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
        description?: string;
    };

    options?: {
        timestamps?: boolean;
        draftAndPublish?: boolean;
    };
    hooks?: {
        repository?: {
            beforeCreate?: (data: any) => any | Promise<any>;
            afterCreate?: (data: any) => void | Promise<void>;
            beforeUpdate?: (id: any, data: any) => any | Promise<any>;
            afterUpdate?: (data: any) => void | Promise<void>;
        };
        controller?: {
            beforeCreate?: ControllerHook;
            afterCreate?: ControllerHook;  // using type check to prevent user return ctx,
            beforeUpdate?: (ctx: RequestContext, id: any, data: any) => any | Promise<any>;
            afterUpdate?: ControllerHook;
        };
    };

    validation?: {
        // New structure
        db?: {
            insert?: any;  // Zod schema
            update?: any;  // Zod schema
        };
        request?: {
            create?: any;  // Zod schema
            update?: any;  // Zod schema
            // updateAdmin?: any;  // TODO:: Optional admin schema
            // [key: string]: any;  // TODO :: Allow custom validation schemas
        };

    };
}

export interface SchemaDefinition<TTable = any> extends SchemaConfig<TTable> {
    // Additional runtime properties added by factory
    _validated: true;
}


// === FOR STANDARDISE ERROR FORMAT ==== 
// packages/loompi/src/types.ts
export interface ErrorResponse {
    error: {
        message: string; //'Invalid request format',
        details?: any; // 'Request body must contain a "data" field',
        statusCode?: number; // 400,
        fields?: Array<{
            field: string;
            message: string;
            code: string;
        }>;
        example?: any;
    };
}

