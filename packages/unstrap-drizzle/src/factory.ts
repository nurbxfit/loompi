import { Repository, RepositoryFactory, SchemaRegistry } from "unstrap";
import { DrizzleRepository } from "./repository";

export function createDrizzleRepositoryFactory(
    db: any,
    schemas: SchemaRegistry,
    options?: {
        dialect?: 'pg' | 'mysql' | "sqlite"
    }
): RepositoryFactory {
    return (schemaName: string): Repository => {
        const dialect = options?.dialect || 'sqlite';
        const schema = schemas[schemaName];

        if (!schema) {
            throw new Error(`Schema not found: ${schemaName}`);
        }

        return new DrizzleRepository(db, schema.tableName, schema, dialect);
    }
}