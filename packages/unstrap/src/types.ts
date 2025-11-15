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

export type PolicyHandler = (ctx: any, next: () => Promise<void>) => Promise<boolean | void>;
export type MiddlewareHandler = (ctx: any, next: () => Promise<void>) => Promise<void>;

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

export type ControllerMethod = (ctx: any) => Promise<any>;

export interface CoreController {
    find: ControllerMethod;
    findOne: ControllerMethod;
    create: ControllerMethod;
    update: ControllerMethod;
    delete: ControllerMethod;
    [key: string]: ControllerMethod;
}

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

export interface FactoryContext {
    repository: Repository;
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